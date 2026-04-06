const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../db');
const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key';

function hashPassword(p) {
  return crypto.createHash('sha256').update(p).digest('hex');
}

// Middleware: admin only
function adminOnly(req, res, next) {
  const token = (req.headers.authorization || '').split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Yetkisiz' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin') return res.status(403).json({ error: 'Admin yetkisi gerekli' });
    req.admin = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Geçersiz token' });
  }
}

// GET /api/admin/users
router.get('/users', adminOnly, (req, res) => {
  const { search, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  let query = 'SELECT id, email, name, surname, phone, tc, role, verified, created_at FROM users';
  const params = [];
  if (search) {
    query += ' WHERE email LIKE ? OR name LIKE ? OR phone LIKE ? OR tc LIKE ?';
    const s = `%${search}%`;
    params.push(s, s, s, s);
  }
  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(Number(limit), Number(offset));

  const users = db.prepare(query).all(...params);
  const total = db.prepare('SELECT COUNT(*) as c FROM users' + (search ? ' WHERE email LIKE ? OR name LIKE ? OR phone LIKE ? OR tc LIKE ?' : '')).get(...(search ? [`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`] : [])).c;

  // Attach wallet balance
  const result = users.map(u => {
    const wallet = db.prepare('SELECT balance FROM wallets WHERE user_id=?').get(u.id);
    return { ...u, balance: wallet?.balance ?? 0 };
  });

  res.json({ users: result, total, page: Number(page), limit: Number(limit) });
});

// GET /api/admin/users/:id
router.get('/users/:id', adminOnly, (req, res) => {
  const user = db.prepare('SELECT id, email, name, surname, phone, tc, role, verified, created_at FROM users WHERE id=?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
  const wallet = db.prepare('SELECT balance FROM wallets WHERE user_id=?').get(user.id);
  const txs = db.prepare('SELECT * FROM transactions WHERE user_id=? ORDER BY created_at DESC LIMIT 50').all(user.id);
  res.json({ user: { ...user, balance: wallet?.balance ?? 0 }, transactions: txs });
});

// PATCH /api/admin/users/:id
router.patch('/users/:id', adminOnly, (req, res) => {
  const { name, surname, phone, tc, email, role, verified, password, balance } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE id=?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'Kullanıcı bulunamadı' });

  if (name !== undefined || surname !== undefined || phone !== undefined || tc !== undefined || email !== undefined || role !== undefined || verified !== undefined) {
    db.prepare(`UPDATE users SET
      name=COALESCE(?,name), surname=COALESCE(?,surname), phone=COALESCE(?,phone),
      tc=COALESCE(?,tc), email=COALESCE(?,email), role=COALESCE(?,role),
      verified=COALESCE(?,verified)
      WHERE id=?`).run(name ?? null, surname ?? null, phone ?? null, tc ?? null, email ?? null, role ?? null, verified ?? null, user.id);
  }

  if (password) {
    db.prepare('UPDATE users SET password=? WHERE id=?').run(hashPassword(password), user.id);
  }

  if (balance !== undefined) {
    const wallet = db.prepare('SELECT user_id FROM wallets WHERE user_id=?').get(user.id);
    if (wallet) {
      db.prepare('UPDATE wallets SET balance=? WHERE user_id=?').run(Number(balance), user.id);
    } else {
      db.prepare('INSERT INTO wallets (user_id, balance) VALUES (?,?)').run(user.id, Number(balance));
    }
  }

  res.json({ ok: true });
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', adminOnly, (req, res) => {
  db.prepare('DELETE FROM users WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

// POST /api/admin/users/:id/verify
router.post('/users/:id/verify', adminOnly, (req, res) => {
  db.prepare('UPDATE users SET verified=1 WHERE id=?').run(req.params.id);
  const user = db.prepare('SELECT user_id FROM wallets WHERE user_id=?').get(req.params.id);
  if (!user) db.prepare('INSERT INTO wallets (user_id, balance) VALUES (?,0)').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
