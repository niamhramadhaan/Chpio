import { Router } from 'express';
import crypto from 'crypto';
import { insertAccount, getAccounts, getAccount, deleteAccount } from '../db';
import { testConnection, closeConnection } from '../imap';
import type { EmailAccountConfig } from '../types';

export const accountsRouter = Router();

// List accounts
accountsRouter.get('/', (_req, res) => {
  const accounts = getAccounts().map((a) => ({
    id: a.id,
    ...JSON.parse(a.config as string),
    createdAt: a.created_at,
  }));
  // Don't expose passwords
  res.json(accounts.map(({ password, ...rest }: any) => rest));
});

// Add account
accountsRouter.post('/', async (req, res) => {
  try {
    const config: EmailAccountConfig = req.body;
    if (!config.imapHost || !config.username || !config.password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const id = crypto.randomUUID();
    insertAccount(id, config);
    res.json({ id, message: 'Account added' });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to add account' });
  }
});

// Delete account
accountsRouter.delete('/:id', async (req, res) => {
  try {
    await closeConnection(req.params.id);
    deleteAccount(req.params.id);
    res.json({ message: 'Account deleted' });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to delete account' });
  }
});

// Test IMAP connection
accountsRouter.post('/test', async (req, res) => {
  try {
    const result = await testConnection(req.body);
    res.json(result);
  } catch (err) {
    res.status(500).json({ ok: false, error: err instanceof Error ? err.message : 'Test failed' });
  }
});
