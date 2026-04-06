const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key';

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Yetkisiz' });
  const token = authHeader.split(' ')[1];
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    res.status(401).json({ error: 'Geçersiz token' });
  }
}

function uid(prefix) {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

router.get('/balance', authenticate, (req, res) => {
  const wallet = db.prepare('SELECT balance FROM wallets WHERE user_id = ?').get(req.user.id);
  res.json({ balance: wallet ? wallet.balance : 0 });
});

// GET /api/finance/ibans — public active ibans for deposit page
router.get('/ibans', (req, res) => {
  const ibans = db.prepare('SELECT id, bank_name, account_name, iban FROM ibans WHERE active=1 ORDER BY created_at DESC').all();
  res.json({ ibans });
});

router.post('/transaction', authenticate, (req, res) => {
  const { type, amount, method, reference_id, withdraw_iban } = req.body;
  
  if (!['deposit', 'withdraw'].includes(type) || amount <= 0) {
    return res.status(400).json({ error: 'Geçersiz işlem veya tutar' });
  }

  try {
    if (type === 'deposit') {
      // Deposit stays pending until admin approves
      const txId = uid('tx');
      db.prepare('INSERT INTO transactions (id, user_id, type, amount, method, status, reference_id) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .run(txId, req.user.id, 'deposit', amount, method || null, 'pending', reference_id || null);
      return res.json({ success: true, message: 'Yatırım talebiniz alındı.' });
    }

    // Withdraw: deduct balance immediately, stays pending for admin to process
    const performTx = db.transaction(() => {
      const wallet = db.prepare('SELECT balance FROM wallets WHERE user_id = ?').get(req.user.id);
      let newBalance = wallet ? wallet.balance : 0;
      if (newBalance < amount) throw new Error('Yetersiz bakiye');
      newBalance -= amount;
      db.prepare('UPDATE wallets SET balance = ? WHERE user_id = ?').run(newBalance, req.user.id);
      const txId = uid('tx');
      db.prepare('INSERT INTO transactions (id, user_id, type, amount, method, status, reference_id) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .run(txId, req.user.id, 'withdraw', amount, method || null, 'pending', withdraw_iban || null);
      return newBalance;
    });

    const newBalance = performTx();
    res.json({ success: true, balance: newBalance });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/history', authenticate, (req, res) => {
  const txs = db.prepare('SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 50').all(req.user.id);
  res.json({ transactions: txs });
});

module.exports = router;
