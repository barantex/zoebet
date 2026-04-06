const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'BahisMosco.sqlite');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

// Initialize database schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    name TEXT,
    surname TEXT,
    phone TEXT,
    tc TEXT,
    verified INTEGER DEFAULT 0,
    otp TEXT,
    otp_expires INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS wallets (
    user_id TEXT PRIMARY KEY,
    balance REAL DEFAULT 0,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL,
    amount REAL NOT NULL,
    method TEXT,
    status TEXT DEFAULT 'pending',
    reference_id TEXT,
    note TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS ibans (
    id TEXT PRIMARY KEY,
    bank_name TEXT NOT NULL,
    account_name TEXT NOT NULL,
    iban TEXT NOT NULL,
    active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

module.exports = db;

// Migration: add new columns if they don't exist
try { db.exec(`ALTER TABLE users ADD COLUMN surname TEXT`); } catch {}
try { db.exec(`ALTER TABLE users ADD COLUMN phone TEXT`); } catch {}
try { db.exec(`ALTER TABLE users ADD COLUMN tc TEXT`); } catch {}
try { db.exec(`ALTER TABLE users ADD COLUMN verified INTEGER DEFAULT 0`); } catch {}
try { db.exec(`ALTER TABLE users ADD COLUMN otp TEXT`); } catch {}
try { db.exec(`ALTER TABLE users ADD COLUMN otp_expires INTEGER`); } catch {}
try { db.exec(`ALTER TABLE users ADD COLUMN otp_request_id TEXT`); } catch {}
try { db.exec(`ALTER TABLE transactions ADD COLUMN method TEXT`); } catch {}
try { db.exec(`ALTER TABLE transactions ADD COLUMN status TEXT DEFAULT 'pending'`); } catch {}
try { db.exec(`ALTER TABLE transactions ADD COLUMN note TEXT`); } catch {}
try { db.exec(`CREATE TABLE IF NOT EXISTS ibans (id TEXT PRIMARY KEY, bank_name TEXT NOT NULL, account_name TEXT NOT NULL, iban TEXT NOT NULL, logo TEXT, active INTEGER DEFAULT 1, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`); } catch {}
try { db.exec(`ALTER TABLE ibans ADD COLUMN logo TEXT`); } catch {}

// Wheel codes table
try {
  db.exec(`CREATE TABLE IF NOT EXISTS wheel_codes (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    amount REAL NOT NULL,
    used INTEGER DEFAULT 0,
    used_by TEXT,
    used_at DATETIME,
    expires_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
} catch {}

// Wheel slices table
try {
  db.exec(`CREATE TABLE IF NOT EXISTS wheel_slices (
    id TEXT PRIMARY KEY,
    label TEXT NOT NULL,
    amount REAL NOT NULL,
    color TEXT DEFAULT '#f5c518',
    probability INTEGER DEFAULT 10,
    active INTEGER DEFAULT 1
  )`);
  // Default slices
  const count = db.prepare('SELECT COUNT(*) as c FROM wheel_slices').get();
  if (count.c === 0) {
    const slices = [
      { label: '50 TL', amount: 50, color: '#f5c518', prob: 20 },
      { label: '100 TL', amount: 100, color: '#e67e00', prob: 15 },
      { label: '250 TL', amount: 250, color: '#22c55e', prob: 10 },
      { label: '500 TL', amount: 500, color: '#3b82f6', prob: 5 },
      { label: '25 TL', amount: 25, color: '#8b5cf6', prob: 25 },
      { label: '75 TL', amount: 75, color: '#ef4444', prob: 15 },
      { label: '150 TL', amount: 150, color: '#06b6d4', prob: 8 },
      { label: '1000 TL', amount: 1000, color: '#f59e0b', prob: 2 },
    ];
    slices.forEach((s, i) => {
      db.prepare('INSERT INTO wheel_slices (id, label, amount, color, probability) VALUES (?,?,?,?,?)')
        .run(`ws_${i+1}`, s.label, s.amount, s.color, s.prob);
    });
  }
} catch {}

// Wheel spins table
try {
  db.exec(`CREATE TABLE IF NOT EXISTS wheel_spins (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    slice_id TEXT NOT NULL,
    amount REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
} catch {}

