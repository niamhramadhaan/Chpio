import { Router } from 'express';
import { getAccount, getCachedMessages, getCachedMessage, upsertMessage, updateMessageFlags, deleteCachedMessage, updateMessageTriage } from '../db';
import { fetchMessages, updateFlags, deleteMessage } from '../imap';
import type { EmailAccountConfig } from '../types';

export const messagesRouter = Router();

// List messages in a folder (cached + sync)
messagesRouter.get('/:id/folders/:folder/messages', async (req, res) => {
  try {
    const row = getAccount(req.params.id);
    if (!row) return res.status(404).json({ error: 'Account not found' });

    const config = row.config as unknown as EmailAccountConfig;
    const folder = decodeURIComponent(req.params.folder);
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    const sync = req.query.sync !== 'false';

    // Sync from IMAP if requested
    if (sync && offset === 0) {
      try {
        const messages = await fetchMessages(config, folder, limit);
        for (const msg of messages) {
          upsertMessage({
            account_id: config.id,
            folder,
            uid: msg.uid,
            message_id: msg.messageId,
            from_name: msg.from.name,
            from_address: msg.from.address,
            to_addrs: JSON.stringify(msg.to),
            subject: msg.subject,
            snippet: msg.snippet,
            date: msg.date,
            is_read: msg.isRead ? 1 : 0,
            is_starred: msg.isStarred ? 1 : 0,
            has_attachments: msg.hasAttachments ? 1 : 0,
            triage: null,
            tags: null,
            synced_at: Date.now(),
          });
        }
      } catch (err) {
        console.error('[messages] sync error:', err);
      }
    }

    // Return from cache
    const cached = getCachedMessages(config.id, folder, limit, offset);
    res.json(cached.map(formatCachedMessage));
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to list messages' });
  }
});

// Get single message detail
messagesRouter.get('/:id/folders/:folder/messages/:uid', async (req, res) => {
  try {
    const row = getAccount(req.params.id);
    if (!row) return res.status(404).json({ error: 'Account not found' });

    const config = row.config as unknown as EmailAccountConfig;
    const folder = decodeURIComponent(req.params.folder);
    const uid = parseInt(req.params.uid);

    // Check cache first
    let cached = getCachedMessage(config.id, folder, uid);

    if (!cached) {
      // Fetch from IMAP
      const messages = await fetchMessages(config, folder, 1);
      const msg = messages.find((m) => m.uid === uid);
      if (msg) {
        upsertMessage({
          account_id: config.id,
          folder,
          uid: msg.uid,
          message_id: msg.messageId,
          from_name: msg.from.name,
          from_address: msg.from.address,
          to_addrs: JSON.stringify(msg.to),
          subject: msg.subject,
          snippet: msg.snippet,
          date: msg.date,
          is_read: msg.isRead ? 1 : 0,
          is_starred: msg.isStarred ? 1 : 0,
          has_attachments: msg.hasAttachments ? 1 : 0,
          triage: null,
          tags: null,
          synced_at: Date.now(),
        });
        cached = getCachedMessage(config.id, folder, uid);
      }
    }

    if (!cached) return res.status(404).json({ error: 'Message not found' });

    // Fetch full content from IMAP for detail view
    let htmlBody = '';
    let textBody = '';
    let attachments: any[] = [];

    try {
      const messages = await fetchMessages(config, folder, 50);
      const msg = messages.find((m) => m.uid === uid);
      if (msg) {
        htmlBody = msg.htmlBody || '';
        textBody = msg.textBody || '';
        attachments = msg.attachments || [];
      }
    } catch { /* use cached snippet */ }

    res.json({
      ...formatCachedMessage(cached),
      htmlBody,
      textBody,
      attachments,
    });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to get message' });
  }
});

