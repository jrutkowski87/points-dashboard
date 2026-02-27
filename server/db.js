import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = join(__dirname, 'dashboard.db');

let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    initSchema();
  }
  return db;
}

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS plaid_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_id TEXT UNIQUE NOT NULL,
      access_token TEXT NOT NULL,
      institution_name TEXT,
      card_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_synced DATETIME
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      plaid_transaction_id TEXT UNIQUE NOT NULL,
      item_id TEXT NOT NULL,
      card_id TEXT,
      amount REAL NOT NULL,
      merchant_name TEXT,
      category TEXT,
      date TEXT NOT NULL,
      pending INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS user_state (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS detected_credits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      credit_pattern_id TEXT NOT NULL,
      transaction_id TEXT,
      card_id TEXT,
      amount REAL,
      period TEXT NOT NULL,
      detected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      manually_overridden INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS balance_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      program_id TEXT NOT NULL,
      balance INTEGER NOT NULL,
      recorded_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_bh_program ON balance_history(program_id, recorded_at);
  `);
}

export function getUserState(key, defaultValue = null) {
  const db = getDb();
  const row = db.prepare('SELECT value FROM user_state WHERE key = ?').get(key);
  if (!row) return defaultValue;
  try { return JSON.parse(row.value); } catch { return row.value; }
}

export function setUserState(key, value) {
  const db = getDb();
  db.prepare(`
    INSERT INTO user_state (key, value, updated_at)
    VALUES (?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at
  `).run(key, JSON.stringify(value));
}

export function getPlaidItems() {
  return getDb().prepare('SELECT * FROM plaid_items').all();
}

export function savePlaidItem(itemId, accessToken, institutionName, cardId) {
  getDb().prepare(`
    INSERT INTO plaid_items (item_id, access_token, institution_name, card_id)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(item_id) DO UPDATE SET access_token=excluded.access_token, institution_name=excluded.institution_name, card_id=excluded.card_id
  `).run(itemId, accessToken, institutionName, cardId);
}

export function saveTransactions(transactions) {
  const db = getDb();
  const insert = db.prepare(`
    INSERT OR REPLACE INTO transactions (plaid_transaction_id, item_id, card_id, amount, merchant_name, category, date, pending)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertMany = db.transaction((txns) => {
    for (const t of txns) insert.run(t.transaction_id, t.item_id, t.card_id, t.amount, t.merchant_name, t.category, t.date, t.pending ? 1 : 0);
  });
  insertMany(transactions);
}

export function getTransactions(filters = {}) {
  const db = getDb();
  let query = 'SELECT * FROM transactions WHERE 1=1';
  const params = [];
  if (filters.cardId) { query += ' AND card_id = ?'; params.push(filters.cardId); }
  if (filters.since) { query += ' AND date >= ?'; params.push(filters.since); }
  if (filters.minAmount !== undefined) { query += ' AND amount >= ?'; params.push(filters.minAmount); }
  if (filters.maxAmount !== undefined) { query += ' AND amount <= ?'; params.push(filters.maxAmount); }
  query += ' ORDER BY date DESC';
  if (filters.limit) { query += ` LIMIT ${filters.limit}`; }
  return db.prepare(query).all(...params);
}

export function getCardSpend(cardId, since) {
  const db = getDb();
  const result = db.prepare(`
    SELECT SUM(amount) as total
    FROM transactions
    WHERE card_id = ? AND date >= ? AND amount > 0 AND pending = 0
  `).get(cardId, since);
  return result?.total || 0;
}

export function saveDetectedCredit(patternId, transactionId, cardId, amount, period) {
  const db = getDb();
  const existing = db.prepare('SELECT id FROM detected_credits WHERE credit_pattern_id = ? AND period = ?').get(patternId, period);
  if (!existing) {
    db.prepare(`
      INSERT INTO detected_credits (credit_pattern_id, transaction_id, card_id, amount, period)
      VALUES (?, ?, ?, ?, ?)
    `).run(patternId, transactionId, cardId, amount, period);
    return true;
  }
  return false;
}

export function getDetectedCredits(period = null) {
  const db = getDb();
  if (period) {
    return db.prepare('SELECT * FROM detected_credits WHERE period = ?').all(period);
  }
  return db.prepare('SELECT * FROM detected_credits').all();
}

export function markCreditUsed(patternId, period, manually = true) {
  const db = getDb();
  const existing = db.prepare('SELECT id FROM detected_credits WHERE credit_pattern_id = ? AND period = ?').get(patternId, period);
  if (existing) {
    db.prepare('UPDATE detected_credits SET manually_overridden = ? WHERE credit_pattern_id = ? AND period = ?').run(manually ? 1 : 0, patternId, period);
  } else {
    db.prepare(`
      INSERT INTO detected_credits (credit_pattern_id, transaction_id, card_id, amount, period, manually_overridden)
      VALUES (?, NULL, NULL, NULL, ?, ?)
    `).run(patternId, period, manually ? 1 : 0);
  }
}

export function removeCreditUsed(patternId, period) {
  getDb().prepare('DELETE FROM detected_credits WHERE credit_pattern_id = ? AND period = ?').run(patternId, period);
}

export function updateLastSynced(itemId) {
  getDb().prepare('UPDATE plaid_items SET last_synced = CURRENT_TIMESTAMP WHERE item_id = ?').run(itemId);
}

export function recordBalance(programId, balance) {
  getDb().prepare(
    'INSERT INTO balance_history (program_id, balance) VALUES (?, ?)'
  ).run(programId, balance);
}

export function getBalanceHistory(programId, days = 90) {
  const since = new Date(Date.now() - days * 86400000).toISOString().replace('T', ' ').split('.')[0];
  return getDb().prepare(
    'SELECT balance, recorded_at FROM balance_history WHERE program_id = ? AND recorded_at >= ? ORDER BY recorded_at ASC'
  ).all(programId, since);
}
