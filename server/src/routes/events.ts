import { Router } from 'express';
import { getAccount } from '../db';
import { getConnection } from '../imap';
import type { EmailAccountConfig } from '../types';

export const eventsRouter = Router();

// SSE endpoint for real-time new mail notifications
eventsRouter.get('/:id/events', async (req, res) => {
  const row = getAccount(req.params.id);
  if (!row) return res.status(404).json({ error: 'Account not found' });

  const config = row.config as unknown as EmailAccountConfig;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  let running = true;

  const sendEvent = (data: any) => {
    if (!running) return;
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  // Start IDLE on INBOX
  try {
    const client = await getConnection(config);

    const idleLoop = async () => {
      while (running) {
        try {
          const lock = await client.getMailboxLock('INBOX');
          try {
            // Wait for IDLE response
            const response = await client.idle();
            if (response && response.type === 'EXISTS') {
              sendEvent({ type: 'newMail', folder: 'INBOX', count: response.exists });
            }
          } finally {
            lock.release();
          }
        } catch (err) {
          if (!running) break;
          console.error('[events] IDLE error:', err);
          // Wait before retrying
          await new Promise((r) => setTimeout(r, 5000));
        }
      }
    };

    idleLoop();

    req.on('close', () => {
      running = false;
    });
  } catch (err) {
    sendEvent({ type: 'error', message: 'Failed to start IDLE' });
    res.end();
  }
});
