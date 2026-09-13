import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '25mb' }));

// Lazy initialization of Gemini client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// 1. Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasGemini: !!process.env.GEMINI_API_KEY,
    hasDefaultSmtp: !!process.env.SMTP_HOST,
  });
});

// 2. AI Cold Email Sequence Generator
app.post('/api/ai/generate-sequence', async (req, res) => {
  try {
    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({
        error: 'Gemini API key is not configured in the environment. Please configure GEMINI_API_KEY in the Secrets panel.',
      });
    }

    const { productDescription, targetAudience, valueProposition, tone = 'direct and friendly', stepCount = 4 } = req.body;

    const prompt = `You are a world-class cold email deliverability and conversion copywriter.
Create a high-performing ${stepCount}-step cold email campaign sequence with automated follow-ups.

Product/Service: ${productDescription || 'B2B software platform'}
Target Persona/Audience: ${targetAudience || 'Heads of Growth, VP Sales, Founders'}
Core Value Proposition: ${valueProposition || 'Double pipeline without increasing headcount'}
Tone: ${tone}

Requirements:
- Step 1: Initial cold outreach (0 delay). Under 100 words. Personalized hook, specific pain point, frictionless question CTA.
- Step 2: First automated follow-up (wait 3 days). Under 80 words. Different angle or social proof.
- Step 3: Second automated follow-up (wait 4 days). Short, low-pressure, offer a free resource or 2-page teardown.
${stepCount >= 4 ? '- Step 4: Final breakup email (wait 5 days). Polite permission to close file, leaves door open.\n' : ''}
Use merge tags where appropriate: {{firstName}}, {{company}}, {{jobTitle}}, {{industry}}, {{customIcebreaker}}, {{painPoint}}.
You can also include natural spintax in greetings or subject lines, like {Hi|Hey} or {Quick question|Thoughts on this}.
Never use generic spam words like "100% free", "guaranteed", "act now", "cash bonus". Keep subject lines short (2-5 words) and natural.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: 'You write brief, punchy, high-response B2B cold email sequences that avoid spam filters.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            campaignName: { type: Type.STRING },
            steps: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  stepNumber: { type: Type.INTEGER },
                  type: { type: Type.STRING },
                  delayDays: { type: Type.INTEGER },
                  subject: { type: Type.STRING },
                  body: { type: Type.STRING },
                  rationale: { type: Type.STRING },
                },
                required: ['stepNumber', 'delayDays', 'subject', 'body'],
              },
            },
          },
          required: ['campaignName', 'steps'],
        },
      },
    });

    const parsed = JSON.parse(response.text?.trim() || '{}');
    res.json(parsed);
  } catch (error: unknown) {
    console.error('Error generating sequence:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: 'Failed to generate campaign sequence: ' + message });
  }
});

// 3. AI Bulk Icebreaker Generator for imported leads
app.post('/api/ai/generate-icebreakers', async (req, res) => {
  try {
    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({ error: 'Gemini API key is not configured.' });
    }

    const { leads = [], productContext = '' } = req.body;
    if (!Array.isArray(leads) || leads.length === 0) {
      return res.status(400).json({ error: 'No leads provided' });
    }

    const leadsInput = leads.slice(0, 15).map((l: Record<string, unknown>, idx: number) => ({
      index: idx,
      name: `${l.firstName || ''} ${l.lastName || ''}`.trim(),
      company: l.company || '',
      jobTitle: l.jobTitle || '',
      industry: l.industry || '',
      city: l.city || '',
      notes: l.notes || '',
    }));

    const prompt = `You are a cold email personalization specialist.
Generate a genuine, hyper-personalized 1-sentence opening icebreaker for each of the following leads.
Product context being offered: ${productContext || 'B2B growth and software solutions'}.

Lead list:
${JSON.stringify(leadsInput, null, 2)}

Rules:
- Exactly 1 sentence per lead.
- Ground it in their company, job title, industry, or notes.
- Sound like a human who did 2 minutes of authentic research, not an AI template.
- No cheesy flatteries. Keep it respectful, intelligent, and natural.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              index: { type: Type.INTEGER },
              icebreaker: { type: Type.STRING },
            },
            required: ['index', 'icebreaker'],
          },
        },
      },
    });

    const parsed = JSON.parse(response.text?.trim() || '[]');
    res.json({ results: parsed });
  } catch (error: unknown) {
    console.error('Error generating icebreakers:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: 'Failed to generate icebreakers: ' + message });
  }
});

