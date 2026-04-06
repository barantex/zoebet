const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../db');
const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key';

function hashPassword(p) {
  return crypto.createHash('sha256').update(p).digest('hex');
}

function adminOnly(req, res, next) {
  const token = (req.headers.authorization || '').split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Yetkisiz' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin') return res.status(403).json({ error: 'Admin yetkisi gerekli' });
    req.admin = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Gecersiz token' });
  }
}

/* ── DASHBOARD STATS ── */
router.get('/stats', adminOnly, (req, res) => {
  try {
    const totalUsers = db.prepare('SELECT COUNT(*) as c FROM users WHERE role=?').get('user').c;
    const verifiedUsers = db.prepare('SELECT COUNT(*) as c FROM users WHERE role=? AND verified=1').get('user').c;
    const totalBalance = db.prepare('SELECT COALESCE(SUM(balance),0) as s FROM wallets').get().s;
    const pendingDeposits = db.prepare("SELECT COUNT(*) as c FROM transactions WHERE type='deposit' AND status='pending'").get().c;
    const pendingWithdrawals = db.prepare("SELECT COUNT(*) as c FROM transactions WHERE type='withdraw' AND status='pending'").get().c;
    const todayDeposits = db.prepare("SELECT COALESCE(SUM(amount),0) as s FROM transactions WHERE type='deposit' AND status='completed' AND date(created_at)=date('now')").get().s;
    const totalDeposits = db.prepare("SELECT COALESCE(SUM(amount),0) as s FROM transactions WHERE type='deposit' AND status='completed'").get().s;
    const totalWithdrawals = db.prepare("SELECT COALESCE(SUM(amount),0) as s FROM transactions WHERE type='withdraw' AND status='completed'").get().s;
    const recentUsers = db.prepare('SELECT id,email,name,surname,created_at FROM users WHERE role=? ORDER BY created_at DESC LIMIT 5').all('user');
    const recentTx = db.prepare("SELECT t.*,u.email FROM transactions t JOIN users u ON u.id=t.user_id ORDER BY t.created_at DESC LIMIT 10").all();

    res.json({
      totalUsers, verifiedUsers, totalBalance,
      pendingDeposits, pendingWithdrawals,
      todayDeposits, totalDeposits, totalWithdrawals,
      recentUsers, recentTx
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/* ── USERS ── */
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
  const countQuery = 'SELECT COUNT(*) as c FROM users' + (search ? ' WHERE email LIKE ? OR name LIKE ? OR phone LIKE ? OR tc LIKE ?' : '');
  const total = db.prepare(countQuery).get(...(search ? [`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`] : [])).c;

  const result = users.map(u => {
    const wallet = db.prepare('SELECT balance FROM wallets WHERE user_id=?').get(u.id);
    return { ...u, balance: wallet?.balance ?? 0 };
  });

  res.json({ users: result, total, page: Number(page), limit: Number(limit) });
});

router.get('/users/:id', adminOnly, (req, res) => {
  const user = db.prepare('SELECT id, email, name, surname, phone, tc, role, verified, created_at FROM users WHERE id=?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'Kullanici bulunamadi' });
  const wallet = db.prepare('SELECT balance FROM wallets WHERE user_id=?').get(user.id);
  const txs = db.prepare('SELECT * FROM transactions WHERE user_id=? ORDER BY created_at DESC LIMIT 50').all(user.id);
  res.json({ user: { ...user, balance: wallet?.balance ?? 0 }, transactions: txs });
});

router.patch('/users/:id', adminOnly, (req, res) => {
  const { name, surname, phone, tc, email, role, verified, password, balance } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE id=?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'Kullanici bulunamadi' });

  db.prepare(`UPDATE users SET
    name=COALESCE(?,name), surname=COALESCE(?,surname), phone=COALESCE(?,phone),
    tc=COALESCE(?,tc), email=COALESCE(?,email), role=COALESCE(?,role),
    verified=COALESCE(?,verified)
    WHERE id=?`).run(name ?? null, surname ?? null, phone ?? null, tc ?? null, email ?? null, role ?? null, verified ?? null, user.id);

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

router.delete('/users/:id', adminOnly, (req, res) => {
  db.prepare('DELETE FROM users WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

router.post('/users/:id/verify', adminOnly, (req, res) => {
  db.prepare('UPDATE users SET verified=1 WHERE id=?').run(req.params.id);
  const wallet = db.prepare('SELECT user_id FROM wallets WHERE user_id=?').get(req.params.id);
  if (!wallet) db.prepare('INSERT INTO wallets (user_id, balance) VALUES (?,0)').run(req.params.id);
  res.json({ ok: true });
});

/* ── ADMIN PASSWORD CHANGE ── */
router.post('/change-password', adminOnly, (req, res) => {
  const { current_password, new_password } = req.body;
  const admin = db.prepare('SELECT * FROM users WHERE id=?').get(req.admin.id);
  if (!admin) return res.status(404).json({ error: 'Admin bulunamadi' });
  if (admin.password !== hashPassword(current_password)) {
    return res.status(400).json({ error: 'Mevcut sifre yanlis' });
  }
  if (!new_password || new_password.length < 6) {
    return res.status(400).json({ error: 'Yeni sifre en az 6 karakter olmali' });
  }
  db.prepare('UPDATE users SET password=? WHERE id=?').run(hashPassword(new_password), admin.id);
  res.json({ ok: true });
});

module.exports = router;
