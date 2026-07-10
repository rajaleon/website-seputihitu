import { NextRequest } from 'next/server';
import { query, execute } from '@/lib/server/db';
import { requireAuth } from '@/lib/server/auth';

export async function POST(req: NextRequest) {
  try {
    const user = requireAuth(req);
    if (user instanceof Response) return user;

    const { order_id } = await req.json();
    if (!order_id) return Response.json({ success: false, message: 'order_id wajib' }, { status: 400 });

    // Ambil data order + alamat
    const orders = await query(
      `SELECT o.*, a.recipient_name, a.phone AS addr_phone, a.full_address, 
              a.city, a.province, a.postal_code
       FROM orders o JOIN addresses a ON a.id = o.address_id 
       WHERE o.id = ?`, [order_id]
    );
    if (orders.length === 0) return Response.json({ success: false, message: 'Order tidak ditemukan' }, { status: 404 });
    const order = orders[0];

    // Ambil items untuk detail paket
    const items = await query(
      `SELECT oi.qty, oi.price, p.name, p.weight_gram, p.length_cm, p.width_cm, p.height_cm
       FROM order_items oi JOIN products p ON p.id = oi.product_id WHERE oi.order_id = ?`, [order_id]
    );

    const BITESHIP_API_KEY = process.env.BITESHIP_API_KEY;
    if (!BITESHIP_API_KEY || BITESHIP_API_KEY.includes('demo')) {
      return Response.json({ success: false, message: 'BiteShip API key belum dikonfigurasi' }, { status: 400 });
    }

    // Parse courier service (format: "jne-reg")
    const courierParts = (order.courier_service || 'jne-reg').split('-');
    const courierCompany = courierParts[0] || 'jne';
    const courierType = courierParts.slice(1).join('-') || 'reg';

    const payload = {
      shipper_contact_name: 'Seputihitu Store',
      shipper_contact_phone: process.env.STORE_PHONE || '081234567890',
      shipper_contact_email: process.env.STORE_EMAIL || 'store@seputihitu.com',
      origin_contact_name: 'Seputihitu Store',
      origin_contact_phone: process.env.STORE_PHONE || '081234567890',
      origin_address: process.env.STORE_ADDRESS || 'Jl. Contoh No. 1',
      origin_postal_code: parseInt(process.env.BITESHIP_ORIGIN_POSTAL_CODE || '10110'),
      destination_contact_name: order.recipient_name,
      destination_contact_phone: order.addr_phone,
      destination_address: order.full_address,
      destination_postal_code: parseInt(order.postal_code),
      courier_company: courierCompany,
      courier_type: courierType,
      delivery_type: 'now',
      order_note: order.notes || '',
      items: items.map((i: any) => ({
        name: i.name,
        value: Number(i.price),
        weight: i.weight_gram || 500,
        quantity: i.qty,
        length: i.length_cm || 10,
        width: i.width_cm || 10,
        height: i.height_cm || 10,
      })),
    };

    // Panggil BiteShip Create Order API
    const res = await fetch('https://api.biteship.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${BITESHIP_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error('[BiteShip Create Order Error]', data);
      return Response.json({ 
        success: false, 
        message: 'Gagal membuat pengiriman di BiteShip', 
        detail: data 
      }, { status: 502 });
    }

    // Simpan shipment ke database
    const shipmentId = crypto.randomUUID();
    await execute(
      `INSERT INTO shipments (id, order_id, biteship_order_id, courier_name, courier_service, tracking_id, status, waybill_url)
       VALUES (?,?,?,?,?,?,?,?)
       ON CONFLICT (order_id) DO UPDATE SET 
         biteship_order_id = EXCLUDED.biteship_order_id,
         tracking_id = EXCLUDED.tracking_id,
         status = EXCLUDED.status`,
      [shipmentId, order_id, data.id, data.courier?.company || courierCompany, 
       data.courier?.type || courierType, data.courier?.waybill_id || null, 
       data.status || 'confirmed', data.courier?.link || null]
    );

    // Update order status
    await execute("UPDATE orders SET status = 'processing' WHERE id = ?", [order_id]);

    return Response.json({ 
      success: true, 
      message: 'Pengiriman berhasil dibuat', 
      data: { 
        biteship_order_id: data.id, 
        tracking_id: data.courier?.waybill_id,
        status: data.status 
      } 
    });
  } catch (err: any) {
    console.error('[POST /api/shipping/create]', err);
    return Response.json({ success: false, message: err.message || 'Terjadi kesalahan' }, { status: 500 });
  }
}
