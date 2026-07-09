const express = require('express');
const axios   = require('axios');
const { pool } = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

const BITESHIP_BASE = 'https://api.biteship.com/v1';

function biteshipHeaders() {
  return {
    'Authorization': `Bearer ${process.env.BITESHIP_API_KEY}`,
    'Content-Type': 'application/json',
  };
}

// POST /api/shipping/estimate
// Body: { destination_postal_code, items: [{id, name, value, weight, qty}] }
router.post('/estimate', authenticate, async (req, res, next) => {
  try {
    const { destination_postal_code, destination_city_name, items } = req.body;
    if (!destination_postal_code || !items?.length) {
      return res.status(400).json({ success: false, message: 'Kode pos tujuan dan items wajib diisi' });
    }

    const payload = {
      origin_postal_code:      process.env.BITESHIP_ORIGIN_POSTAL_CODE || '10110',
      destination_postal_code,
      destination_city_name:   destination_city_name || '',
      couriers:                'jne,sicepat,jnt,anteraja,gosend,grab_express',
      items,
    };

    const { data } = await axios.post(`${BITESHIP_BASE}/rates/couriers`, payload, {
      headers: biteshipHeaders(),
      timeout: 10000,
    });

    const couriers = data.pricing?.map(p => ({
      courier_code:       p.courier_code,
      courier_name:       p.courier_name,
      service_code:       p.service_code || p.courier_service_code,
      service_name:       p.service_name || p.courier_service_name,
      price:              p.price,
      min_day:            p.min_day,
      max_day:            p.max_day,
    })) || [];

    res.json({ success: true, data: couriers });
  } catch (err) {
    if (err.response) {
      return res.status(502).json({ success: false, message: 'Gagal menghubungi Biteship', detail: err.response.data });
    }
    next(err);
  }
});

// POST /api/shipping/create  — dipanggil internal setelah pembayaran sukses
router.post('/create', authenticate, async (req, res, next) => {
  try {
    const { order_id } = req.body;
    if (!order_id) return res.status(400).json({ success: false, message: 'order_id wajib diisi' });

    // Ambil data order lengkap
    const [orders] = await pool.query(
      `SELECT o.*, a.recipient_name, a.phone AS addr_phone, a.full_address, a.city, a.province, a.postal_code
       FROM orders o JOIN addresses a ON a.id = o.address_id WHERE o.id = ?`,
      [order_id]
    );
    if (orders.length === 0) return res.status(404).json({ success: false, message: 'Order tidak ditemukan' });
    const order = orders[0];

    const [items] = await pool.query(
      `SELECT oi.qty, oi.price, p.name, p.weight_gram, p.length_cm, p.width_cm, p.height_cm
       FROM order_items oi JOIN products p ON p.id = oi.product_id WHERE oi.order_id = ?`,
      [order_id]
    );

    const payload = {
      shipper_contact_name:    'Seputihitu Store',
      shipper_contact_phone:   process.env.STORE_PHONE || '081234567890',
      shipper_contact_email:   process.env.STORE_EMAIL || 'store@seputihitu.com',
      origin_contact_name:     'Seputihitu Store',
      origin_contact_phone:    process.env.STORE_PHONE || '081234567890',
      origin_address:          process.env.STORE_ADDRESS || 'Jl. Contoh No. 1, Jakarta',
      origin_postal_code:      parseInt(process.env.BITESHIP_ORIGIN_POSTAL_CODE || '10110'),
      destination_contact_name:  order.recipient_name,
      destination_contact_phone: order.addr_phone,
      destination_address:       order.full_address,
      destination_postal_code:   parseInt(order.postal_code),
      courier_company:           order.courier_service?.split('-')[0] || 'jne',
      courier_type:              order.courier_service?.split('-')[1] || 'reg',
      delivery_type:             'now',
      order_note:                order.notes || '',
      items: items.map(i => ({
        name:     i.name,
        value:    Number(i.price),
        weight:   i.weight_gram || 500,
        quantity: i.qty,
        length:   i.length_cm  || 10,
        width:    i.width_cm   || 10,
        height:   i.height_cm  || 10,
      })),
    };

    const { data } = await axios.post(`${BITESHIP_BASE}/orders`, payload, {
      headers: biteshipHeaders(),
      timeout: 15000,
    });

    const { v4: uuidv4 } = require('uuid');
    await pool.query(
      `INSERT INTO shipments (id, order_id, biteship_order_id, courier_name, courier_service, tracking_id, status, waybill_url)
       VALUES (?,?,?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE biteship_order_id=VALUES(biteship_order_id), tracking_id=VALUES(tracking_id), status=VALUES(status)`,
      [uuidv4(), order_id, data.id, data.courier?.company, data.courier?.type,
       data.courier?.waybill_id || null, data.status || 'allocated',
       data.courier?.link || null]
    );

    await pool.query("UPDATE orders SET status = 'shipped' WHERE id = ?", [order_id]);

    res.json({ success: true, message: 'Pengiriman dibuat', data: { biteship_order_id: data.id, waybill: data.courier?.waybill_id } });
  } catch (err) {
    if (err.response) {
      return res.status(502).json({ success: false, message: 'Gagal membuat pengiriman di Biteship', detail: err.response.data });
    }
    next(err);
  }
});

module.exports = router;
