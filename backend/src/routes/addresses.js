const express  = require('express');
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /api/addresses
router.get('/', authenticate, async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM addresses WHERE user_id = ? ORDER BY is_primary DESC, created_at DESC',
      [req.user.id]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
});

// POST /api/addresses
router.post('/', authenticate, async (req, res, next) => {
  try {
    const { recipient_name, phone, full_address, postal_code, city, province, latitude, longitude, is_primary } = req.body;
    if (!recipient_name || !phone || !full_address || !postal_code || !city || !province) {
      return res.status(400).json({ success: false, message: 'Semua field alamat wajib diisi' });
    }

    const id = uuidv4();

    // Jika set primary, unset yang lama
    if (is_primary) {
      await pool.query('UPDATE addresses SET is_primary = false WHERE user_id = ?', [req.user.id]);
    }

    // Jika belum ada alamat sama sekali, otomatis set primary
    const [[{ count }]] = await pool.query(
      'SELECT COUNT(*) AS count FROM addresses WHERE user_id = ?', [req.user.id]
    );
    const setPrimary = is_primary || count === 0 ? 1 : 0;

    await pool.query(
      `INSERT INTO addresses (id, user_id, recipient_name, phone, full_address, postal_code, city, province, latitude, longitude, is_primary)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [id, req.user.id, recipient_name, phone, full_address, postal_code, city, province,
       latitude || null, longitude || null, setPrimary]
    );
    res.status(201).json({ success: true, message: 'Alamat berhasil ditambahkan', id });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/addresses/:id
router.patch('/:id', authenticate, async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT id FROM addresses WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Alamat tidak ditemukan' });

    const { recipient_name, phone, full_address, postal_code, city, province, latitude, longitude, is_primary } = req.body;
    if (is_primary) {
      await pool.query('UPDATE addresses SET is_primary = false WHERE user_id = ?', [req.user.id]);
    }
    await pool.query(
      `UPDATE addresses SET recipient_name=?, phone=?, full_address=?, postal_code=?, city=?, province=?, latitude=?, longitude=?, is_primary=?
       WHERE id = ? AND user_id = ?`,
      [recipient_name, phone, full_address, postal_code, city, province,
       latitude || null, longitude || null, is_primary ? 1 : 0, req.params.id, req.user.id]
    );
    res.json({ success: true, message: 'Alamat diperbarui' });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/addresses/:id
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    await pool.query('DELETE FROM addresses WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.json({ success: true, message: 'Alamat dihapus' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
