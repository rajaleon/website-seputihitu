import { NextRequest } from 'next/server';
import { query, transaction } from '@/lib/server/db';
import { requireAuth } from '@/lib/server/auth';
import { notifyNewOrder } from '@/lib/server/whatsapp';

function generateOrderNumber() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(Math.random() * 900000) + 100000;
  return `SPH-${date}-${rand}`;
}

export async function GET(req: NextRequest) {
  const user = requireAuth(req);
  if (user instanceof Response) return user;

  const sp = req.nextUrl.searchParams;
  const status = sp.get('status') || '';
  const page   = Math.max(1, parseInt(sp.get('page') || '1'));
  const limit  = 10;
  const offset = (page - 1) * limit;

  let where = 'WHERE o.user_id = $1';
  const params: any[] = [user.id];
  if (status) { where += ' AND o.status = $2'; params.push(status); }

  const countRes = await query(`SELECT COUNT(*) as total FROM orders o ${where}`, params);
  const total = parseInt(countRes[0]?.total || '0');

  const rows = await query(
    `SELECT o.id, o.order_number, o.total, o.status, o.created_at, COUNT(oi.id) AS item_count
     FROM orders o LEFT JOIN order_items oi ON oi.order_id = o.id
     ${where} GROUP BY o.id ORDER BY o.created_at DESC
     LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, offset]
  );

  return Response.json({ success: true, data: rows, pagination: { page, limit, total, total_pages: Math.ceil(total / limit) } });
}

export async function POST(req: NextRequest) {
  const user = requireAuth(req);
  if (user instanceof Response) return user;

  const { address_id, courier_service, shipping_cost, voucher_id, notes, idempotency_key } = await req.json();
  if (!address_id) return Response.json({ success: false, message: 'Pilih alamat pengiriman' }, { status: 400 });

  // Idempotency
  if (idempotency_key) {
    const existing = await query('SELECT id, order_number FROM orders WHERE idempotency_key = ?', [idempotency_key]);
    if (existing.length > 0) {
      return Response.json({ success: true, message: 'Order sudah dibuat', order_number: existing[0].order_number, order_id: existing[0].id });
    }
  }

  const carts = await query('SELECT id FROM carts WHERE user_id = ?', [user.id]);
  if (carts.length === 0) return Response.json({ success: false, message: 'Keranjang kosong' }, { status: 400 });

  const items = await query(
    `SELECT ci.*, p.stock, p.name, pv.stock AS variant_stock
     FROM cart_items ci JOIN products p ON p.id = ci.product_id
     LEFT JOIN product_variants pv ON pv.id = ci.variant_id
     WHERE ci.cart_id = ? AND ci.is_selected = true`, [carts[0].id]
  );
  if (items.length === 0) return Response.json({ success: false, message: 'Tidak ada item yang dipilih' }, { status: 400 });

  const subtotal = items.reduce((s: number, i: any) => s + Number(i.price_snapshot) * i.qty, 0);
  let discount = 0;
  if (voucher_id) {
    const vouchers = await query(
      `SELECT * FROM vouchers WHERE id = ? AND is_active = true AND expired_at > NOW() AND (quota IS NULL OR used_count < quota)`,
      [voucher_id]
    );
    if (vouchers.length > 0) {
      const v = vouchers[0];
      if (subtotal >= Number(v.min_purchase)) {
        discount = v.type === 'percent'
          ? Math.min((subtotal * Number(v.value)) / 100, v.max_discount || Infinity)
          : Number(v.value);
      }
    }
  }

  const total = subtotal - discount + Number(shipping_cost || 0);
  const orderId     = crypto.randomUUID();
  const orderNumber = generateOrderNumber();
  const paymentId   = crypto.randomUUID();
  const expiredAt   = new Date(Date.now() + 24 * 3600 * 1000).toISOString();

  await transaction(async (tx) => {
    await tx.execute(
      `INSERT INTO orders (id, order_number, user_id, address_id, voucher_id, courier_service, shipping_cost, subtotal, discount, total, notes, idempotency_key)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
      [orderId, orderNumber, user.id, address_id, voucher_id || null, courier_service || null,
       Number(shipping_cost || 0), subtotal, discount, total, notes || null, idempotency_key || null]
    );

    for (const item of items) {
      await tx.execute(
        'INSERT INTO order_items (id, order_id, product_id, variant_id, qty, price) VALUES (?,?,?,?,?,?)',
        [crypto.randomUUID(), orderId, item.product_id, item.variant_id || null, item.qty, item.price_snapshot]
      );
      if (item.variant_id) {
        await tx.execute('UPDATE product_variants SET stock = stock - ? WHERE id = ?', [item.qty, item.variant_id]);
      } else {
        await tx.execute('UPDATE products SET stock = stock - ? WHERE id = ?', [item.qty, item.product_id]);
      }
      await tx.execute('UPDATE products SET total_sold = total_sold + ? WHERE id = ?', [item.qty, item.product_id]);
    }

    await tx.execute(
      'INSERT INTO payments (id, order_id, gross_amount, expired_at) VALUES (?,?,?,?)',
      [paymentId, orderId, total, expiredAt]
    );

    if (voucher_id) {
      await tx.execute('UPDATE vouchers SET used_count = used_count + 1 WHERE id = ?', [voucher_id]);
    }

    await tx.execute('DELETE FROM cart_items WHERE cart_id = ? AND is_selected = true', [carts[0].id]);
  });

  // Kirim notifikasi WhatsApp ke admin (non-blocking)
  const userInfo = await query('SELECT name, phone FROM users WHERE id = ?', [user.id]);
  const addrInfo = await query('SELECT city FROM addresses WHERE id = ?', [address_id]);
  notifyNewOrder({
    order_number: orderNumber,
    customer_name: userInfo[0]?.name || user.name,
    customer_phone: userInfo[0]?.phone || '-',
    total,
    items_count: items.length,
    courier: courier_service || '-',
    address_city: addrInfo[0]?.city || '-',
  }).catch(() => {});

  return Response.json({ success: true, message: 'Order berhasil dibuat', order_id: orderId, order_number: orderNumber }, { status: 201 });
}
