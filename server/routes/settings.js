const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key';

function adminOnly(req, res, next) {
  const token = (req.headers.authorization || '').split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Yetkisiz' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin') return res.status(403).json({ error: 'Admin yetkisi gerekli' });
    req.admin = decoded;
    next();
  } catch { res.status(401).json({ error: 'Geçersiz token' }); }
}

// Ensure table exists
try {
  db.exec('CREATE TABLE IF NOT EXISTS site_settings (key TEXT PRIMARY KEY, value TEXT)');
} catch {}

// GET /api/settings — public
router.get('/', (req, res) => {
  const rows = db.prepare('SELECT key, value FROM site_settings').all();
  const settings = {};
  rows.forEach(r => { try { settings[r.key] = JSON.parse(r.value); } catch { settings[r.key] = r.value; } });
  res.json(settings);
});

// PATCH /api/settings — admin only
router.patch('/', adminOnly, (req, res) => {
  const updates = req.body;
  Object.entries(updates).forEach(([key, value]) => {
    const val = typeof value === 'string' ? value : JSON.stringify(value);
    db.prepare('INSERT OR REPLACE INTO site_settings (key, value) VALUES (?,?)').run(key, val);
  });
  res.json({ ok: true });
});

module.exports = router;
