import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'chpio-email.db');

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
  }
  return db;
}

export function initDb(): void {
  const d = getDb();

  d.exec(`
    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      config TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS message_cache (
      account_id TEXT NOT NULL,
      folder TEXT NOT NULL,
      uid INTEGER NOT NULL,
      message_id TEXT,
      from_name TEXT,
      from_address TEXT,
      to_addrs TEXT,
      subject TEXT,
      snippet TEXT,
      date INTEGER,
      is_read INTEGER DEFAULT 0,
      is_starred INTEGER DEFAULT 0,
      has_attachments INTEGER DEFAULT 0,
      triage TEXT,
      tags TEXT,
      synced_at INTEGER,
      PRIMARY KEY (account_id, folder, uid)
    );

    CREATE INDEX IF NOT EXISTS idx_message_cache_account_folder
      ON message_cache(account_id, folder, date DESC);
  `);
}

// Account queries
export function insertAccount(id: string, config: object): void {
  const d = getDb();
  d.prepare('INSERT INTO accounts (id, config, created_at) VALUES (?, ?, ?)').run(id, JSON.stringify(config), Date.now());
}

export function getAccounts(): { id: string; config: object; created_at: number }[] {
  const d = getDb();
  return d.prepare('SELECT * FROM accounts').all() as any[];
}

export function getAccount(id: string): { id: string; config: object } | undefined {
  const d = getDb();
  return d.prepare('SELECT * FROM accounts WHERE id = ?').get(id) as any;
}

export function deleteAccount(id: string): void {
  const d = getDb();
  d.prepare('DELETE FROM accounts WHERE id = ?').run(id);
  d.prepare('DELETE FROM message_cache WHERE account_id = ?').run(id);
}

// Message cache queries
export function getCachedMessages(accountId: string, folder: string, limit = 50, offset = 0): any[] {
  const d = getDb();
  return d.prepare(
    'SELECT * FROM message_cache WHERE account_id = ? AND folder = ? ORDER BY date DESC LIMIT ? OFFSET ?'
  ).all(accountId, folder, limit, offset);
}

export function getCachedMessage(accountId: string, folder: string, uid: number): any {
  const d = getDb();
  return d.prepare('SELECT * FROM message_cache WHERE account_id = ? AND folder = ? AND uid = ?').get(accountId, folder, uid);
}

export function upsertMessage(msg: any): void {
  const d = getDb();
  d.prepare(`
    INSERT INTO message_cache (account_id, folder, uid, message_id, from_name, from_address, to_addrs, subject, snippet, date, is_read, is_starred, has_attachments, triage, tags, synced_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(account_id, folder, uid) DO UPDATE SET
      is_read = excluded.is_read,
      is_starred = excluded.is_starred,
      triage = COALESCE(excluded.triage, message_cache.triage),
      tags = COALESCE(excluded.tags, message_cache.tags),
      synced_at = excluded.synced_at
  `).run(
    msg.account_id, msg.folder, msg.uid, msg.message_id,
    msg.from_name, msg.from_address, msg.to_addrs,
    msg.subject, msg.snippet, msg.date,
    msg.is_read, msg.is_starred, msg.has_attachments,
    msg.triage, msg.tags, msg.synced_at
  );
}

export function updateMessageFlags(accountId: string, folder: string, uid: number, flags: { is_read?: number; is_starred?: number }): void {
  const d = getDb();
  const sets: string[] = [];
  const values: any[] = [];
  if (flags.is_read !== undefined) { sets.push('is_read = ?'); values.push(flags.is_read); }
  if (flags.is_starred !== undefined) { sets.push('is_starred = ?'); values.push(flags.is_starred); }
  if (sets.length === 0) return;
  values.push(accountId, folder, uid);
  d.prepare(`UPDATE message_cache SET ${sets.join(', ')} WHERE account_id = ? AND folder = ? AND uid = ?`).run(...values);
}

export function deleteCachedMessage(accountId: string, folder: string, uid: number): void {
  const d = getDb();
  d.prepare('DELETE FROM message_cache WHERE account_id = ? AND folder = ? AND uid = ?').run(accountId, folder, uid);
}

export function updateMessageTriage(accountId: string, folder: string, uid: number, triage: string, tags: string[]): void {
  const d = getDb();
  d.prepare('UPDATE message_cache SET triage = ?, tags = ? WHERE account_id = ? AND folder = ? AND uid = ?')
    .run(triage, JSON.stringify(tags), accountId, folder, uid);
}
