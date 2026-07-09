/**
 * Admin-only routes
 * Semua route di sini membutuhkan authenticate + requireAdmin
 */
const express  = require('express');
const { pool } = require('../config/database');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate, requireAdmin);

// ── GET /api/admin/stats ──────────────────────────────────────
router.get('/stats', async (req, res, next) => {
  try {
    const [[products]] = await pool.query('SELECT COUNT(*) AS total FROM products');
    const [[orders]]   = await pool.query('SELECT COUNT(*) AS total FROM orders');
    const [[users]]    = await pool.query("SELECT COUNT(*) AS total FROM users WHERE role = 'customer'");
    const [[revenue]]  = await pool.query(
      `SELECT COALESCE(SUM(total), 0) AS total
       FROM orders
       WHERE status IN ('paid','processing','shipped','delivered')
         AND DATE(created_at) = CURDATE()`
    );

    res.json({
      success: true,
      data: {
        total_products:  products.total,
        total_orders:    orders.total,
        total_users:     users.total,
        revenue_today:   Number(revenue.total),
      },
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/admin/orders/recent ─────────────────────────────
router.get('/orders/recent', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT o.order_number, o.total, o.status, o.created_at, u.name AS user_name
       FROM orders o JOIN users u ON u.id = o.user_id
       ORDER BY o.created_at DESC LIMIT 10`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/admin/products — list semua produk (termasuk nonaktif) ──
router.get('/products', async (req, res, next) => {
  try {
    const {
      search, sort = 'created_at_desc',
      page = 1, limit = 20,
    } = req.query;

    const sortMap = {
      price_asc:        'p.price ASC',
      price_desc:       'p.price DESC',
      sold_desc:        'p.total_sold DESC',
      created_at_desc:  'p.created_at DESC',
    };
    const orderBy  = sortMap[sort] || 'p.created_at DESC';
    const pageNum  = Math.max(1, parseInt(page));
    const pageSize = Math.min(100, Math.max(1, parseInt(limit)));
    const offset   = (pageNum - 1) * pageSize;

    const conditions = [];
    const params = [];

    if (search) {
      conditions.push('(p.name LIKE ? OR p.sku LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM products p ${where}`, params
    );

    const [rows] = await pool.query(
      `SELECT p.id, p.sku, p.name, p.slug, p.price, p.discount_price, p.stock,
              p.thumbnail_url, p.is_active, p.is_featured, p.is_flash_sale,
              p.total_sold, p.rating_avg, p.created_at,
              c.name AS category_name
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       ${where}
       ORDER BY ${orderBy}
       LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    );

    res.json({
      success: true,
      data: rows,
      pagination: { page: pageNum, limit: pageSize, total, total_pages: Math.ceil(total / pageSize) },
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/admin/products/:id — detail produk (termasuk variants) ──
router.get('/products/:id', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.*, c.name AS category_name
       FROM products p LEFT JOIN categories c ON c.id = p.category_id
       WHERE p.id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Produk tidak ditemukan' });
    }
    const product = rows[0];
    const [variants] = await pool.query(
      'SELECT * FROM product_variants WHERE product_id = ?', [product.id]
    );
    res.json({ success: true, data: { ...product, variants } });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/admin/users ─────────────────────────────────────
router.get('/users', async (req, res, next) => {
  try {
    const page     = Math.max(1, parseInt(req.query.page || '1'));
    const limit    = 20;
    const offset   = (page - 1) * limit;
    const search   = req.query.search || '';

    const where  = search ? 'WHERE name LIKE ? OR email LIKE ?' : '';
    const params = search ? [`%${search}%`, `%${search}%`] : [];

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM users ${where}`, params
    );

    const [rows] = await pool.query(
      `SELECT id, name, email, phone, role, is_active, created_at
       FROM users ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    res.json({
      success: true,
      data: rows,
      pagination: { page, limit, total, total_pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
});

// ── PATCH /api/admin/orders/:id/status ──────────────────────
router.patch('/orders/:id/status', async (req, res, next) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending_payment','paid','processing','shipped','delivered','cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Status tidak valid' });
    }
    await pool.query('UPDATE orders SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ success: true, message: 'Status order diperbarui' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
