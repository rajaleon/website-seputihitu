import { NextRequest } from 'next/server';
import { query } from '@/lib/server/db';
import { requireAuth } from '@/lib/server/auth';

export async function GET(req: NextRequest, { params }: { params: { order_number: string } }) {
  const user = requireAuth(req);
  if (user instanceof Response) return user;

  const orders = await query(
    `SELECT o.*, a.recipient_name, a.phone AS addr_phone, a.full_address, a.city, a.province, a.postal_code
     FROM orders o LEFT JOIN addresses a ON a.id = o.address_id
     WHERE o.order_number = ? AND o.user_id = ?`, [params.order_number, user.id]
  );
  if (orders.length === 0) return Response.json({ success: false, message: 'Order tidak ditemukan' }, { status: 404 });

  const order = orders[0];
  const items = await query(
    `SELECT oi.*, p.name, p.thumbnail_url, pv.variant_name
     FROM order_items oi JOIN products p ON p.id = oi.product_id
     LEFT JOIN product_variants pv ON pv.id = oi.variant_id WHERE oi.order_id = ?`, [order.id]
  );
  const payments  = await query('SELECT * FROM payments WHERE order_id = ?', [order.id]);
  const shipments = await query('SELECT * FROM shipments WHERE order_id = ?', [order.id]);

  return Response.json({ success: true, data: { ...order, items, payment: payments[0] || null, shipment: shipments[0] || null } });
}
