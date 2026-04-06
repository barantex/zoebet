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

function uid() {
  return `tx_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

/* ── IBANS ── */
router.get('/ibans', adminOnly, (req, res) => {
  const ibans = db.prepare('SELECT * FROM ibans ORDER BY created_at DESC').all();
  res.json({ ibans });
});

router.post('/ibans', adminOnly, (req, res) => {
  const { bank_name, account_name, iban, logo } = req.body;
  if (!bank_name || !account_name || !iban) return res.status(400).json({ error: 'Banka adı, hesap sahibi ve IBAN zorunlu' });
  const id = `iban_${Math.random().toString(16).slice(2)}`;
  db.prepare('INSERT INTO ibans (id, bank_name, account_name, iban, logo) VALUES (?,?,?,?,?)').run(id, bank_name, account_name, iban, logo || null);
  res.json({ ok: true, id });
});

router.patch('/ibans/:id', adminOnly, (req, res) => {
  const { bank_name, account_name, iban, logo, active } = req.body;
  db.prepare('UPDATE ibans SET bank_name=COALESCE(?,bank_name), account_name=COALESCE(?,account_name), iban=COALESCE(?,iban), logo=COALESCE(?,logo), active=COALESCE(?,active) WHERE id=?')
    .run(bank_name ?? null, account_name ?? null, iban ?? null, logo ?? null, active ?? null, req.params.id);
  res.json({ ok: true });
});

router.delete('/ibans/:id', adminOnly, (req, res) => {
  db.prepare('DELETE FROM ibans WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

/* ── DEPOSIT REQUESTS (pending) ── */
router.get('/deposits', adminOnly, (req, res) => {
  const { status = 'pending', page = 1, limit = 30 } = req.query;
  const offset = (Number(page) - 1) * Number(limit);
  const txs = db.prepare(`
    SELECT t.*, u.email, u.name, u.surname, u.phone
    FROM transactions t
    JOIN users u ON u.id = t.user_id
    WHERE t.type='deposit' AND t.status=?
    ORDER BY t.created_at DESC LIMIT ? OFFSET ?
  `).all(status, Number(limit), offset);
  const total = db.prepare(`SELECT COUNT(*) as c FROM transactions WHERE type='deposit' AND status=?`).get(status).c;
  res.json({ deposits: txs, total });
});

// Approve deposit → add balance
router.post('/deposits/:id/approve', adminOnly, (req, res) => {
  const tx = db.prepare('SELECT * FROM transactions WHERE id=? AND type=?').get(req.params.id, 'deposit');
  if (!tx) return res.status(404).json({ error: 'İşlem bulunamadı' });
  if (tx.status !== 'pending') return res.status(400).json({ error: 'Bu işlem zaten işleme alındı' });

  db.transaction(() => {
    db.prepare('UPDATE transactions SET status=? WHERE id=?').run('completed', tx.id);
    const wallet = db.prepare('SELECT balance FROM wallets WHERE user_id=?').get(tx.user_id);
    const newBal = (wallet?.balance ?? 0) + tx.amount;
    if (wallet) {
      db.prepare('UPDATE wallets SET balance=? WHERE user_id=?').run(newBal, tx.user_id);
    } else {
      db.prepare('INSERT INTO wallets (user_id, balance) VALUES (?,?)').run(tx.user_id, newBal);
    }
  })();

  res.json({ ok: true });
});

// Reject deposit
router.post('/deposits/:id/reject', adminOnly, (req, res) => {
  const { note } = req.body;
  const tx = db.prepare('SELECT * FROM transactions WHERE id=? AND type=?').get(req.params.id, 'deposit');
  if (!tx) return res.status(404).json({ error: 'İşlem bulunamadı' });
  db.prepare('UPDATE transactions SET status=?, note=? WHERE id=?').run('rejected', note || null, tx.id);
  res.json({ ok: true });
});

/* ── WITHDRAW REQUESTS ── */
router.get('/withdrawals', adminOnly, (req, res) => {
  const { status = 'pending', page = 1, limit = 30 } = req.query;
  const offset = (Number(page) - 1) * Number(limit);
  const txs = db.prepare(`
    SELECT t.*, u.email, u.name, u.surname, u.phone
    FROM transactions t
    JOIN users u ON u.id = t.user_id
    WHERE t.type='withdraw' AND t.status=?
    ORDER BY t.created_at DESC LIMIT ? OFFSET ?
  `).all(status, Number(limit), offset);
  const total = db.prepare(`SELECT COUNT(*) as c FROM transactions WHERE type='withdraw' AND status=?`).get(status).c;
  res.json({ withdrawals: txs, total });
});

router.post('/withdrawals/:id/approve', adminOnly, (req, res) => {
  const tx = db.prepare('SELECT * FROM transactions WHERE id=? AND type=?').get(req.params.id, 'withdraw');
  if (!tx) return res.status(404).json({ error: 'İşlem bulunamadı' });
  if (tx.status !== 'pending') return res.status(400).json({ error: 'Bu işlem zaten işleme alındı' });
  db.prepare('UPDATE transactions SET status=? WHERE id=?').run('completed', tx.id);
  res.json({ ok: true });
});

router.post('/withdrawals/:id/reject', adminOnly, (req, res) => {
  const { note } = req.body;
  const tx = db.prepare('SELECT * FROM transactions WHERE id=? AND type=?').get(req.params.id, 'withdraw');
  if (!tx) return res.status(404).json({ error: 'İşlem bulunamadı' });
  // Refund balance
  db.transaction(() => {
    db.prepare('UPDATE transactions SET status=?, note=? WHERE id=?').run('rejected', note || null, tx.id);
    const wallet = db.prepare('SELECT balance FROM wallets WHERE user_id=?').get(tx.user_id);
    db.prepare('UPDATE wallets SET balance=? WHERE user_id=?').run((wallet?.balance ?? 0) + tx.amount, tx.user_id);
  })();
  res.json({ ok: true });
});

/* ── MANUAL BALANCE ADJUST ── */
router.post('/adjust', adminOnly, (req, res) => {
  const { user_id, amount, note } = req.body;
  if (!user_id || amount === undefined) return res.status(400).json({ error: 'user_id ve amount zorunlu' });
  const wallet = db.prepare('SELECT balance FROM wallets WHERE user_id=?').get(user_id);
  const newBal = (wallet?.balance ?? 0) + Number(amount);
  if (newBal < 0) return res.status(400).json({ error: 'Bakiye negatife düşemez' });
  db.transaction(() => {
    if (wallet) {
      db.prepare('UPDATE wallets SET balance=? WHERE user_id=?').run(newBal, user_id);
    } else {
      db.prepare('INSERT INTO wallets (user_id, balance) VALUES (?,?)').run(user_id, newBal);
    }
    db.prepare('INSERT INTO transactions (id, user_id, type, amount, status, note) VALUES (?,?,?,?,?,?)')
      .run(uid(), user_id, Number(amount) >= 0 ? 'deposit' : 'withdraw', Math.abs(Number(amount)), 'completed', note || 'Manuel düzenleme');
  })();
  res.json({ ok: true, newBalance: newBal });
});

module.exports = router;
