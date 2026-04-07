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
    const todayDepositsTotal = db.prepare("SELECT COALESCE(SUM(amount),0) as s FROM transactions WHERE type='deposit' AND status='completed' AND date(created_at)=date('now')").get().s;
    const todayDepositsCount = db.prepare("SELECT COUNT(*) as c FROM transactions WHERE type='deposit' AND status='completed' AND date(created_at)=date('now')").get().c;
    const todayWithdrawalsTotal = db.prepare("SELECT COALESCE(SUM(amount),0) as s FROM transactions WHERE type='withdraw' AND status='completed' AND date(created_at)=date('now')").get().s;
    const todayWithdrawalsCount = db.prepare("SELECT COUNT(*) as c FROM transactions WHERE type='withdraw' AND status='completed' AND date(created_at)=date('now')").get().c;
    const todayNewUsers = db.prepare("SELECT COUNT(*) as c FROM users WHERE role='user' AND date(created_at)=date('now')").get().c;
    const totalActiveUsers = db.prepare("SELECT COUNT(*) as c FROM users WHERE role='user' AND verified=1").get().c;
    const totalDeposits = db.prepare("SELECT COALESCE(SUM(amount),0) as s FROM transactions WHERE type='deposit' AND status='completed'").get().s;
    const totalWithdrawals = db.prepare("SELECT COALESCE(SUM(amount),0) as s FROM transactions WHERE type='withdraw' AND status='completed'").get().s;
    const recentUsers = db.prepare('SELECT id,email,name,surname,created_at FROM users WHERE role=? ORDER BY created_at DESC LIMIT 5').all('user');
    const recentTx = db.prepare("SELECT t.*,u.email FROM transactions t JOIN users u ON u.id=t.user_id ORDER BY t.created_at DESC LIMIT 10").all();

    // Hourly deposit chart for last 24h
    const hourlyDeposits = db.prepare(`
      SELECT strftime('%H', created_at) as hour, COALESCE(SUM(amount),0) as total
      FROM transactions
      WHERE type='deposit' AND status='completed'
        AND created_at >= datetime('now', '-24 hours')
      GROUP BY hour ORDER BY hour
    `).all();

    res.json({
      totalUsers, verifiedUsers, totalBalance,
      pendingDeposits, pendingWithdrawals,
      todayDeposits: todayDepositsTotal, todayDepositsCount,
      todayWithdrawalsTotal, todayWithdrawalsCount,
      todayNewUsers, totalActiveUsers,
      totalDeposits, totalWithdrawals,
      recentUsers, recentTx,
      hourlyDeposits,
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

/* ── STAFF PERMISSIONS ── */
router.get('/staff', adminOnly, (req, res) => {
  const staff = db.prepare("SELECT u.id, u.email, u.name, u.surname, u.role, sp.* FROM users u LEFT JOIN staff_permissions sp ON sp.user_id=u.id WHERE u.role IN ('admin','staff') ORDER BY u.created_at DESC").all();
  res.json({ staff });
});

router.post('/staff', adminOnly, (req, res) => {
  const { email, password, name, surname } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email ve şifre zorunlu' });
  const id = `staff_${Math.random().toString(16).slice(2)}`;
  try {
    db.prepare('INSERT INTO users (id,email,password,role,name,surname,verified) VALUES (?,?,?,?,?,?,1)')
      .run(id, email.toLowerCase(), hashPassword(password), 'staff', name || '', surname || '');
    db.prepare('INSERT INTO staff_permissions (user_id) VALUES (?)').run(id);
    res.json({ ok: true, id });
  } catch (e) {
    if (e.code === 'SQLITE_CONSTRAINT_UNIQUE') return res.status(400).json({ error: 'Bu email zaten kayıtlı' });
    res.status(500).json({ error: e.message });
  }
});

router.patch('/staff/:id/permissions', adminOnly, (req, res) => {
  const perms = req.body;
  const existing = db.prepare('SELECT user_id FROM staff_permissions WHERE user_id=?').get(req.params.id);
  if (existing) {
    db.prepare(`UPDATE staff_permissions SET
      can_finance=?, can_users=?, can_games=?, can_matches=?,
      can_promotions=?, can_banners=?, can_wheel=?, can_settings=?
      WHERE user_id=?`).run(
      perms.can_finance?1:0, perms.can_users?1:0, perms.can_games?1:0, perms.can_matches?1:0,
      perms.can_promotions?1:0, perms.can_banners?1:0, perms.can_wheel?1:0, perms.can_settings?1:0,
      req.params.id
    );
  } else {
    db.prepare(`INSERT INTO staff_permissions (user_id,can_finance,can_users,can_games,can_matches,can_promotions,can_banners,can_wheel,can_settings) VALUES (?,?,?,?,?,?,?,?,?)`)
      .run(req.params.id, perms.can_finance?1:0, perms.can_users?1:0, perms.can_games?1:0, perms.can_matches?1:0, perms.can_promotions?1:0, perms.can_banners?1:0, perms.can_wheel?1:0, perms.can_settings?1:0);
  }
  res.json({ ok: true });
});

router.delete('/staff/:id', adminOnly, (req, res) => {
  db.prepare('DELETE FROM users WHERE id=? AND role=?').run(req.params.id, 'staff');
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
