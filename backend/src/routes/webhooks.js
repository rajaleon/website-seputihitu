const express  = require('express');
const crypto   = require('crypto');
const { pool } = require('../config/database');
const axios    = require('axios');

const router = express.Router();

// ── Midtrans Webhook ──────────────────────────────────────────
// POST /api/webhooks/midtrans
router.post('/midtrans', async (req, res) => {
  try {
    // Body diterima sebagai raw Buffer (di-set di server.js)
    const body = JSON.parse(req.body.toString());

    const {
      order_id:             orderNumber,
      status_code,
      gross_amount,
      transaction_status,
      fraud_status,
      payment_type,
      transaction_id,
      signature_key:        receivedSig,
    } = body;

    // Validasi signature
    const expectedSig = crypto
      .createHash('sha512')
      .update(`${orderNumber}${status_code}${gross_amount}${process.env.MIDTRANS_SERVER_KEY}`)
      .digest('hex');

    if (receivedSig !== expectedSig) {
      console.warn(`[Midtrans] Invalid signature for order ${orderNumber}`);
      return res.status(200).json({ message: 'ignored' }); // Tetap 200 agar Midtrans tidak retry
    }

    // Dapatkan order internal
    const [orders] = await pool.query('SELECT id, status FROM orders WHERE order_number = ?', [orderNumber]);
    if (orders.length === 0) return res.status(200).json({ message: 'order not found' });

    const orderId    = orders[0].id;
    const currentStatus = orders[0].status;

    // Map status Midtrans ke status order internal
    let newOrderStatus = null;
    let paymentStatus  = transaction_status;
    let paidAt         = null;

    if (transaction_status === 'settlement' || (transaction_status === 'capture' && fraud_status === 'accept')) {
      newOrderStatus = 'paid';
      paidAt = new Date();
    } else if (transaction_status === 'pending') {
      paymentStatus  = 'pending';
    } else if (['cancel', 'deny', 'expire'].includes(transaction_status)) {
      newOrderStatus = 'cancelled';
    }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // Update payment record
      await conn.query(
        `UPDATE payments SET
           midtrans_transaction_id = ?,
           payment_type            = ?,
           transaction_status      = ?,
           fraud_status            = ?,
           paid_at                 = ?,
           raw_response_json       = ?
         WHERE order_id = ?`,
        [transaction_id, payment_type, paymentStatus, fraud_status || null, paidAt, JSON.stringify(body), orderId]
      );

      // Update order status (jangan downgrade status)
      if (newOrderStatus && currentStatus === 'pending_payment') {
        await conn.query('UPDATE orders SET status = ? WHERE id = ?', [newOrderStatus, orderId]);
      }

      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }

    // Jika pembayaran sukses, trigger buat shipment di Biteship
    if (newOrderStatus === 'paid') {
      await pool.query("UPDATE orders SET status = 'processing' WHERE id = ?", [orderId]);
      // Fire-and-forget: buat shipment (non-blocking)
      createBiteshipShipment(orderId).catch(e => console.error('[Biteship] Create shipment failed:', e.message));
    }

    res.status(200).json({ message: 'ok' });
  } catch (err) {
    console.error('[Midtrans Webhook Error]', err);
    res.status(200).json({ message: 'error handled' }); // Tetap 200 agar Midtrans tidak loop
  }
});

