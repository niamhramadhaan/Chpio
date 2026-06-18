import { Router } from 'express';
import { getAccount } from '../db';
import { listFolders, getFolderStatus } from '../imap';
import type { EmailAccountConfig } from '../types';

export const foldersRouter = Router();

// List folders for an account
foldersRouter.get('/:id/folders', async (req, res) => {
  try {
    const row = getAccount(req.params.id);
    if (!row) return res.status(404).json({ error: 'Account not found' });

    const config = row.config as unknown as EmailAccountConfig;
    const folders = await listFolders(config);

    // Get status for each folder
    const enriched = await Promise.all(
      folders.map(async (f) => {
        try {
          const status = await getFolderStatus(config, f.path);
          return { ...f, ...status };
        } catch {
          return { ...f, unreadCount: 0, totalCount: 0 };
        }
      })
    );

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to list folders' });
  }
});
