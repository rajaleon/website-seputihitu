const express  = require('express');
const midtrans = require('midtrans-client');
const { pool } = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

function getSnap() {
  return new midtrans.Snap({
    isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
    serverKey:    process.env.MIDTRANS_SERVER_KEY,
    clientKey:    process.env.MIDTRANS_CLIENT_KEY,
  });
}

// POST /api/payment/token — generate Snap token untuk order
router.post('/token', authenticate, async (req, res, next) => {
  try {
    const { order_id } = req.body;
    if (!order_id) return res.status(400).json({ success: false, message: 'order_id wajib diisi' });

    const [orders] = await pool.query(
      `SELECT o.*, u.name AS user_name, u.email AS user_email, u.phone AS user_phone
       FROM orders o JOIN users u ON u.id = o.user_id
       WHERE o.id = ? AND o.user_id = ?`,
      [order_id, req.user.id]
    );
    if (orders.length === 0) return res.status(404).json({ success: false, message: 'Order tidak ditemukan' });

    const order = orders[0];
    if (order.status !== 'pending_payment') {
      return res.status(400).json({ success: false, message: 'Order tidak dalam status pending_payment' });
    }

    // Gunakan snap token yang sudah ada jika ada
    if (order.snap_token) {
      return res.json({ success: true, snap_token: order.snap_token, client_key: process.env.MIDTRANS_CLIENT_KEY });
    }

    const [items] = await pool.query(
      `SELECT oi.qty, oi.price, p.name
       FROM order_items oi JOIN products p ON p.id = oi.product_id
       WHERE oi.order_id = ?`,
      [order_id]
    );

    const itemDetails = items.map(i => ({
      id:       i.name.toLowerCase().replace(/\s/g, '-').substring(0, 50),
      price:    Math.round(Number(i.price)),
      quantity: i.qty,
      name:     i.name.substring(0, 50),
    }));

    if (order.shipping_cost > 0) {
      itemDetails.push({ id: 'shipping', price: Math.round(order.shipping_cost), quantity: 1, name: 'Ongkos Kirim' });
    }
    if (order.discount > 0) {
      itemDetails.push({ id: 'discount', price: -Math.round(order.discount), quantity: 1, name: 'Diskon Voucher' });
    }

    const parameter = {
      transaction_details: {
        order_id:     order.order_number,
        gross_amount: Math.round(Number(order.total)),
      },
      customer_details: {
        first_name: order.user_name,
        email:      order.user_email,
        phone:      order.user_phone || '',
      },
      item_details: itemDetails,
      expiry: { duration: 24, unit: 'hours' },
    };

    const snap = getSnap();
    const transaction = await snap.createTransaction(parameter);

    // Simpan snap token
    await pool.query('UPDATE orders SET snap_token = ? WHERE id = ?', [transaction.token, order_id]);
    await pool.query('UPDATE payments SET expired_at = DATE_ADD(NOW(), INTERVAL 24 HOUR) WHERE order_id = ?', [order_id]);

    res.json({ success: true, snap_token: transaction.token, client_key: process.env.MIDTRANS_CLIENT_KEY });
  } catch (err) {
    next(err);
  }
});

// GET /api/payment/status/:order_number
router.get('/status/:order_number', authenticate, async (req, res, next) => {
  try {
    const [orders] = await pool.query(
      'SELECT id, status, total FROM orders WHERE order_number = ? AND user_id = ?',
      [req.params.order_number, req.user.id]
    );
    if (orders.length === 0) return res.status(404).json({ success: false, message: 'Order tidak ditemukan' });

    const [payments] = await pool.query(
      'SELECT transaction_status, payment_type, paid_at FROM payments WHERE order_id = ?',
      [orders[0].id]
    );

    res.json({
      success: true,
      data: { order_status: orders[0].status, payment: payments[0] || null },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