// 4. AI Subject Line Optimizer
app.post('/api/ai/optimize-subject', async (req, res) => {
  try {
    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({ error: 'Gemini API key is not configured.' });
    }

    const { targetAudience, valueProposition, currentSubject } = req.body;

    const prompt = `Suggest 5 cold email subject lines for:
Audience: ${targetAudience || 'B2B decision makers'}
Value Proposition: ${valueProposition || 'Improve workflow efficiency'}
Current Subject: ${currentSubject || 'Quick question'}

Best practices:
- 2 to 6 words max.
- Lowercase or sentence case looks more authentic and personal.
- Include personalization tags like {{company}} or {{firstName}} where natural.
- Avoid spam triggers like "Guaranteed", "Free", "Urgent".
- Give an estimated open-rate rating (High / Very High) and a 1-sentence explanation why it works.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              subject: { type: Type.STRING },
              estimatedOpenRate: { type: Type.STRING },
              category: { type: Type.STRING },
              whyItWorks: { type: Type.STRING },
            },
            required: ['subject', 'estimatedOpenRate', 'whyItWorks'],
          },
        },
      },
    });

    const parsed = JSON.parse(response.text?.trim() || '[]');
    res.json({ subjectLines: parsed });
  } catch (error: unknown) {
    console.error('Error optimizing subject line:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: 'Failed to generate subject lines: ' + message });
  }
});

// 5. AI Polish / Shorten Email Body
app.post('/api/ai/polish-email', async (req, res) => {
  try {
    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({ error: 'Gemini API key is not configured.' });
    }

    const { text, goal = 'shorten' } = req.body;

    let instruction = 'Shorten this email so it can be read in under 20 seconds on a phone (60-90 words).';
    if (goal === 'conversational') {
      instruction = 'Rewrite this email to sound more relaxed, human, and conversational, like a peer emailing a colleague.';
    } else if (goal === 'stronger_cta') {
      instruction = 'Refine the email to end with an ultra low-friction, interest-based call to action (e.g. "Worth a peek?").';
    } else if (goal === 'fix_spam') {
      instruction = 'Remove any salesy or promotional language that could trigger spam filters, while keeping the core pitch intact.';
    }

    const prompt = `${instruction}
IMPORTANT: Preserve all existing variable tags like {{firstName}}, {{company}}, {{customIcebreaker}} and spintax like {Hi|Hey}.

Original text:
${text}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: 'You are an expert cold email editor. Output only the improved email text with no introductory pleasantries.',
      },
    });

    res.json({ polishedText: response.text?.trim() || text });
  } catch (error: unknown) {
    console.error('Error polishing email:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: 'Failed to polish email: ' + message });
  }
});

// 6. SMTP Verification
app.post('/api/smtp/verify', async (req, res) => {
  const { host, port, secure, user, pass } = req.body;

  if (!host || !user || !pass) {
    return res.status(400).json({ success: false, error: 'Host, username, and password are required' });
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port: Number(port) || 587,
      secure: Boolean(secure),
      auth: { user, pass },
      connectionTimeout: 8000,
    });

    await transporter.verify();
    res.json({ success: true, message: 'SMTP connection verified successfully!' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Connection failed';
    res.json({ success: false, error: message });
  }
});

// 7. Dispatch Email (Real SMTP or Sandboxed / Simulated)
app.post('/api/smtp/send', async (req, res) => {
  const { smtpConfig, email, isSimulated = true } = req.body;

  const { to, subject, body, fromName, fromEmail, replyTo, attachments } = email || {};

  if (!to || !subject || !body) {
    return res.status(400).json({ success: false, error: 'Recipient, subject, and body are required.' });
  }

  // Format attachments for Nodemailer
  const mailAttachments = Array.isArray(attachments)
    ? attachments
        .filter((att) => att && (att.base64Data || att.content))
        .map((att) => ({
          filename: att.name || 'document.pdf',
          content: att.base64Data ? Buffer.from(att.base64Data, 'base64') : att.content,
          contentType: att.mimeType || 'application/pdf',
        }))
    : [];

  // If real SMTP is configured and user opted out of simulation
  if (!isSimulated && smtpConfig?.host && smtpConfig?.user && smtpConfig?.pass) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpConfig.host,
        port: Number(smtpConfig.port) || 587,
        secure: Boolean(smtpConfig.secure),
        auth: {
          user: smtpConfig.user,
          pass: smtpConfig.pass,
        },
      });

      const isHtml = /<[a-z][\s\S]*>/i.test(body);
      const info = await transporter.sendMail({
        from: `"${fromName || smtpConfig.fromName || 'Outreach'}" <${fromEmail || smtpConfig.fromEmail || smtpConfig.user}>`,
        to,
        replyTo: replyTo || fromEmail || smtpConfig.replyTo,
        subject,
        text: isHtml ? body.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim() : body,
        html: isHtml ? body : undefined,
        attachments: mailAttachments,
      });

      return res.json({
        success: true,
        isSimulated: false,
        messageId: info.messageId,
        response: info.response,
        attachmentsCount: mailAttachments.length,
      });
    } catch (error: unknown) {
      console.error('SMTP Send Error:', error);
      const message = error instanceof Error ? error.message : 'SMTP delivery failed';
      return res.status(500).json({ success: false, error: message });
    }
  }

  // Sandbox / Simulated send mode
  // Generates realistic delivery event
  const simulatedId = `sim_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  return res.json({
    success: true,
    isSimulated: true,
    messageId: simulatedId,
    deliveredAt: new Date().toISOString(),
    status: 'delivered',
    attachmentsCount: mailAttachments.length,
  });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Cold Mail Campaign Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
