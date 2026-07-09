const express  = require('express');
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../config/database');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { q } = require('../utils/db');

const router = express.Router();

// ── GET /api/products  (catalog dengan filter, sort, pagination) ──
router.get('/', async (req, res, next) => {
  try {
    const {
      category, min_price, max_price, sort = 'created_at_desc',
      page = 1, limit = 20, search, featured, flash_sale,
    } = req.query;

    const params = [];
    const conditions = ['p.is_active = true'];

    if (category)   { conditions.push('c.slug = ?');             params.push(category); }
    if (min_price)  { conditions.push('p.price >= ?');           params.push(Number(min_price)); }
    if (max_price)  { conditions.push('p.price <= ?');           params.push(Number(max_price)); }
    if (featured === 'true')    { conditions.push('p.is_featured = true'); }
    if (flash_sale === 'true')  { conditions.push('p.is_flash_sale = true AND p.flash_sale_end > NOW()'); }
    if (search) {
      conditions.push('(p.name LIKE ? OR p.description LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    const whereClause = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

    const sortMap = {
      price_asc:        'p.price ASC',
      price_desc:       'p.price DESC',
      rating_desc:      'p.rating_avg DESC',
      sold_desc:        'p.total_sold DESC',
      created_at_desc:  'p.created_at DESC',
    };
    const orderBy = sortMap[sort] || 'p.created_at DESC';

    const pageNum  = Math.max(1, parseInt(page));
    const pageSize = Math.min(100, Math.max(1, parseInt(limit)));
    const offset   = (pageNum - 1) * pageSize;

    const baseQuery = `
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      ${whereClause}
    `;

    const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total ${baseQuery}`, params);
    const [rows] = await pool.query(
      `SELECT p.id, p.sku, p.name, p.slug, p.price, p.discount_price,
              p.stock, p.thumbnail_url, p.rating_avg, p.total_sold,
              p.is_flash_sale, p.flash_sale_end,
              c.name AS category_name, c.slug AS category_slug
       ${baseQuery}
       ORDER BY ${orderBy}
       LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    );

    res.json({
      success: true,
      data: rows,
      pagination: {
        page: pageNum,
        limit: pageSize,
        total,
        total_pages: Math.ceil(total / pageSize),
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/products/featured
router.get('/featured', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, name, slug, price, discount_price, thumbnail_url, rating_avg, total_sold
       FROM products WHERE is_active = true AND is_featured = true ORDER BY total_sold DESC LIMIT 12`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
});

// GET /api/products/flash-sale
router.get('/flash-sale', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, name, slug, price, discount_price, thumbnail_url, rating_avg, flash_sale_end
       FROM products WHERE is_active = true AND is_flash_sale = true AND flash_sale_end > NOW()
       ORDER BY flash_sale_end ASC LIMIT 12`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
});

// GET /api/products/:slug  (detail produk)
router.get('/:slug', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.*, c.name AS category_name, c.slug AS category_slug
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       WHERE p.slug = ? AND p.is_active = true`,
      [req.params.slug]
    );
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Produk tidak ditemukan' });

    const product = rows[0];

    const [images]   = await pool.query('SELECT * FROM product_images WHERE product_id = ? ORDER BY sort_order', [product.id]);
    const [variants] = await pool.query('SELECT * FROM product_variants WHERE product_id = ?', [product.id]);

    // Related products (same category)
    const [related] = await pool.query(
      `SELECT id, name, slug, price, discount_price, thumbnail_url, rating_avg
       FROM products WHERE category_id = ? AND id != ? AND is_active = true LIMIT 8`,
      [product.category_id, product.id]
    );

    res.json({ success: true, data: { ...product, images, variants, related } });
  } catch (err) {
    next(err);
  }
});

// GET /api/products/:id/reviews
router.get('/:id/reviews', async (req, res, next) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page || 1));
    const limit = 10;
    const offset = (page - 1) * limit;

    const [[{ total }]] = await pool.query(
      'SELECT COUNT(*) AS total FROM product_reviews WHERE product_id = ?', [req.params.id]
    );
    const [rows] = await pool.query(
      `SELECT r.*, u.name AS user_name, u.avatar_url
       FROM product_reviews r JOIN users u ON u.id = r.user_id
       WHERE r.product_id = ? ORDER BY r.created_at DESC LIMIT ? OFFSET ?`,
      [req.params.id, limit, offset]
    );
    res.json({ success: true, data: rows, pagination: { page, limit, total, total_pages: Math.ceil(total / limit) } });
  } catch (err) {
    next(err);
  }
});

// POST /api/products (admin)
router.post('/', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const {
      sku, name, slug, description, specification,
      price, discount_price, stock, category_id, thumbnail_url,
      weight_gram, length_cm, width_cm, height_cm,
      is_featured, is_flash_sale, flash_sale_end,
    } = req.body;

    if (!sku || !name || !slug || !price) {
      return res.status(400).json({ success: false, message: 'SKU, nama, slug, dan harga wajib diisi' });
    }

    const id = uuidv4();
    await pool.query(
      `INSERT INTO products
         (id, sku, name, slug, description, specification, price, discount_price, stock,
          category_id, thumbnail_url, weight_gram, length_cm, width_cm, height_cm,
          is_featured, is_flash_sale, flash_sale_end)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [id, sku, name, slug, description, specification, price, discount_price || null, stock || 0,
       category_id || null, thumbnail_url || null, weight_gram || 0,
       length_cm || null, width_cm || null, height_cm || null,
       is_featured ? 1 : 0, is_flash_sale ? 1 : 0, flash_sale_end || null]
    );
    res.status(201).json({ success: true, message: 'Produk berhasil dibuat', id });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/products/:id (admin)
router.patch('/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const fields = ['name','slug','description','specification','price','discount_price',
                    'stock','category_id','thumbnail_url','weight_gram','length_cm',
                    'width_cm','height_cm','is_featured','is_flash_sale','flash_sale_end','is_active'];
    const updates = [];
    const values  = [];
    fields.forEach(f => {
      if (req.body[f] !== undefined) { updates.push(`${f} = ?`); values.push(req.body[f]); }
    });
    if (updates.length === 0) return res.status(400).json({ success: false, message: 'Tidak ada data yang diubah' });
    values.push(req.params.id);
    await pool.query(`UPDATE products SET ${updates.join(', ')} WHERE id = ?`, values);
    res.json({ success: true, message: 'Produk berhasil diperbarui' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
