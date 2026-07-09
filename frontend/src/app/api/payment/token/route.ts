import { NextRequest } from 'next/server';
import { query, execute } from '@/lib/server/db';
import { requireAuth } from '@/lib/server/auth';

export async function POST(req: NextRequest) {
  const user = requireAuth(req);
  if (user instanceof Response) return user;

  const { order_id } = await req.json();
  if (!order_id) return Response.json({ success: false, message: 'order_id wajib' }, { status: 400 });

  const orders = await query(
    `SELECT o.*, u.name AS user_name, u.email AS user_email, u.phone AS user_phone
     FROM orders o JOIN users u ON u.id = o.user_id
     WHERE o.id = ? AND o.user_id = ?`, [order_id, user.id]
  );
  if (orders.length === 0) return Response.json({ success: false, message: 'Order tidak ditemukan' }, { status: 404 });
  const order = orders[0];

  if (order.status !== 'pending_payment') {
    return Response.json({ success: false, message: 'Order tidak dalam status pending' }, { status: 400 });
  }

  if (order.snap_token) {
    return Response.json({ success: true, snap_token: order.snap_token, client_key: process.env.MIDTRANS_CLIENT_KEY });
  }

  const SERVER_KEY = process.env.MIDTRANS_SERVER_KEY || '';
  const CLIENT_KEY = process.env.MIDTRANS_CLIENT_KEY || '';
  const isProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true';

  if (SERVER_KEY.includes('demo')) {
    // Mock: return fake snap token for demo
    const fakeToken = `demo-snap-${order.order_number}`;
    await execute('UPDATE orders SET snap_token = ? WHERE id = ?', [fakeToken, order_id]);
    return Response.json({ success: true, snap_token: fakeToken, client_key: CLIENT_KEY, demo: true });
  }

  // Real Midtrans Snap
  const snapUrl = isProduction
    ? 'https://app.midtrans.com/snap/v1/transactions'
    : 'https://app.sandbox.midtrans.com/snap/v1/transactions';

  const items = await query(
    'SELECT oi.qty, oi.price, p.name FROM order_items oi JOIN products p ON p.id = oi.product_id WHERE oi.order_id = ?',
    [order_id]
  );

  const itemDetails = items.map((i: any) => ({
    id: i.name.toLowerCase().replace(/\s/g, '-').substring(0, 50),
    price: Math.round(Number(i.price)), quantity: i.qty, name: i.name.substring(0, 50),
  }));
  if (order.shipping_cost > 0) {
    itemDetails.push({ id: 'shipping', price: Math.round(order.shipping_cost), quantity: 1, name: 'Ongkos Kirim' });
  }
  if (order.discount > 0) {
    itemDetails.push({ id: 'discount', price: -Math.round(order.discount), quantity: 1, name: 'Diskon' });
  }

  const parameter = {
    transaction_details: { order_id: order.order_number, gross_amount: Math.round(Number(order.total)) },
    customer_details: { first_name: order.user_name, email: order.user_email, phone: order.user_phone || '' },
    item_details: itemDetails,
    expiry: { duration: 24, unit: 'hours' },
  };

  try {
    const auth = Buffer.from(SERVER_KEY + ':').toString('base64');
    const res = await fetch(snapUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Basic ${auth}` },
      body: JSON.stringify(parameter),
    });
    const data = await res.json();
    if (data.token) {
      await execute('UPDATE orders SET snap_token = ? WHERE id = ?', [data.token, order_id]);
      return Response.json({ success: true, snap_token: data.token, client_key: CLIENT_KEY });
    }
    return Response.json({ success: false, message: 'Gagal generate token', detail: data }, { status: 502 });
  } catch {
    return Response.json({ success: false, message: 'Gagal menghubungi Midtrans' }, { status: 502 });
  }
}
