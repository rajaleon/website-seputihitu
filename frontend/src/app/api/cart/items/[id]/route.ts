import { NextRequest } from 'next/server';
import { query, execute } from '@/lib/server/db';
import { requireAuth } from '@/lib/server/auth';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = requireAuth(req);
  if (user instanceof Response) return user;

  const { qty, is_selected } = await req.json();
  const carts = await query('SELECT id FROM carts WHERE user_id = ?', [user.id]);
  if (carts.length === 0) return Response.json({ success: false, message: 'Cart tidak ditemukan' }, { status: 404 });

  const items = await query('SELECT id, product_id, variant_id FROM cart_items WHERE id = ? AND cart_id = ?', [params.id, carts[0].id]);
  if (items.length === 0) return Response.json({ success: false, message: 'Item tidak ditemukan' }, { status: 404 });

  if (qty !== undefined) {
    await execute('UPDATE cart_items SET qty = ? WHERE id = ?', [qty, params.id]);
  }
  if (is_selected !== undefined) {
    await execute('UPDATE cart_items SET is_selected = ? WHERE id = ?', [is_selected, params.id]);
  }

  return Response.json({ success: true, message: 'Keranjang diperbarui' });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = requireAuth(req);
  if (user instanceof Response) return user;

  const carts = await query('SELECT id FROM carts WHERE user_id = ?', [user.id]);
  if (carts.length === 0) return Response.json({ success: false, message: 'Cart tidak ditemukan' }, { status: 404 });

  await execute('DELETE FROM cart_items WHERE id = ? AND cart_id = ?', [params.id, carts[0].id]);
  return Response.json({ success: true, message: 'Item dihapus dari keranjang' });
}
