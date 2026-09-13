import { Lead, SpamAnalysisResult } from '../types';

/**
 * Resolves spintax such as {Hi|Hello|Hey} using a deterministic seed (e.g. lead id or email)
 * so previews and sends for the same lead are consistent.
 */
export function resolveSpintax(text: string, seed: string = 'default'): string {
  if (!text) return '';
  const spintaxRegex = /\{([^{}]+)\}/g;

  // Simple numeric hash from string for stable selection
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  let counter = Math.abs(hash);

  return text.replace(spintaxRegex, (_, choicesStr) => {
    const choices = choicesStr.split('|');
    if (choices.length === 0) return '';
    const selected = choices[counter % choices.length];
    counter = Math.floor(counter / choices.length) + 7;
    return selected;
  });
}

/**
 * Resolves personalization tags such as {{firstName}}, {{company}}, {{jobTitle|colleague}}
 */
export function renderTemplate(template: string, lead: Partial<Lead>, fallbackDefaults: Record<string, string> = {}): string {
  if (!template) return '';

  // 1. Resolve spintax first
  const spintaxResolved = resolveSpintax(template, lead.id || lead.email || 'preview');

  // 2. Resolve merge variables
  const variableRegex = /\{\{\s*([a-zA-Z0-9_]+)(?:\|([^}]+))?\s*\}\}/g;

  return spintaxResolved.replace(variableRegex, (_, key, fallback) => {
    const normalizedKey = key.trim();
    const leadValue = (lead as Record<string, unknown>)[normalizedKey];

    if (leadValue !== undefined && leadValue !== null && String(leadValue).trim() !== '') {
      return String(leadValue).trim();
    }

    if (fallback !== undefined) {
      return fallback.trim();
    }

    if (fallbackDefaults[normalizedKey]) {
      return fallbackDefaults[normalizedKey];
    }

    // Default friendly fallbacks
    switch (normalizedKey) {
      case 'firstName':
        return 'there';
      case 'company':
        return 'your company';
      case 'jobTitle':
        return 'leader';
      case 'industry':
        return 'your space';
      case 'senderName':
        return 'The Team';
      default:
        return `[${normalizedKey}]`;
    }
  });
}

// Common cold email spam triggers
const SPAM_TRIGGERS = [
  { phrase: '100% free', penalty: 15, reason: 'High-risk commercial promise' },
  { phrase: 'free money', penalty: 25, reason: 'Critical spam filter trigger' },
  { phrase: 'guarantee', penalty: 10, reason: 'Aggressive sales guarantee' },
  { phrase: 'risk free', penalty: 12, reason: 'Classic marketing trigger' },
  { phrase: 'act now', penalty: 15, reason: 'False urgency trigger' },
  { phrase: 'urgent', penalty: 10, reason: 'Artificial urgency' },
  { phrase: 'exclusive deal', penalty: 12, reason: 'Promotional filter trigger' },
  { phrase: 'cash bonus', penalty: 20, reason: 'Financial spam trigger' },
  { phrase: 'click here', penalty: 10, reason: 'Generic link anchor text' },
  { phrase: 'double your', penalty: 12, reason: 'Exaggerated outcome claim' },
  { phrase: 'no cost', penalty: 8, reason: 'Price-focused spam flag' },
  { phrase: 'make money', penalty: 18, reason: 'Opportunity spam flag' },
  { phrase: 'unlimited', penalty: 8, reason: 'Overpromising terminology' },
  { phrase: 'buy now', penalty: 15, reason: 'Hard-sell direct CTA' },
  { phrase: 'winner', penalty: 20, reason: 'Deceptive reward trigger' },
];

/**
 * Analyzes subject and body for cold email deliverability best practices
 */
export function analyzeSpamAndDeliverability(subject: string, body: string): SpamAnalysisResult {
  let score = 100;
  const flags: SpamAnalysisResult['flags'] = [];
  const suggestions: string[] = [];

  const combined = `${subject} ${body}`.toLowerCase();
  const wordCount = body.trim().split(/\s+/).filter(Boolean).length;
  const readingTimeSeconds = Math.max(1, Math.round(wordCount / 3.5)); // ~210 wpm

  // Check spam words
  for (const trigger of SPAM_TRIGGERS) {
    if (combined.includes(trigger.phrase)) {
      score -= trigger.penalty;
      flags.push({
        word: trigger.phrase,
        reason: trigger.reason,
        type: 'spam_word',
      });
    }
  }

  // Check subject line capitalization
  if (subject && subject.length > 5 && subject === subject.toUpperCase()) {
    score -= 20;
    flags.push({
      word: 'ALL CAPS SUBJECT',
      reason: 'Subject lines in full uppercase are aggressively flagged by Gmail and Outlook',
      type: 'formatting',
    });
    suggestions.push('Change subject line to sentence case or lower case for a conversational feel');
  }

  // Check excessive exclamation marks
  const exclamationCount = (combined.match(/!/g) || []).length;
  if (exclamationCount > 2) {
    score -= Math.min(20, exclamationCount * 5);
    flags.push({
      word: `${exclamationCount} exclamation marks`,
      reason: 'Multiple exclamation marks significantly hurt inbox deliverability',
      type: 'formatting',
    });
    suggestions.push('Limit exclamation marks to at most 1, or rely purely on conversational punctuation');
  }

  // Check word count ideal for cold email (75 - 130 words)
  if (wordCount > 175) {
    score -= 10;
    flags.push({
      word: `${wordCount} words`,
      reason: 'Cold emails over 175 words suffer 40% lower response rates on mobile',
      type: 'length',
    });
    suggestions.push('Aim for 60 to 120 words. Cold outreach is a short spark, not an essay');
  } else if (wordCount < 25 && wordCount > 0) {
    score -= 5;
    suggestions.push('Provide just enough context about who you are and why you reached out');
  }

  // Personalization variable check
  const varsFound = (body.match(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g) || []).length;
  if (varsFound === 0 && body.length > 0) {
    score -= 8;
    suggestions.push('Add at least {{firstName}} and {{company}} to avoid appearing like an untargeted blast');
  } else if (varsFound >= 1) {
    // Good personalization
  }

  // Check question CTA at the end
  const trimmedBody = body.trim();
  const endsWithQuestion = trimmedBody.endsWith('?') || trimmedBody.slice(-60).includes('?');
  if (!endsWithQuestion && trimmedBody.length > 50) {
    suggestions.push('Include a low-friction question CTA at the end (e.g., "Worth a 3-min chat Tuesday?")');
  }

  score = Math.max(10, Math.min(100, score));

  let rating: SpamAnalysisResult['rating'] = 'excellent';
  if (score < 60) rating = 'high_risk';
  else if (score < 80) rating = 'moderate';
  else if (score < 92) rating = 'good';

  return {
    score,
    rating,
    flags,
    wordCount,
    readingTimeSeconds,
    personalizedVariablesCount: varsFound,
    suggestions,
  };
}
