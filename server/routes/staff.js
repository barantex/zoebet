const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../db');
const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key';

function hash(p) { return crypto.createHash('sha256').update(p).digest('hex'); }
function uid() { return `staff_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`; }

function adminOnly(req, res, next) {
  const token = (req.headers.authorization || '').split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Yetkisiz' });
  try {
    const d = jwt.verify(token, JWT_SECRET);
    if (d.role !== 'admin') return res.status(403).json({ error: 'Admin yetkisi gerekli' });
    req.admin = d; next();
  } catch { res.status(401).json({ error: 'Gecersiz token' }); }
}

// Staff login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  const staff = db.prepare('SELECT * FROM staff WHERE email=? AND active=1').get(email?.trim().toLowerCase());
  if (!staff || staff.password !== hash(password)) {
    return res.status(401).json({ error: 'Gecersiz email veya sifre' });
  }
  const token = jwt.sign({ id: staff.id, email: staff.email, role: 'staff', permissions: JSON.parse(staff.permissions || '[]') }, JWT_SECRET, { expiresIn: '12h' });
  res.json({ token, staff: { id: staff.id, email: staff.email, name: staff.name, permissions: JSON.parse(staff.permissions || '[]') } });
});

// GET all staff (admin)
router.get('/', adminOnly, (req, res) => {
  const list = db.prepare('SELECT id,email,name,role,permissions,active,created_at FROM staff ORDER BY created_at DESC').all();
  res.json({ staff: list.map(s => ({ ...s, permissions: JSON.parse(s.permissions || '[]') })) });
});

// POST create staff (admin)
router.post('/', adminOnly, (req, res) => {
  const { email, password, name, permissions = [] } = req.body;
  if (!email || !password || !name) return res.status(400).json({ error: 'Email, sifre ve ad zorunlu' });
  try {
    const id = uid();
    db.prepare('INSERT INTO staff (id,email,password,name,permissions) VALUES (?,?,?,?,?)').run(id, email.trim().toLowerCase(), hash(password), name, JSON.stringify(permissions));
    res.json({ ok: true, id });
  } catch (e) {
    if (e.code === 'SQLITE_CONSTRAINT_UNIQUE') return res.status(400).json({ error: 'Bu email zaten kayitli' });
    res.status(500).json({ error: e.message });
  }
});

// PATCH update staff (admin)
router.patch('/:id', adminOnly, (req, res) => {
  const { name, email, password, permissions, active } = req.body;
  const s = db.prepare('SELECT * FROM staff WHERE id=?').get(req.params.id);
  if (!s) return res.status(404).json({ error: 'Personel bulunamadi' });
  db.prepare('UPDATE staff SET name=COALESCE(?,name), email=COALESCE(?,email), active=COALESCE(?,active), permissions=COALESCE(?,permissions) WHERE id=?')
    .run(name ?? null, email ?? null, active ?? null, permissions ? JSON.stringify(permissions) : null, s.id);
  if (password) db.prepare('UPDATE staff SET password=? WHERE id=?').run(hash(password), s.id);
  res.json({ ok: true });
});

// DELETE staff (admin)
router.delete('/:id', adminOnly, (req, res) => {
  db.prepare('DELETE FROM staff WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
