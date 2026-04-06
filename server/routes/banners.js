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
  } catch { res.status(401).json({ error: 'Gecersiz token' }); }
}

function uid() { return `b_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`; }

// GET /api/banners — public, active only
router.get('/', (req, res) => {
  const banners = db.prepare('SELECT * FROM banners WHERE active=1 ORDER BY sort_order ASC, created_at DESC').all();
  res.json({ banners });
});

// GET /api/banners/all — admin, all banners
router.get('/all', adminOnly, (req, res) => {
  const banners = db.prepare('SELECT * FROM banners ORDER BY sort_order ASC, created_at DESC').all();
  res.json({ banners });
});

// POST /api/banners — create
router.post('/', adminOnly, (req, res) => {
  const { title, subtitle, image_url, link_url, active = 1, sort_order = 0 } = req.body;
  if (!title || !image_url) return res.status(400).json({ error: 'Baslik ve gorsel zorunlu' });
  const id = uid();
  db.prepare('INSERT INTO banners (id,title,subtitle,image_url,link_url,active,sort_order) VALUES (?,?,?,?,?,?,?)')
    .run(id, title, subtitle || '', image_url, link_url || '/', active ? 1 : 0, Number(sort_order));
  res.json({ ok: true, id });
});

// PATCH /api/banners/:id — update
router.patch('/:id', adminOnly, (req, res) => {
  const { title, subtitle, image_url, link_url, active, sort_order } = req.body;
  db.prepare('UPDATE banners SET title=COALESCE(?,title), subtitle=COALESCE(?,subtitle), image_url=COALESCE(?,image_url), link_url=COALESCE(?,link_url), active=COALESCE(?,active), sort_order=COALESCE(?,sort_order) WHERE id=?')
    .run(title ?? null, subtitle ?? null, image_url ?? null, link_url ?? null, active ?? null, sort_order ?? null, req.params.id);
  res.json({ ok: true });
});

// DELETE /api/banners/:id
router.delete('/:id', adminOnly, (req, res) => {
  db.prepare('DELETE FROM banners WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
