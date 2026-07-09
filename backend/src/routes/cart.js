const express  = require('express');
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { q } = require('../utils/db');

const router = express.Router();

// Semua cart routes butuh auth
router.use(authenticate);

// Helper: dapatkan atau buat cart untuk user
async function getOrCreateCart(userId) {
  let [rows] = await pool.query('SELECT id FROM carts WHERE user_id = ?', [userId]);
  if (rows.length > 0) return rows[0].id;
  const cartId = uuidv4();
  await pool.query('INSERT INTO carts (id, user_id) VALUES (?,?)', [cartId, userId]);
  return cartId;
}

// GET /api/cart
router.get('/', async (req, res, next) => {
  try {
    const cartId = await getOrCreateCart(req.user.id);
    const [items] = await pool.query(
      `SELECT ci.id, ci.qty, ci.price_snapshot, ci.is_selected,
              p.id AS product_id, p.name, p.slug, p.thumbnail_url, p.stock,
              pv.id AS variant_id, pv.variant_name, pv.stock AS variant_stock
       FROM cart_items ci
       JOIN products p ON p.id = ci.product_id
       LEFT JOIN product_variants pv ON pv.id = ci.variant_id
       WHERE ci.cart_id = ?`,
      [cartId]
    );

    const subtotal = items
      .filter(i => i.is_selected)
      .reduce((sum, i) => sum + Number(i.price_snapshot) * i.qty, 0);

    res.json({ success: true, data: { cart_id: cartId, items, subtotal } });
  } catch (err) {
    next(err);
  }
});

// POST /api/cart/items
router.post('/items', async (req, res, next) => {
  try {
    const { product_id, variant_id, qty = 1 } = req.body;
    if (!product_id) return res.status(400).json({ success: false, message: 'product_id wajib diisi' });

    // Cek produk & stok
    const [products] = await pool.query(
      'SELECT id, price, discount_price, stock FROM products WHERE id = ? AND is_active = true',
      [product_id]
    );
    if (products.length === 0) return res.status(404).json({ success: false, message: 'Produk tidak ditemukan' });
    const product = products[0];

    let priceSnapshot = Number(product.discount_price || product.price);
    let availableStock = product.stock;

    if (variant_id) {
      const [variants] = await pool.query('SELECT price, stock FROM product_variants WHERE id = ? AND product_id = ?', [variant_id, product_id]);
      if (variants.length === 0) return res.status(404).json({ success: false, message: 'Varian tidak ditemukan' });
      if (variants[0].price) priceSnapshot = Number(variants[0].price);
      availableStock = variants[0].stock;
    }

    if (qty > availableStock) {
      return res.status(400).json({ success: false, message: `Stok tidak mencukupi (tersedia: ${availableStock})` });
    }

    const cartId = await getOrCreateCart(req.user.id);

    // Jika item sudah ada, update qty
    const [existing] = await pool.query(
      'SELECT id, qty FROM cart_items WHERE cart_id = ? AND product_id = ? AND (variant_id = ? OR (variant_id IS NULL AND ? IS NULL))',
      [cartId, product_id, variant_id || null, variant_id || null]
    );

    if (existing.length > 0) {
      const newQty = existing[0].qty + qty;
      if (newQty > availableStock) {
        return res.status(400).json({ success: false, message: `Stok tidak mencukupi (tersedia: ${availableStock})` });
      }
      await pool.query('UPDATE cart_items SET qty = ? WHERE id = ?', [newQty, existing[0].id]);
    } else {
      await pool.query(
        'INSERT INTO cart_items (id, cart_id, product_id, variant_id, qty, price_snapshot) VALUES (?,?,?,?,?,?)',
        [uuidv4(), cartId, product_id, variant_id || null, qty, priceSnapshot]
      );
    }

    res.status(201).json({ success: true, message: 'Produk ditambahkan ke keranjang' });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/cart/items/:id
router.patch('/items/:id', async (req, res, next) => {
  try {
    const { qty, is_selected } = req.body;
    const cartId = await getOrCreateCart(req.user.id);

    const [items] = await pool.query(
      'SELECT ci.id, ci.product_id, ci.variant_id FROM cart_items ci WHERE ci.id = ? AND ci.cart_id = ?',
      [req.params.id, cartId]
    );
    if (items.length === 0) return res.status(404).json({ success: false, message: 'Item tidak ditemukan' });

    const updates = [];
    const values  = [];

    if (qty !== undefined) {
      // Validasi stok
      const item = items[0];
      if (item.variant_id) {
        const [v] = await pool.query('SELECT stock FROM product_variants WHERE id = ?', [item.variant_id]);
        if (qty > v[0].stock) return res.status(400).json({ success: false, message: 'Stok tidak mencukupi' });
      } else {
        const [p] = await pool.query('SELECT stock FROM products WHERE id = ?', [item.product_id]);
        if (qty > p[0].stock) return res.status(400).json({ success: false, message: 'Stok tidak mencukupi' });
      }
      updates.push('qty = ?'); values.push(qty);
    }
    if (is_selected !== undefined) { updates.push('is_selected = ?'); values.push(is_selected ? 1 : 0); }

    if (updates.length === 0) return res.status(400).json({ success: false, message: 'Tidak ada perubahan' });
    values.push(req.params.id);
    await pool.query(`UPDATE cart_items SET ${updates.join(', ')} WHERE id = ?`, values);
    res.json({ success: true, message: 'Keranjang diperbarui' });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/cart/items/:id
router.delete('/items/:id', async (req, res, next) => {
  try {
    const cartId = await getOrCreateCart(req.user.id);
    await pool.query('DELETE FROM cart_items WHERE id = ? AND cart_id = ?', [req.params.id, cartId]);
    res.json({ success: true, message: 'Item dihapus dari keranjang' });
  } catch (err) {
    next(err);
  }
});

// POST /api/cart/apply-voucher
router.post('/apply-voucher', async (req, res, next) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ success: false, message: 'Kode voucher wajib diisi' });

    const [vouchers] = await pool.query(
      `SELECT * FROM vouchers WHERE code = ? AND is_active = true AND expired_at > NOW()
       AND (quota IS NULL OR used_count < quota)`,
      [code]
    );
    if (vouchers.length === 0) {
      return res.status(404).json({ success: false, message: 'Voucher tidak valid atau sudah kadaluarsa' });
    }

    const voucher = vouchers[0];
    // Hitung subtotal dari item selected
    const cartId = await getOrCreateCart(req.user.id);
    const [items] = await pool.query(
      'SELECT price_snapshot, qty FROM cart_items WHERE cart_id = ? AND is_selected = true',
      [cartId]
    );
    const subtotal = items.reduce((s, i) => s + Number(i.price_snapshot) * i.qty, 0);

    if (subtotal < Number(voucher.min_purchase)) {
      return res.status(400).json({
        success: false,
        message: `Minimum pembelian Rp ${voucher.min_purchase.toLocaleString('id-ID')} untuk voucher ini`,
      });
    }

    let discount = voucher.type === 'percent'
      ? (subtotal * Number(voucher.value)) / 100
      : Number(voucher.value);

    if (voucher.max_discount && discount > Number(voucher.max_discount)) {
      discount = Number(voucher.max_discount);
    }

    res.json({
      success: true,
      data: {
        voucher_id: voucher.id,
        code: voucher.code,
        type: voucher.type,
        discount: Math.round(discount),
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
