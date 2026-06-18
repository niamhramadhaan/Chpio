import { ImapFlow } from 'imapflow';
import type { EmailAccountConfig } from './types';

const connections = new Map<string, ImapFlow>();

export async function getConnection(config: EmailAccountConfig): Promise<ImapFlow> {
  const existing = connections.get(config.id);
  if (existing && existing.usable) return existing;

  const client = new ImapFlow({
    host: config.imapHost,
    port: config.imapPort,
    secure: config.imapSecure,
    auth: { user: config.username, pass: config.password },
    logger: false,
  });

  await client.connect();
  connections.set(config.id, client);
  return client;
}

export async function closeConnection(id: string): Promise<void> {
  const client = connections.get(id);
  if (client) {
    try { await client.logout(); } catch { /* ignore */ }
    connections.delete(id);
  }
}

export async function listFolders(config: EmailAccountConfig): Promise<any[]> {
  const client = await getConnection(config);
  const folders: any[] = [];
  for await (const mailbox of client.list()) {
    folders.push({
      name: mailbox.name,
      path: mailbox.path,
      delimiter: mailbox.delimiter,
      specialUse: (mailbox as any).specialUse,
    });
  }
  return folders;
}

export async function getFolderStatus(config: EmailAccountConfig, folderPath: string): Promise<{ unreadCount: number; totalCount: number }> {
  const client = await getConnection(config);
  const status = await client.status(folderPath, { messages: true, unseen: true });
  return { unreadCount: status.unseen || 0, totalCount: status.messages || 0 };
}

export async function fetchMessages(config: EmailAccountConfig, folderPath: string, limit = 50, since?: Date): Promise<any[]> {
  const client = await getConnection(config);
  const lock = await client.getMailboxLock(folderPath);

  try {
    const messages: any[] = [];
    const searchCriteria = since ? { since } : { all: true };
    const fetchOptions = {
      uid: true,
      envelope: true,
      source: true,
      flags: true,
    };

    let count = 0;
    // Fetch in reverse (newest first) by using sequence range
    const mailbox = client.mailbox;
    const total = mailbox.exists;

    if (total === 0) return messages;

    // Use uid-based fetch with reverse iteration
    for await (const msg of client.fetch(searchCriteria, fetchOptions, { sort: ['-date'] })) {
      if (count >= limit) break;

      const envelope = msg.envelope || {};
      const from = envelope.from?.[0] || { name: '', address: '' };

      let snippet = '';
      let htmlBody = '';
      let textBody = '';
      let hasAttachments = false;
      const attachments: any[] = [];

      if (msg.source) {
        try {
          const { default: PostalMime } = await import('postal-mime');
          const parsed = await PostalMime.parse(msg.source as Buffer);
          snippet = (parsed.text || '').slice(0, 200).replace(/\n/g, ' ').trim();
          htmlBody = parsed.html || '';
          textBody = parsed.text || '';
          hasAttachments = (parsed.attachments?.length || 0) > 0;
          for (const att of parsed.attachments || []) {
            attachments.push({
              partId: att.contentId || att.filename || 'attachment',
              filename: att.filename || 'attachment',
              mimeType: att.mimeType || 'application/octet-stream',
              size: att.content?.length || 0,
            });
          }
        } catch {
          snippet = '(Unable to parse message)';
        }
      }

      messages.push({
        uid: msg.uid,
        messageId: envelope.messageId || '',
        folder: folderPath,
        from: { name: from.name || '', address: from.address || '' },
        to: (envelope.to || []).map((t: any) => ({ name: t.name || '', address: t.address || '' })),
        subject: envelope.subject || '(no subject)',
        snippet,
        htmlBody,
        textBody,
        date: envelope.date ? new Date(envelope.date).getTime() : Date.now(),
        isRead: msg.flags?.has('\\Seen') || false,
        isStarred: msg.flags?.has('\\Flagged') || false,
        hasAttachments,
        attachments,
      });

      count++;
    }

    return messages;
  } finally {
    lock.release();
  }
}

export async function updateFlags(config: EmailAccountConfig, folderPath: string, uid: number, flags: { seen?: boolean; flagged?: boolean }): Promise<void> {
  const client = await getConnection(config);
  const lock = await client.getMailboxLock(folderPath);
  try {
    if (flags.seen !== undefined) {
      await client.messageFlagsAdd({ uid }, flags.seen ? '\\Seen' : '\\Seen', { uid: true });
    }
    if (flags.flagged !== undefined) {
      await client.messageFlagsAdd({ uid }, flags.flagged ? '\\Flagged' : '\\Flagged', { uid: true });
    }
  } finally {
    lock.release();
  }
}

export async function deleteMessage(config: EmailAccountConfig, folderPath: string, uid: number): Promise<void> {
  const client = await getConnection(config);
  const lock = await client.getMailboxLock(folderPath);
  try {
    await client.messageFlagsAdd({ uid }, '\\Deleted', { uid: true });
    await client.expunge();
  } finally {
    lock.release();
  }
}

export async function testConnection(config: { imapHost: string; imapPort: number; imapSecure: boolean; username: string; password: string }): Promise<{ ok: boolean; error?: string }> {
  try {
    const client = new ImapFlow({
      host: config.imapHost,
      port: config.imapPort,
      secure: config.imapSecure,
      auth: { user: config.username, pass: config.password },
      logger: false,
    });
    await client.connect();
    await client.logout();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Connection failed' };
  }
}
