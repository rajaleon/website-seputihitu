const express  = require('express');
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../config/database');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { q } = require('../utils/db');

const router = express.Router();
router.use(authenticate);

// Helper: generate order number
function generateOrderNumber() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(Math.random() * 900000) + 100000;
  return `SPH-${date}-${rand}`;
}

// POST /api/orders  — create order dari cart
router.post('/', async (req, res, next) => {
  try {
    const { address_id, courier_service, shipping_cost, voucher_id, notes, idempotency_key } = req.body;
    if (!address_id) return res.status(400).json({ success: false, message: 'Pilih alamat pengiriman' });

    // Idempotency check
    if (idempotency_key) {
      const [existing] = await pool.query('SELECT id, order_number FROM orders WHERE idempotency_key = ?', [idempotency_key]);
      if (existing.length > 0) {
        return res.status(200).json({ success: true, message: 'Order sudah dibuat sebelumnya', order_number: existing[0].order_number, order_id: existing[0].id });
      }
    }

    // Validasi alamat milik user
    const [addresses] = await pool.query('SELECT id FROM addresses WHERE id = ? AND user_id = ?', [address_id, req.user.id]);
    if (addresses.length === 0) return res.status(400).json({ success: false, message: 'Alamat tidak valid' });

    // Ambil cart items yang dipilih
    const [cartRows] = await pool.query('SELECT id FROM carts WHERE user_id = ?', [req.user.id]);
    if (cartRows.length === 0) return res.status(400).json({ success: false, message: 'Keranjang kosong' });
    const cartId = cartRows[0].id;

    const [items] = await pool.query(
      `SELECT ci.*, p.stock, p.name, pv.stock AS variant_stock
       FROM cart_items ci
       JOIN products p ON p.id = ci.product_id
       LEFT JOIN product_variants pv ON pv.id = ci.variant_id
       WHERE ci.cart_id = ? AND ci.is_selected = true`,
      [cartId]
    );
    if (items.length === 0) return res.status(400).json({ success: false, message: 'Tidak ada item yang dipilih' });

    // Cek stok
    for (const item of items) {
      const stock = item.variant_id ? item.variant_stock : item.stock;
      if (item.qty > stock) {
        return res.status(400).json({ success: false, message: `Stok ${item.name} tidak mencukupi` });
      }
    }

    const subtotal = items.reduce((s, i) => s + Number(i.price_snapshot) * i.qty, 0);
    let discount = 0;

    // Validasi voucher
    let validVoucherId = null;
    if (voucher_id) {
      const [vouchers] = await pool.query(
        `SELECT * FROM vouchers WHERE id = ? AND is_active = true AND expired_at > NOW()
         AND (quota IS NULL OR used_count < quota)`,
        [voucher_id]
      );
      if (vouchers.length > 0) {
        const v = vouchers[0];
        if (subtotal >= Number(v.min_purchase)) {
          discount = v.type === 'percent'
            ? Math.min((subtotal * Number(v.value)) / 100, v.max_discount || Infinity)
            : Number(v.value);
          validVoucherId = v.id;
        }
      }
    }

    const shippingCost = Number(shipping_cost || 0);
    const total = subtotal - discount + shippingCost;
    const orderId     = uuidv4();
    const orderNumber = generateOrderNumber();
    const paymentId   = uuidv4();

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // Buat order
      await conn.query(
        `INSERT INTO orders (id, order_number, user_id, address_id, voucher_id, courier_service,
          shipping_cost, subtotal, discount, total, notes, idempotency_key)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
        [orderId, orderNumber, req.user.id, address_id, validVoucherId, courier_service || null,
         shippingCost, subtotal, discount, total, notes || null, idempotency_key || null]
      );

      // Buat order items & kurangi stok
      for (const item of items) {
        await conn.query(
          'INSERT INTO order_items (id, order_id, product_id, variant_id, qty, price) VALUES (?,?,?,?,?,?)',
          [uuidv4(), orderId, item.product_id, item.variant_id || null, item.qty, item.price_snapshot]
        );
        if (item.variant_id) {
          await conn.query('UPDATE product_variants SET stock = stock - ? WHERE id = ?', [item.qty, item.variant_id]);
        } else {
          await conn.query('UPDATE products SET stock = stock - ? WHERE id = ?', [item.qty, item.product_id]);
        }
        await conn.query('UPDATE products SET total_sold = total_sold + ? WHERE id = ?', [item.qty, item.product_id]);
      }

      // Buat payment record — expired 24 jam dari sekarang
      const expiredAt = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
      await conn.query(
        'INSERT INTO payments (id, order_id, gross_amount, expired_at) VALUES (?,?,?,?)',
        [paymentId, orderId, total, expiredAt]
      );

      // Update voucher usage
      if (validVoucherId) {
        await conn.query('UPDATE vouchers SET used_count = used_count + 1 WHERE id = ?', [validVoucherId]);
      }

      // Hapus cart items yang sudah diorder
      await conn.query('DELETE FROM cart_items WHERE cart_id = ? AND is_selected = true', [cartId]);

      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }

    res.status(201).json({ success: true, message: 'Order berhasil dibuat', order_id: orderId, order_number: orderNumber });
  } catch (err) {
    next(err);
  }
});

// GET /api/orders  — list order user
router.get('/', async (req, res, next) => {
  try {
    const { status, page = 1 } = req.query;
    const limit  = 10;
    const offset = (parseInt(page) - 1) * limit;
    const params = [req.user.id];
    let where = 'WHERE o.user_id = ?';
    if (status) { where += ' AND o.status = ?'; params.push(status); }

    const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM orders o ${where}`, params);
    const [rows] = await pool.query(
      `SELECT o.id, o.order_number, o.total, o.status, o.created_at,
              COUNT(oi.id) AS item_count
       FROM orders o
       LEFT JOIN order_items oi ON oi.order_id = o.id
       ${where}
       GROUP BY o.id
       ORDER BY o.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    res.json({ success: true, data: rows, pagination: { page: parseInt(page), limit, total, total_pages: Math.ceil(total / limit) } });
  } catch (err) {
    next(err);
  }
});

// GET /api/orders/:order_number
router.get('/:order_number', async (req, res, next) => {
  try {
    const [orders] = await pool.query(
      `SELECT o.*, a.recipient_name, a.phone AS addr_phone, a.full_address, a.city, a.province, a.postal_code
       FROM orders o LEFT JOIN addresses a ON a.id = o.address_id
       WHERE o.order_number = ? AND o.user_id = ?`,
      [req.params.order_number, req.user.id]
    );
    if (orders.length === 0) return res.status(404).json({ success: false, message: 'Order tidak ditemukan' });

    const order = orders[0];
    const [items] = await pool.query(
      `SELECT oi.*, p.name, p.thumbnail_url, pv.variant_name
       FROM order_items oi
       JOIN products p ON p.id = oi.product_id
       LEFT JOIN product_variants pv ON pv.id = oi.variant_id
       WHERE oi.order_id = ?`,
      [order.id]
    );
    const [payments] = await pool.query('SELECT * FROM payments WHERE order_id = ?', [order.id]);
    const [shipments] = await pool.query('SELECT * FROM shipments WHERE order_id = ?', [order.id]);

    res.json({ success: true, data: { ...order, items, payment: payments[0] || null, shipment: shipments[0] || null } });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/orders/:id/cancel
router.patch('/:id/cancel', async (req, res, next) => {
  try {
    const [orders] = await pool.query(
      'SELECT id, status FROM orders WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (orders.length === 0) return res.status(404).json({ success: false, message: 'Order tidak ditemukan' });
    if (!['pending_payment', 'paid'].includes(orders[0].status)) {
      return res.status(400).json({ success: false, message: 'Order tidak bisa dibatalkan pada status ini' });
    }
    await pool.query("UPDATE orders SET status = 'cancelled' WHERE id = ?", [req.params.id]);
    res.json({ success: true, message: 'Order dibatalkan' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
