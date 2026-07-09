const express  = require('express');
const { pool } = require('../config/database');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/banners
router.get('/', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM banners WHERE is_active = true ORDER BY sort_order ASC'
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
});

// POST /api/banners (admin)
router.post('/', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { title, image_url, link_url, sort_order } = req.body;
    if (!title || !image_url) return res.status(400).json({ success: false, message: 'Judul dan gambar wajib diisi' });
    await pool.query(
      'INSERT INTO banners (title, image_url, link_url, sort_order) VALUES (?, ?, ?, ?)',
      [title, image_url, link_url || null, sort_order || 0]
    );
    res.status(201).json({ success: true, message: 'Banner berhasil dibuat' });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/banners/:id (admin)
router.delete('/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    await pool.query('DELETE FROM banners WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Banner dihapus' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
