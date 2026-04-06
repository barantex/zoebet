const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key';

function hashPassword(p) {
  return crypto.createHash('sha256').update(p).digest('hex');
}

// Auth middleware: allow role='finance' or role='admin'
function financeAuth(req, res, next) {
  const token = (req.headers.authorization || '').split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Yetkisiz' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'finance' && decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Finans yetkisi gerekli' });
    }
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Geçersiz token' });
  }
}

/* ── LOGIN ── */
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email ve şifre zorunlu' });
  const user = db.prepare('SELECT * FROM users WHERE email=?').get(email);
  if (!user || user.password !== hashPassword(password)) {
    return res.status(401).json({ error: 'Email veya şifre hatalı' });
  }
  if (user.role !== 'finance' && user.role !== 'admin') {
    return res.status(403).json({ error: 'Bu panele erişim yetkiniz yok' });
  }
  const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, role: user.role, name: user.name, email: user.email });
});

/* ── STATS ── */
router.get('/stats', financeAuth, (req, res) => {
  try {
    const pendingDeposits = db.prepare("SELECT COUNT(*) as c FROM transactions WHERE type='deposit' AND status='pending'").get().c;
    const pendingWithdrawals = db.prepare("SELECT COUNT(*) as c FROM transactions WHERE type='withdraw' AND status='pending'").get().c;
    const todayDepositsTotal = db.prepare("SELECT COALESCE(SUM(amount),0) as s FROM transactions WHERE type='deposit' AND status='completed' AND date(created_at)=date('now')").get().s;
    const todayDepositsCount = db.prepare("SELECT COUNT(*) as c FROM transactions WHERE type='deposit' AND status='completed' AND date(created_at)=date('now')").get().c;
    const todayWithdrawalsTotal = db.prepare("SELECT COALESCE(SUM(amount),0) as s FROM transactions WHERE type='withdraw' AND status='completed' AND date(created_at)=date('now')").get().s;
    const todayWithdrawalsCount = db.prepare("SELECT COUNT(*) as c FROM transactions WHERE type='withdraw' AND status='completed' AND date(created_at)=date('now')").get().c;
    const totalBalance = db.prepare('SELECT COALESCE(SUM(balance),0) as s FROM wallets').get().s;
    res.json({ pendingDeposits, pendingWithdrawals, todayDepositsTotal, todayDepositsCount, todayWithdrawalsTotal, todayWithdrawalsCount, totalBalance });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

/* ── DEPOSITS ── */
router.get('/deposits', financeAuth, (req, res) => {
  const { status = 'pending', page = 1, limit = 30 } = req.query;
  const offset = (Number(page) - 1) * Number(limit);
  const txs = db.prepare(`
    SELECT t.*, u.email, u.name, u.surname, u.phone
    FROM transactions t JOIN users u ON u.id=t.user_id
    WHERE t.type='deposit' AND t.status=?
    ORDER BY t.created_at DESC LIMIT ? OFFSET ?
  `).all(status, Number(limit), offset);
  const total = db.prepare("SELECT COUNT(*) as c FROM transactions WHERE type='deposit' AND status=?").get(status).c;
  res.json({ deposits: txs, total });
});

router.post('/deposits/:id/approve', financeAuth, (req, res) => {
  const tx = db.prepare("SELECT * FROM transactions WHERE id=? AND type='deposit'").get(req.params.id);
  if (!tx) return res.status(404).json({ error: 'İşlem bulunamadı' });
  if (tx.status !== 'pending') return res.status(400).json({ error: 'Bu işlem zaten işleme alındı' });
  db.transaction(() => {
    db.prepare('UPDATE transactions SET status=? WHERE id=?').run('completed', tx.id);
    const wallet = db.prepare('SELECT balance FROM wallets WHERE user_id=?').get(tx.user_id);
    const newBal = (wallet?.balance ?? 0) + tx.amount;
    if (wallet) db.prepare('UPDATE wallets SET balance=? WHERE user_id=?').run(newBal, tx.user_id);
    else db.prepare('INSERT INTO wallets (user_id, balance) VALUES (?,?)').run(tx.user_id, newBal);
  })();
  res.json({ ok: true });
});

router.post('/deposits/:id/reject', financeAuth, (req, res) => {
  const { note } = req.body;
  const tx = db.prepare("SELECT * FROM transactions WHERE id=? AND type='deposit'").get(req.params.id);
  if (!tx) return res.status(404).json({ error: 'İşlem bulunamadı' });
  db.prepare('UPDATE transactions SET status=?, note=? WHERE id=?').run('rejected', note || null, tx.id);
  res.json({ ok: true });
});

/* ── WITHDRAWALS ── */
router.get('/withdrawals', financeAuth, (req, res) => {
  const { status = 'pending', page = 1, limit = 30 } = req.query;
  const offset = (Number(page) - 1) * Number(limit);
  const txs = db.prepare(`
    SELECT t.*, u.email, u.name, u.surname, u.phone
    FROM transactions t JOIN users u ON u.id=t.user_id
    WHERE t.type='withdraw' AND t.status=?
    ORDER BY t.created_at DESC LIMIT ? OFFSET ?
  `).all(status, Number(limit), offset);
  const total = db.prepare("SELECT COUNT(*) as c FROM transactions WHERE type='withdraw' AND status=?").get(status).c;
  res.json({ withdrawals: txs, total });
});

router.post('/withdrawals/:id/approve', financeAuth, (req, res) => {
  const tx = db.prepare("SELECT * FROM transactions WHERE id=? AND type='withdraw'").get(req.params.id);
  if (!tx) return res.status(404).json({ error: 'İşlem bulunamadı' });
  if (tx.status !== 'pending') return res.status(400).json({ error: 'Bu işlem zaten işleme alındı' });
  db.prepare('UPDATE transactions SET status=? WHERE id=?').run('completed', tx.id);
  res.json({ ok: true });
});

router.post('/withdrawals/:id/reject', financeAuth, (req, res) => {
  const { note } = req.body;
  const tx = db.prepare("SELECT * FROM transactions WHERE id=? AND type='withdraw'").get(req.params.id);
  if (!tx) return res.status(404).json({ error: 'İşlem bulunamadı' });
  db.transaction(() => {
    db.prepare('UPDATE transactions SET status=?, note=? WHERE id=?').run('rejected', note || null, tx.id);
    const wallet = db.prepare('SELECT balance FROM wallets WHERE user_id=?').get(tx.user_id);
    db.prepare('UPDATE wallets SET balance=? WHERE user_id=?').run((wallet?.balance ?? 0) + tx.amount, tx.user_id);
  })();
  res.json({ ok: true });
});

/* ── IBANS ── */
router.get('/ibans', financeAuth, (req, res) => {
  const ibans = db.prepare('SELECT * FROM ibans ORDER BY created_at DESC').all();
  res.json({ ibans });
});

router.post('/ibans', financeAuth, (req, res) => {
  const { bank_name, account_name, iban, logo } = req.body;
  if (!bank_name || !account_name || !iban) return res.status(400).json({ error: 'Banka adı, hesap sahibi ve IBAN zorunlu' });
  const id = `iban_${Math.random().toString(16).slice(2)}`;
  db.prepare('INSERT INTO ibans (id, bank_name, account_name, iban, logo) VALUES (?,?,?,?,?)').run(id, bank_name, account_name, iban, logo || null);
  res.json({ ok: true, id });
});

router.patch('/ibans/:id', financeAuth, (req, res) => {
  const { bank_name, account_name, iban, logo, active } = req.body;
  db.prepare('UPDATE ibans SET bank_name=COALESCE(?,bank_name), account_name=COALESCE(?,account_name), iban=COALESCE(?,iban), logo=COALESCE(?,logo), active=COALESCE(?,active) WHERE id=?')
    .run(bank_name ?? null, account_name ?? null, iban ?? null, logo ?? null, active ?? null, req.params.id);
  res.json({ ok: true });
});

router.delete('/ibans/:id', financeAuth, (req, res) => {
  db.prepare('DELETE FROM ibans WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
