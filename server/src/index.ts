import express from 'express';
import cors from 'cors';
import { accountsRouter } from './routes/accounts';
import { foldersRouter } from './routes/folders';
import { messagesRouter } from './routes/messages';
import { eventsRouter } from './routes/events';
import { sendRouter } from './routes/send';
import { initDb } from './db';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

initDb();

app.use('/api/accounts', accountsRouter);
app.use('/api/accounts', foldersRouter);
app.use('/api/accounts', messagesRouter);
app.use('/api/accounts', eventsRouter);
app.use('/api/accounts', sendRouter);

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`[chpio-server] running on port ${PORT}`);
});
