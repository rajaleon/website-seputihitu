const express  = require('express');
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// GET /api/wishlist
router.get('/', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT w.id, w.created_at, p.id AS product_id, p.name, p.slug, p.thumbnail_url, p.price, p.discount_price
       FROM wishlists w JOIN products p ON p.id = w.product_id
       WHERE w.user_id = ? ORDER BY w.created_at DESC`,
      [req.user.id]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
});

// POST /api/wishlist
router.post('/', async (req, res, next) => {
  try {
    const { product_id } = req.body;
    if (!product_id) return res.status(400).json({ success: false, message: 'product_id wajib diisi' });
    const id = uuidv4();
    await pool.query('INSERT IGNORE INTO wishlists (id, user_id, product_id) VALUES (?,?,?)', [id, req.user.id, product_id]);
    res.status(201).json({ success: true, message: 'Produk disimpan ke wishlist' });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/wishlist/:product_id
router.delete('/:product_id', async (req, res, next) => {
  try {
    await pool.query('DELETE FROM wishlists WHERE user_id = ? AND product_id = ?', [req.user.id, req.params.product_id]);
    res.json({ success: true, message: 'Produk dihapus dari wishlist' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
