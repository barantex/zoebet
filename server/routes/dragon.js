const express = require('express');
const router = express.Router();
const db = require('../db');
const jwt = require('jsonwebtoken');

// Bu route'lar Dragon API'nin sistemimizle haberleşebilmesi için özel olarak tasarlanmıştır.

// 1. Dragon Kullanıcı Doğrulama (Game Launch sırasında çağrılır)
router.post('/auth', (req, res) => {
  const { token } = req.body;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret_key');
    const user = db.prepare('SELECT id, email FROM users WHERE id = ?').get(decoded.id);
    if (!user) {
      return res.status(400).json({ status: 'error', message: 'User not found' });
    }
    res.json({ status: 'success', user_id: user.id, username: user.email });
  } catch (err) {
    res.status(401).json({ status: 'error', message: 'Invalid token' });
  }
});

// 2. Dragon Kullanıcı Bakiyesi Sorgulama
router.post('/balance', (req, res) => {
  const { user_id } = req.body;
  const wallet = db.prepare('SELECT balance FROM wallets WHERE user_id = ?').get(user_id);
  if (!wallet) return res.status(404).json({ status: 'error', message: 'Wallet not found' });
  res.json({ status: 'success', balance: wallet.balance });
});

function uid(prefix) {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

// 3. Dragon Finansal İşlemler (bet, win, refund)
router.post('/transaction', (req, res) => {
  const { user_id, type, amount, reference_id } = req.body;
  // type can be 'bet', 'win', 'refund'

  try {
    const result = db.transaction(() => {
      const wallet = db.prepare('SELECT balance FROM wallets WHERE user_id = ?').get(user_id);
      if (!wallet) throw new Error('Wallet not found');

      let newBalance = wallet.balance;
      const parsedAmount = parseFloat(amount);
      
      if (type === 'bet') {
        if (newBalance < parsedAmount) throw new Error('Insufficient funds');
        newBalance -= parsedAmount;
      } else if (type === 'win' || type === 'refund') {
        newBalance += parsedAmount;
      } else {
        throw new Error('Invalid transaction type');
      }

      // Check if reference_id already exists (idempotency)
      if (reference_id) {
        const existingTx = db.prepare('SELECT id FROM transactions WHERE reference_id = ? AND type = ?').get(reference_id, type);
        if (existingTx) {
            return newBalance; // Ignore duplicate request to prevent double processing
        }
      }

      db.prepare('UPDATE wallets SET balance = ? WHERE user_id = ?').run(newBalance, user_id);
      db.prepare('INSERT INTO transactions (id, user_id, type, amount, reference_id) VALUES (?, ?, ?, ?, ?)')
        .run(uid('tx'), user_id, type, parsedAmount, reference_id || null);

      return newBalance;
    })();

    res.json({ status: 'success', balance: result });
  } catch (err) {
    res.status(400).json({ status: 'error', message: err.message });
  }
});

module.exports = router;
