/**
 * Robust Email parser for pasting 150+ bulk emails
 * Handles commas, newlines, semicolons, tabs, and format like 'Name <name@domain.com>'
 * Automatically detects and strips duplicates: "send smarter • avoid duplicates"
 */

export interface BulkParseResult {
  allEmails: string[];
  uniqueEmails: string[];
  duplicateCount: number;
  invalidEntries: string[];
  gmailCount: number;
  nonGmailCount: number;
}

const EMAIL_REGEX = /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+/gi;

export function parseBulkEmails(rawText: string): BulkParseResult {
  if (!rawText || !rawText.trim()) {
    return {
      allEmails: [],
      uniqueEmails: [],
      duplicateCount: 0,
      invalidEntries: [],
      gmailCount: 0,
      nonGmailCount: 0,
    };
  }

  // 1. Extract all regex matches for valid email syntax
  const matches = rawText.match(EMAIL_REGEX) || [];
  const normalizedEmails = matches.map((e) => e.trim().toLowerCase());

  // 2. Identify duplicates
  const seen = new Set<string>();
  const uniqueEmails: string[] = [];
  let duplicateCount = 0;

  for (const email of normalizedEmails) {
    if (seen.has(email)) {
      duplicateCount++;
    } else {
      seen.add(email);
      uniqueEmails.push(email);
    }
  }

  // 3. Detect invalid tokens (split by common delimiters)
  const rawTokens = rawText
    .split(/[\n\r,;\t ]+/)
    .map((t) => t.trim().replace(/[<>"']/g, ''))
    .filter((t) => t.length > 0 && t.includes('@'));

  const invalidEntries: string[] = [];
  for (const token of rawTokens) {
    const isMatched = normalizedEmails.some((valid) => token.toLowerCase().includes(valid));
    if (!isMatched && token.length > 3) {
      invalidEntries.push(token);
    }
  }

  // 4. Count gmail addresses
  const gmailCount = uniqueEmails.filter((e) => e.endsWith('@gmail.com') || e.endsWith('@googlemail.com')).length;
  const nonGmailCount = uniqueEmails.length - gmailCount;

  return {
    allEmails: normalizedEmails,
    uniqueEmails,
    duplicateCount,
    invalidEntries: Array.from(new Set(invalidEntries)),
    gmailCount,
    nonGmailCount,
  };
}