// ── BiteShip Webhook ─────────────────────────────────────────
// POST /api/webhooks/biteship
router.post('/biteship', async (req, res) => {
  try {
    const body = JSON.parse(req.body.toString());
    const { order_id: biteshipOrderId, status, waybill_id, courier } = body;

    if (!biteshipOrderId) return res.status(200).json({ message: 'ok' });

    const [shipments] = await pool.query(
      'SELECT id, order_id FROM shipments WHERE biteship_order_id = ?', [biteshipOrderId]
    );
    if (shipments.length === 0) return res.status(200).json({ message: 'shipment not found' });

    const shipment = shipments[0];

    await pool.query(
      `UPDATE shipments SET status = ?, tracking_id = ?, waybill_url = ?, last_status_at = NOW()
       WHERE id = ?`,
      [status, waybill_id || null, courier?.link || null, shipment.id]
    );

    // Update order status jika delivered
    if (status === 'delivered') {
      await pool.query("UPDATE orders SET status = 'delivered' WHERE id = ?", [shipment.order_id]);
    } else if (status === 'allocated' || status === 'picking_up' || status === 'picked') {
      await pool.query("UPDATE orders SET status = 'processing' WHERE id = ?", [shipment.order_id]);
    } else if (status === 'dropping_off' || status === 'in_transit') {
      await pool.query("UPDATE orders SET status = 'shipped' WHERE id = ?", [shipment.order_id]);
    }

    res.status(200).json({ message: 'ok' });
  } catch (err) {
    console.error('[Biteship Webhook Error]', err);
    res.status(200).json({ message: 'error handled' });
  }
});

// ── Helper: Buat shipment di Biteship ─────────────────────────
async function createBiteshipShipment(orderId) {
  const BITESHIP_BASE = 'https://api.biteship.com/v1';
  const { v4: uuidv4 } = require('uuid');

  const [orders] = await pool.query(
    `SELECT o.*, a.recipient_name, a.phone AS addr_phone, a.full_address, a.city, a.province, a.postal_code
     FROM orders o JOIN addresses a ON a.id = o.address_id WHERE o.id = ?`,
    [orderId]
  );
  if (!orders.length) return;
  const order = orders[0];

  const [items] = await pool.query(
    `SELECT oi.qty, oi.price, p.name, p.weight_gram, p.length_cm, p.width_cm, p.height_cm
     FROM order_items oi JOIN products p ON p.id = oi.product_id WHERE oi.order_id = ?`,
    [orderId]
  );

  const payload = {
    shipper_contact_name:      'Seputihitu Store',
    shipper_contact_phone:     process.env.STORE_PHONE || '081234567890',
    origin_contact_name:       'Seputihitu Store',
    origin_contact_phone:      process.env.STORE_PHONE || '081234567890',
    origin_address:            process.env.STORE_ADDRESS || 'Jl. Contoh No. 1, Jakarta',
    origin_postal_code:        parseInt(process.env.BITESHIP_ORIGIN_POSTAL_CODE || '10110'),
    destination_contact_name:  order.recipient_name,
    destination_contact_phone: order.addr_phone,
    destination_address:       order.full_address,
    destination_postal_code:   parseInt(order.postal_code),
    courier_company:           order.courier_service?.split('-')[0] || 'jne',
    courier_type:              order.courier_service?.split('-')[1] || 'reg',
    delivery_type:             'now',
    order_note:                order.notes || '',
    items: items.map(i => ({
      name: i.name, value: Number(i.price), weight: i.weight_gram || 500,
      quantity: i.qty, length: i.length_cm || 10, width: i.width_cm || 10, height: i.height_cm || 10,
    })),
  };

  const { data } = await axios.post(`${BITESHIP_BASE}/orders`, payload, {
    headers: { Authorization: `Bearer ${process.env.BITESHIP_API_KEY}`, 'Content-Type': 'application/json' },
    timeout: 15000,
  });

  await pool.query(
    `INSERT INTO shipments (id, order_id, biteship_order_id, courier_name, courier_service, tracking_id, status, waybill_url)
     VALUES (?,?,?,?,?,?,?,?)
     ON DUPLICATE KEY UPDATE biteship_order_id=VALUES(biteship_order_id), tracking_id=VALUES(tracking_id), status=VALUES(status)`,
    [uuidv4(), orderId, data.id, data.courier?.company, data.courier?.type,
     data.courier?.waybill_id || null, data.status || 'allocated', data.courier?.link || null]
  );
}

module.exports = router;
