import nodemailer from 'nodemailer';
import type { EmailAccountConfig } from './types';

export async function sendEmail(
  config: EmailAccountConfig,
  to: string[],
  subject: string,
  textBody: string,
  htmlBody?: string,
  inReplyTo?: string,
  references?: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const transporter = nodemailer.createTransport({
      host: config.smtpHost,
      port: config.smtpPort,
      secure: config.smtpSecure,
      auth: { user: config.username, pass: config.password },
    });

    const headers: Record<string, string> = {};
    if (inReplyTo) headers['In-Reply-To'] = inReplyTo;
    if (references) headers['References'] = references;

    await transporter.sendMail({
      from: `"${config.name}" <${config.email}>`,
      to: to.join(', '),
      subject,
      text: textBody,
      html: htmlBody || textBody.replace(/\n/g, '<br>'),
      headers,
    });

    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Send failed' };
  }
}

export async function testSmtpConnection(config: { smtpHost: string; smtpPort: number; smtpSecure: boolean; username: string; password: string }): Promise<{ ok: boolean; error?: string }> {
  try {
    const transporter = nodemailer.createTransport({
      host: config.smtpHost,
      port: config.smtpPort,
      secure: config.smtpSecure,
      auth: { user: config.username, pass: config.password },
    });
    await transporter.verify();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'SMTP connection failed' };
  }
}
