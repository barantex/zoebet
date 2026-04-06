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

function authenticate(req, res, next) {
  const token = (req.headers.authorization || '').split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Yetkisiz' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch { res.status(401).json({ error: 'Geçersiz token' }); }
}

function uid() {
  return `wc_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;
}

function randomCode(length = 8) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

/* ── WHEEL SLICES (public) ── */
router.get('/slices', (req, res) => {
  const slices = db.prepare('SELECT * FROM wheel_slices WHERE active=1 ORDER BY id').all();
  res.json({ slices });
});

/* ── ADMIN: manage slices ── */
router.get('/admin/slices', adminOnly, (req, res) => {
  const slices = db.prepare('SELECT * FROM wheel_slices ORDER BY id').all();
  res.json({ slices });
});

router.post('/admin/slices', adminOnly, (req, res) => {
  const { label, amount, color, probability } = req.body;
  if (!label || !amount) return res.status(400).json({ error: 'Label ve tutar zorunlu' });
  const id = `ws_${Date.now().toString(36)}`;
  db.prepare('INSERT INTO wheel_slices (id, label, amount, color, probability) VALUES (?,?,?,?,?)')
    .run(id, label, Number(amount), color || '#f5c518', Number(probability) || 10);
  res.json({ ok: true, id });
});

router.patch('/admin/slices/:id', adminOnly, (req, res) => {
  const { label, amount, color, probability, active } = req.body;
  db.prepare('UPDATE wheel_slices SET label=COALESCE(?,label), amount=COALESCE(?,amount), color=COALESCE(?,color), probability=COALESCE(?,probability), active=COALESCE(?,active) WHERE id=?')
    .run(label ?? null, amount ?? null, color ?? null, probability ?? null, active ?? null, req.params.id);
  res.json({ ok: true });
});

router.delete('/admin/slices/:id', adminOnly, (req, res) => {
  db.prepare('DELETE FROM wheel_slices WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

/* ── USER: spin wheel ── */
router.post('/spin', authenticate, (req, res) => {
  const slices = db.prepare('SELECT * FROM wheel_slices WHERE active=1').all();
  if (!slices.length) return res.status(400).json({ error: 'Çark dilimi yok' });

  // Check cooldown: 1 spin per 24h
  const lastSpin = db.prepare('SELECT created_at FROM wheel_spins WHERE user_id=? ORDER BY created_at DESC LIMIT 1').get(req.user.id);
  if (lastSpin) {
    const diff = Date.now() - new Date(lastSpin.created_at).getTime();
    if (diff < 24 * 60 * 60 * 1000) {
      const remaining = Math.ceil((24 * 60 * 60 * 1000 - diff) / 3600000);
      return res.status(429).json({ error: `Sonraki çevirme hakkın ${remaining} saat sonra.`, cooldown: true });
    }
  }

  // Weighted random
  const total = slices.reduce((s, sl) => s + sl.probability, 0);
  let rand = Math.random() * total;
  let winner = slices[0];
  for (const sl of slices) {
    rand -= sl.probability;
    if (rand <= 0) { winner = sl; break; }
  }

  db.transaction(() => {
    db.prepare('INSERT INTO wheel_spins (id, user_id, slice_id, amount) VALUES (?,?,?,?)')
      .run(`spin_${Date.now()}`, req.user.id, winner.id, winner.amount);
    const wallet = db.prepare('SELECT balance FROM wallets WHERE user_id=?').get(req.user.id);
    const newBal = (wallet?.balance ?? 0) + winner.amount;
    if (wallet) {
      db.prepare('UPDATE wallets SET balance=? WHERE user_id=?').run(newBal, req.user.id);
    } else {
      db.prepare('INSERT INTO wallets (user_id, balance) VALUES (?,?)').run(req.user.id, newBal);
    }
    db.prepare('INSERT INTO transactions (id, user_id, type, amount, method, status, note) VALUES (?,?,?,?,?,?,?)')
      .run(`tx_${Date.now()}`, req.user.id, 'deposit', winner.amount, 'Çark', 'completed', `Çark ödülü: ${winner.label}`);
  })();

  const wallet = db.prepare('SELECT balance FROM wallets WHERE user_id=?').get(req.user.id);
  res.json({ ok: true, winner, newBalance: wallet?.balance ?? 0 });
});

/* ── USER: spin status ── */
router.get('/spin/status', authenticate, (req, res) => {
  const lastSpin = db.prepare('SELECT created_at FROM wheel_spins WHERE user_id=? ORDER BY created_at DESC LIMIT 1').get(req.user.id);
  if (!lastSpin) return res.json({ canSpin: true });
  const diff = Date.now() - new Date(lastSpin.created_at).getTime();
  const cooldown = 24 * 60 * 60 * 1000;
  if (diff >= cooldown) return res.json({ canSpin: true });
  const remaining = Math.ceil((cooldown - diff) / 3600000);
  res.json({ canSpin: false, remaining, nextSpin: new Date(new Date(lastSpin.created_at).getTime() + cooldown) });
});
router.get('/admin/codes', adminOnly, (req, res) => {
  const codes = db.prepare(`
    SELECT wc.*, u.email as used_by_email
    FROM wheel_codes wc
    LEFT JOIN users u ON u.id = wc.used_by
    ORDER BY wc.created_at DESC
  `).all();
  res.json({ codes });
});

/* ── ADMIN: create codes ── */
router.post('/admin/codes', adminOnly, (req, res) => {
  const { amount, count = 1, expires_at, code: customCode } = req.body;
  if (!amount || amount <= 0) return res.status(400).json({ error: 'Geçerli bir tutar gir' });

  const created = [];
  const num = Math.min(Number(count), 100);

  if (customCode && num === 1) {
    // Single custom code
    const code = customCode.trim().toUpperCase();
    const id = uid();
    try {
      db.prepare('INSERT INTO wheel_codes (id, code, amount, expires_at) VALUES (?,?,?,?)').run(id, code, Number(amount), expires_at || null);
      created.push({ id, code, amount });
    } catch (e: any) {
      if (e.code === 'SQLITE_CONSTRAINT_UNIQUE') return res.status(400).json({ error: `"${code}" kodu zaten mevcut` });
      throw e;
    }
  } else {
    for (let i = 0; i < num; i++) {
      const code = randomCode();
      const id = uid();
      db.prepare('INSERT INTO wheel_codes (id, code, amount, expires_at) VALUES (?,?,?,?)').run(id, code, Number(amount), expires_at || null);
      created.push({ id, code, amount });
    }
  }
  res.json({ ok: true, codes: created });
});

/* ── ADMIN: delete code ── */
router.delete('/admin/codes/:id', adminOnly, (req, res) => {
  db.prepare('DELETE FROM wheel_codes WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

/* ── USER: redeem code ── */
router.post('/redeem', authenticate, (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: 'Kod zorunlu' });

  const wc = db.prepare('SELECT * FROM wheel_codes WHERE code=?').get(code.trim().toUpperCase());
  if (!wc) return res.status(404).json({ error: 'Geçersiz kod' });
  if (wc.used) return res.status(400).json({ error: 'Bu kod daha önce kullanıldı' });
  if (wc.expires_at && new Date(wc.expires_at) < new Date()) {
    return res.status(400).json({ error: 'Kodun süresi dolmuş' });
  }

  db.transaction(() => {
    db.prepare('UPDATE wheel_codes SET used=1, used_by=?, used_at=CURRENT_TIMESTAMP WHERE id=?')
      .run(req.user.id, wc.id);
    const wallet = db.prepare('SELECT balance FROM wallets WHERE user_id=?').get(req.user.id);
    const newBal = (wallet?.balance ?? 0) + wc.amount;
    if (wallet) {
      db.prepare('UPDATE wallets SET balance=? WHERE user_id=?').run(newBal, req.user.id);
    } else {
      db.prepare('INSERT INTO wallets (user_id, balance) VALUES (?,?)').run(req.user.id, newBal);
    }
    // Log transaction
    db.prepare('INSERT INTO transactions (id, user_id, type, amount, method, status, note) VALUES (?,?,?,?,?,?,?)')
      .run(`tx_${Date.now()}`, req.user.id, 'deposit', wc.amount, 'Çark Kodu', 'completed', `Kod: ${wc.code}`);
  })();

  const wallet = db.prepare('SELECT balance FROM wallets WHERE user_id=?').get(req.user.id);
  res.json({ ok: true, amount: wc.amount, newBalance: wallet?.balance ?? 0 });
});

module.exports = router;
