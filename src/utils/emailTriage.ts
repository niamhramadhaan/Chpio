import type { EmailMessage } from '../types';

type StreamChunk = { type: 'content' | 'thinking'; text: string };
type StreamFn = (messages: { role: 'system' | 'user' | 'assistant'; content: string }[]) => AsyncGenerator<StreamChunk>;

export interface TriageResult {
  triage: 'urgent' | 'fyi' | 'newsletter' | 'spam';
  tags: string[];
}

export async function triageEmail(
  message: EmailMessage,
  streamFn: StreamFn,
): Promise<TriageResult | null> {
  const senderName = message.from.name || message.from.address;
  const subject = message.subject || '(no subject)';
  const snippet = (message.snippet || '').slice(0, 300);

  const messages = [
    {
      role: 'system' as const,
      content: `You are an email classifier. Analyze the email and output EXACTLY two lines:

Line 1: TRIAGE: [urgent|fyi|newsletter|spam]
Line 2: TAGS: tag1, tag2, tag3

Rules:
- "urgent" = needs action or reply soon, from a real person
- "fyi" = informational, no action needed, from a real person
- "newsletter" = automated mailing list, marketing, digest
- "spam" = unsolicited, suspicious, phishing
- Tags should be 1-3 short labels (e.g. "work", "project-x", "invoice", "meeting")
- Output ONLY the two lines, nothing else`,
    },
    {
      role: 'user' as const,
      content: `From: ${senderName} <${message.from.address}>
Subject: ${subject}
Preview: ${snippet}`,
    },
  ];

  try {
    const timeoutPromise = new Promise<never>((_, reject) => {
      const id = setTimeout(() => { clearTimeout(id); reject(new Error('Triage timeout')); }, 10000);
    });

    let result = '';
    const streamPromise = (async () => {
      for await (const chunk of streamFn(messages)) {
        if (chunk.type === 'content') result += chunk.text;
      }
    })();

    await Promise.race([streamPromise, timeoutPromise]);

    const lines = result.trim().split('\n').map((l) => l.trim());

    // Parse triage
    const triageLine = lines.find((l) => l.startsWith('TRIAGE:'));
    const tagsLine = lines.find((l) => l.startsWith('TAGS:'));

    if (!triageLine) return null;

    const triageValue = triageLine.replace('TRIAGE:', '').trim().toLowerCase();
    if (!['urgent', 'fyi', 'newsletter', 'spam'].includes(triageValue)) return null;

    const tags = tagsLine
      ? tagsLine.replace('TAGS:', '').split(',').map((t) => t.trim().toLowerCase()).filter(Boolean).slice(0, 3)
      : [];

    return { triage: triageValue as TriageResult['triage'], tags };
  } catch (err) {
    console.error('[emailTriage] Failed:', err);
    return null;
  }
}
