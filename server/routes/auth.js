const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../db');
const crypto = require('crypto');
const { sendSms, generateOtp } = require('../sms');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key';

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function uid(prefix) {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

// POST /api/auth/register — create unverified user, send OTP
router.post('/register', async (req, res) => {
  const { email, password, name, surname, phone, tc } = req.body;

  if (!email || !password) return res.status(400).json({ error: 'E-posta ve şifre zorunlu' });
  if (!name?.trim()) return res.status(400).json({ error: 'Ad zorunlu' });
  if (!surname?.trim()) return res.status(400).json({ error: 'Soyad zorunlu' });
  if (!phone || !/^[0-9]{10,11}$/.test(phone.replace(/\s/g, ''))) {
    return res.status(400).json({ error: 'Geçerli bir telefon numarası gir (10-11 hane)' });
  }
  if (!tc || !/^[0-9]{11}$/.test(tc.trim())) {
    return res.status(400).json({ error: 'TC Kimlik No 11 haneli olmalı' });
  }

  const normalEmail = email.trim().toLowerCase();

  // Check existing verified user
  const existing = db.prepare('SELECT id, verified FROM users WHERE email = ?').get(normalEmail);
  if (existing && existing.verified) {
    return res.status(400).json({ error: 'Bu e-posta zaten kayıtlı.' });
  }

  const otp = generateOtp();
  const otpExpires = Date.now() + 10 * 60 * 1000; // 10 min

  try {
    if (existing && !existing.verified) {
      // Update existing unverified user
      db.prepare('UPDATE users SET password=?, name=?, surname=?, phone=?, tc=?, otp=?, otp_expires=? WHERE id=?')
        .run(hashPassword(password), name.trim(), surname.trim(), phone.trim(), tc.trim(), otp, otpExpires, existing.id);
    } else {
      const id = uid('u');
      const role = normalEmail === 'admin@zoebet.com' ? 'admin' : 'user';
      db.prepare('INSERT INTO users (id, email, password, role, name, surname, phone, tc, verified, otp, otp_expires) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)')
        .run(id, normalEmail, hashPassword(password), role, name.trim(), surname.trim(), phone.trim(), tc.trim(), otp, otpExpires);
    }

    await sendSms(phone.trim(), `ZoeBet doğrulama kodunuz: ${otp} (10 dakika geçerli)`);

    res.json({ ok: true, message: 'SMS gönderildi. Telefon numaranızı doğrulayın.' });
  } catch (err) {
    console.error('[Register]', err);
    res.status(500).json({ error: 'Kayıt sırasında hata oluştu: ' + err.message });
  }
});

// POST /api/auth/verify — verify OTP, activate account
router.post('/verify', (req, res) => {
  const { phone, otp } = req.body;
  if (!phone || !otp) return res.status(400).json({ error: 'Telefon ve kod zorunlu' });

  const normalPhone = phone.replace(/\s/g, '');
  const user = db.prepare('SELECT * FROM users WHERE phone = ? AND verified = 0').get(normalPhone);

  if (!user) return res.status(400).json({ error: 'Kullanıcı bulunamadı veya zaten doğrulandı.' });
  if (user.otp !== otp.trim()) return res.status(400).json({ error: 'Doğrulama kodu hatalı.' });
  if (Date.now() > user.otp_expires) return res.status(400).json({ error: 'Kod süresi dolmuş. Tekrar kayıt ol.' });

  // Activate user
  db.prepare('UPDATE users SET verified=1, otp=NULL, otp_expires=NULL WHERE id=?').run(user.id);

  // Create wallet if not exists
  const wallet = db.prepare('SELECT user_id FROM wallets WHERE user_id=?').get(user.id);
  if (!wallet) db.prepare('INSERT INTO wallets (user_id, balance) VALUES (?, 0)').run(user.id);

  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, email: user.email, role: user.role, name: user.name } });
});

// POST /api/auth/resend-otp
router.post('/resend-otp', async (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ error: 'Telefon zorunlu' });

  const normalPhone = phone.replace(/\s/g, '');
  const user = db.prepare('SELECT * FROM users WHERE phone = ? AND verified = 0').get(normalPhone);
  if (!user) return res.status(400).json({ error: 'Kullanıcı bulunamadı.' });

  const otp = generateOtp();
  const otpExpires = Date.now() + 10 * 60 * 1000;
  db.prepare('UPDATE users SET otp=?, otp_expires=? WHERE id=?').run(otp, otpExpires, user.id);

  try {
    await sendSms(normalPhone, `ZoeBet doğrulama kodunuz: ${otp} (10 dakika geçerli)`);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'SMS gönderilemedi: ' + err.message });
  }
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email?.trim().toLowerCase());

  if (!user || user.password !== hashPassword(password)) {
    return res.status(401).json({ error: 'Geçersiz e-posta veya şifre' });
  }
  if (!user.verified) {
    return res.status(403).json({ error: 'Hesabınız doğrulanmamış. Lütfen SMS kodunu girin.', unverified: true, phone: user.phone });
  }

  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, email: user.email, role: user.role, name: user.name } });
});

// GET /api/auth/me
router.get('/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Yetkisiz' });

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db.prepare('SELECT id, email, role, name FROM users WHERE id = ?').get(decoded.id);
    const wallet = db.prepare('SELECT balance FROM wallets WHERE user_id = ?').get(decoded.id);
    if (!user) return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    res.json({ user, balance: wallet ? wallet.balance : 0 });
  } catch {
    res.status(401).json({ error: 'Geçersiz token' });
  }
});

module.exports = router;
