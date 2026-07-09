const express  = require('express');
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// POST /api/reviews  — user submit ulasan setelah produk delivered
router.post('/', authenticate, async (req, res, next) => {
  try {
    const { product_id, rating, comment } = req.body;
    if (!product_id || !rating) {
      return res.status(400).json({ success: false, message: 'product_id dan rating wajib diisi' });
    }
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating harus antara 1-5' });
    }

    const id = uuidv4();
    await pool.query(
      'INSERT INTO product_reviews (id, product_id, user_id, rating, comment) VALUES (?, ?, ?, ?, ?)',
      [id, product_id, req.user.id, rating, comment || null]
    );

    // Update rating_avg pada produk
    await pool.query(
      `UPDATE products SET rating_avg = (
         SELECT AVG(rating) FROM product_reviews WHERE product_id = ?
       ) WHERE id = ?`,
      [product_id, product_id]
    );

    res.status(201).json({ success: true, message: 'Ulasan berhasil ditambahkan' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, message: 'Anda sudah memberikan ulasan untuk produk ini' });
    }
    next(err);
  }
});

module.exports = router;
