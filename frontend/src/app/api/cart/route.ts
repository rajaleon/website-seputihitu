import { NextRequest } from 'next/server';
import { query } from '@/lib/server/db';
import { requireAuth } from '@/lib/server/auth';

export async function GET(req: NextRequest) {
  const user = requireAuth(req);
  if (user instanceof Response) return user;

  // Get or create cart
  let carts = await query('SELECT id FROM carts WHERE user_id = ?', [user.id]);
  if (carts.length === 0) {
    const { v4: uuidv4 } = await import('uuid');
    const cartId = uuidv4();
    await (await import('@/lib/server/db')).execute('INSERT INTO carts (id, user_id) VALUES (?,?)', [cartId, user.id]);
    carts = [{ id: cartId }];
  }
  const cartId = carts[0].id;

  const items = await query(
    `SELECT ci.id, ci.qty, ci.price_snapshot, ci.is_selected,
            p.id AS product_id, p.name, p.slug, p.thumbnail_url, p.stock,
            pv.id AS variant_id, pv.variant_name, pv.stock AS variant_stock
     FROM cart_items ci
     JOIN products p ON p.id = ci.product_id
     LEFT JOIN product_variants pv ON pv.id = ci.variant_id
     WHERE ci.cart_id = ?`, [cartId]
  );

  const subtotal = items
    .filter((i: any) => i.is_selected)
    .reduce((sum: number, i: any) => sum + Number(i.price_snapshot) * i.qty, 0);

  return Response.json({ success: true, data: { cart_id: cartId, items, subtotal } });
}
