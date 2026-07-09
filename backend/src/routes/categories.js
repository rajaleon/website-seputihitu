const express  = require('express');
const { pool } = require('../config/database');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/categories
router.get('/', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM categories WHERE is_active = true ORDER BY parent_id IS NULL DESC, name ASC'
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
});

// GET /api/categories/:slug
router.get('/:slug', async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM categories WHERE slug = ?', [req.params.slug]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Kategori tidak ditemukan' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
});

// POST /api/categories (admin)
router.post('/', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { name, slug, parent_id, icon_url } = req.body;
    if (!name || !slug) return res.status(400).json({ success: false, message: 'Nama dan slug wajib diisi' });
    await pool.query(
      'INSERT INTO categories (name, slug, parent_id, icon_url) VALUES (?, ?, ?, ?)',
      [name, slug, parent_id || null, icon_url || null]
    );
    res.status(201).json({ success: true, message: 'Kategori berhasil dibuat' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
