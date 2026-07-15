import { NextRequest } from 'next/server';
import { query, execute } from '@/lib/server/db';
import { requireAuth } from '@/lib/server/auth';
import { notifyPaymentSuccess } from '@/lib/server/whatsapp';

/**
 * POST /api/payment/confirm
 * Untuk demo/sandbox: confirm payment → update status order ke paid → buat shipment
 */
export async function POST(req: NextRequest) {
  try {
    const user = requireAuth(req);
    if (user instanceof Response) return user;

    const { order_id, payment_method } = await req.json();
    if (!order_id) return Response.json({ success: false, message: 'order_id wajib' }, { status: 400 });

    // Cek order milik user
    const orders = await query(
      'SELECT id, status, order_number, total FROM orders WHERE id = ? AND user_id = ?',
      [order_id, user.id]
    );
    if (orders.length === 0) return Response.json({ success: false, message: 'Order tidak ditemukan' }, { status: 404 });
    
    const order = orders[0];
    if (order.status !== 'pending_payment') {
      return Response.json({ success: false, message: 'Order sudah dibayar sebelumnya' }, { status: 400 });
    }

    // Update payment record → lunas
    await execute(
      `UPDATE payments SET 
        transaction_status = 'settlement',
        payment_type = ?,
        paid_at = NOW(),
        midtrans_transaction_id = ?
       WHERE order_id = ?`,
      [payment_method || 'demo_payment', `DEMO-${Date.now()}`, order_id]
    );

    // Update order status → paid
    await execute("UPDATE orders SET status = 'paid' WHERE id = ?", [order_id]);

    // Otomatis buat shipment ke BiteShip
    let shipmentResult = null;
    try {
      const BITESHIP_API_KEY = process.env.BITESHIP_API_KEY;
      if (BITESHIP_API_KEY && !BITESHIP_API_KEY.includes('demo')) {
        // Ambil data untuk create shipment
        const orderData = await query(
          `SELECT o.*, a.recipient_name, a.phone AS addr_phone, a.full_address, 
                  a.city, a.province, a.postal_code
           FROM orders o JOIN addresses a ON a.id = o.address_id 
           WHERE o.id = ?`, [order_id]
        );
        const items = await query(
          `SELECT oi.qty, oi.price, p.name, p.weight_gram, p.length_cm, p.width_cm, p.height_cm
           FROM order_items oi JOIN products p ON p.id = oi.product_id WHERE oi.order_id = ?`, [order_id]
        );

        if (orderData.length > 0) {
          const o = orderData[0];
          const courierParts = (o.courier_service || 'jne-reg').split('-');

          const payload = {
            shipper_contact_name: 'Seputihitu Store',
            shipper_contact_phone: process.env.STORE_PHONE || '081234567890',
            shipper_contact_email: process.env.STORE_EMAIL || 'store@seputihitu.com',
            origin_contact_name: 'Seputihitu Store',
            origin_contact_phone: process.env.STORE_PHONE || '081234567890',
            origin_address: process.env.STORE_ADDRESS || 'Jl. Contoh No. 1',
            origin_postal_code: parseInt(process.env.BITESHIP_ORIGIN_POSTAL_CODE || '10110'),
            destination_contact_name: o.recipient_name,
            destination_contact_phone: o.addr_phone,
            destination_address: o.full_address,
            destination_postal_code: parseInt(o.postal_code),
            courier_company: courierParts[0] || 'jne',
            courier_type: courierParts.slice(1).join('-') || 'reg',
            delivery_type: 'now',
            order_note: o.notes || '',
            items: items.map((i: any) => ({
              name: i.name, value: Number(i.price), weight: i.weight_gram || 500,
              quantity: i.qty, length: i.length_cm || 10, width: i.width_cm || 10, height: i.height_cm || 10,
            })),
          };

          const biteRes = await fetch('https://api.biteship.com/v1/orders', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${BITESHIP_API_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          const biteData = await biteRes.json();

          if (biteRes.ok) {
            const shipmentId = crypto.randomUUID();
            await execute(
              `INSERT INTO shipments (id, order_id, biteship_order_id, courier_name, courier_service, tracking_id, status, waybill_url)
               VALUES (?,?,?,?,?,?,?,?)
               ON CONFLICT (order_id) DO UPDATE SET 
                 biteship_order_id = EXCLUDED.biteship_order_id,
                 tracking_id = EXCLUDED.tracking_id,
                 status = EXCLUDED.status`,
              [shipmentId, order_id, biteData.id, biteData.courier?.company, biteData.courier?.type,
               biteData.courier?.waybill_id || null, biteData.status || 'confirmed', biteData.courier?.link || null]
            );
            await execute("UPDATE orders SET status = 'processing' WHERE id = ?", [order_id]);
            shipmentResult = { biteship_order_id: biteData.id, tracking_id: biteData.courier?.waybill_id };
          }
        }
      } else {
        // Demo mode tanpa real BiteShip — langsung set processing
        await execute("UPDATE orders SET status = 'processing' WHERE id = ?", [order_id]);
      }
    } catch (e: any) {
      console.error('[Shipment creation error]', e.message);
      // Non-blocking — order tetap paid
    }

    // Notif WA ke admin
    notifyPaymentSuccess(order.order_number, Number(order.total || 0), payment_method || 'unknown').catch(() => {});

    return Response.json({
      success: true,
      message: 'Pembayaran berhasil dikonfirmasi',
      data: {
        order_number: order.order_number,
        status: 'paid',
        shipment: shipmentResult,
      }
    });
  } catch (err: any) {
    console.error('[POST /api/payment/confirm]', err);
    return Response.json({ success: false, message: err.message || 'Terjadi kesalahan' }, { status: 500 });
  }
}