// Update message flags (read/starred)
messagesRouter.patch('/:id/folders/:folder/messages/:uid', async (req, res) => {
  try {
    const row = getAccount(req.params.id);
    if (!row) return res.status(404).json({ error: 'Account not found' });

    const config = row.config as unknown as EmailAccountConfig;
    const folder = decodeURIComponent(req.params.folder);
    const uid = parseInt(req.params.uid);
    const { isRead, isStarred } = req.body;

    // Update IMAP
    try {
      await updateFlags(config, folder, uid, {
        seen: isRead !== undefined ? !!isRead : undefined,
        flagged: isStarred !== undefined ? !!isStarred : undefined,
      });
    } catch (err) {
      console.error('[messages] IMAP flag update error:', err);
    }

    // Update cache
    updateMessageFlags(config.id, folder, uid, {
      is_read: isRead !== undefined ? (isRead ? 1 : 0) : undefined,
      is_starred: isStarred !== undefined ? (isStarred ? 1 : 0) : undefined,
    });

    res.json({ message: 'Flags updated' });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to update flags' });
  }
});

// Delete message
messagesRouter.delete('/:id/folders/:folder/messages/:uid', async (req, res) => {
  try {
    const row = getAccount(req.params.id);
    if (!row) return res.status(404).json({ error: 'Account not found' });

    const config = row.config as unknown as EmailAccountConfig;
    const folder = decodeURIComponent(req.params.folder);
    const uid = parseInt(req.params.uid);

    try {
      await deleteMessage(config, folder, uid);
    } catch (err) {
      console.error('[messages] IMAP delete error:', err);
    }

    deleteCachedMessage(config.id, folder, uid);
    res.json({ message: 'Message deleted' });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to delete message' });
  }
});

// Update triage and tags
messagesRouter.patch('/:id/folders/:folder/messages/:uid/triage', (req, res) => {
  try {
    const row = getAccount(req.params.id);
    if (!row) return res.status(404).json({ error: 'Account not found' });

    const config = row.config as unknown as EmailAccountConfig;
    const folder = decodeURIComponent(req.params.folder);
    const uid = parseInt(req.params.uid);
    const { triage, tags } = req.body;

    if (!triage) return res.status(400).json({ error: 'triage is required' });

    updateMessageTriage(config.id, folder, uid, triage, tags || []);
    res.json({ message: 'Triage updated' });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to update triage' });
  }
});

// Download attachment
messagesRouter.get('/:id/folders/:folder/messages/:uid/attachments/:partId', async (req, res) => {
  try {
    const row = getAccount(req.params.id);
    if (!row) return res.status(404).json({ error: 'Account not found' });

    const config = row.config as unknown as EmailAccountConfig;
    const folder = decodeURIComponent(req.params.folder);
    const uid = parseInt(req.params.uid);

    // Fetch message with attachments from IMAP
    const messages = await fetchMessages(config, folder, 50);
    const msg = messages.find((m) => m.uid === uid);
    if (!msg) return res.status(404).json({ error: 'Message not found' });

    const attachment = msg.attachments?.find((a: any) => a.partId === req.params.partId);
    if (!attachment) return res.status(404).json({ error: 'Attachment not found' });

    // The attachment content is in the parsed message source
    // For now, return the attachment metadata — full binary download requires IMAP FETCH BODY
    res.json({ filename: attachment.filename, mimeType: attachment.mimeType, size: attachment.size });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to download attachment' });
  }
});

function formatCachedMessage(cached: any) {
  return {
    uid: cached.uid,
    messageId: cached.message_id,
    folder: cached.folder,
    from: { name: cached.from_name, address: cached.from_address },
    to: JSON.parse(cached.to_addrs || '[]'),
    subject: cached.subject,
    snippet: cached.snippet,
    date: cached.date,
    isRead: !!cached.is_read,
    isStarred: !!cached.is_starred,
    hasAttachments: !!cached.has_attachments,
    triage: cached.triage,
    tags: cached.tags ? JSON.parse(cached.tags) : [],
  };
}
