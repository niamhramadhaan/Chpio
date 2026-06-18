import { Router } from 'express';
import { getAccount, upsertMessage } from '../db';
import { sendEmail, testSmtpConnection } from '../smtp';
import type { EmailAccountConfig } from '../types';

export const sendRouter = Router();

// Send email
sendRouter.post('/:id/send', async (req, res) => {
  try {
    const row = getAccount(req.params.id);
    if (!row) return res.status(404).json({ error: 'Account not found' });

    const config = row.config as unknown as EmailAccountConfig;
    const { to, subject, textBody, htmlBody, inReplyTo, references } = req.body;

    if (!to || !subject || !textBody) {
      return res.status(400).json({ error: 'to, subject, and textBody are required' });
    }

    const result = await sendEmail(config, to, subject, textBody, htmlBody, inReplyTo, references);

    if (!result.ok) {
      return res.status(500).json({ error: result.error });
    }

    // Save to sent folder cache
    try {
      upsertMessage({
        account_id: config.id,
        folder: 'Sent',
        uid: Date.now(), // Approximate UID for sent messages
        message_id: `sent-${Date.now()}@chpio`,
        from_name: config.name,
        from_address: config.email,
        to_addrs: JSON.stringify(to.map((addr: string) => ({ name: '', address: addr }))),
        subject,
        snippet: textBody.slice(0, 200),
        date: Date.now(),
        is_read: 1,
        is_starred: 0,
        has_attachments: 0,
        triage: null,
        tags: null,
        synced_at: Date.now(),
      });
    } catch { /* non-critical */ }

    res.json({ ok: true, message: 'Email sent' });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to send email' });
  }
});

// Test SMTP connection
sendRouter.post('/test-smtp', async (req, res) => {
  try {
    const result = await testSmtpConnection(req.body);
    res.json(result);
  } catch (err) {
    res.status(500).json({ ok: false, error: err instanceof Error ? err.message : 'Test failed' });
  }
});
