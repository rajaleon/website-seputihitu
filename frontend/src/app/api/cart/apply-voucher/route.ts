import { NextRequest } from 'next/server';
import { query } from '@/lib/server/db';
import { requireAuth } from '@/lib/server/auth';

export async function POST(req: NextRequest) {
  const user = requireAuth(req);
  if (user instanceof Response) return user;

  const { code } = await req.json();
  if (!code) return Response.json({ success: false, message: 'Kode voucher wajib diisi' }, { status: 400 });

  const vouchers = await query(
    `SELECT * FROM vouchers WHERE code = ? AND is_active = true AND expired_at > NOW()
     AND (quota IS NULL OR used_count < quota)`, [code]
  );
  if (vouchers.length === 0) {
    return Response.json({ success: false, message: 'Voucher tidak valid atau sudah kadaluarsa' }, { status: 404 });
  }

  const voucher = vouchers[0];
  const carts = await query('SELECT id FROM carts WHERE user_id = ?', [user.id]);
  const items = await query(
    'SELECT price_snapshot, qty FROM cart_items WHERE cart_id = ? AND is_selected = true',
    [carts[0]?.id]
  );
  const subtotal = items.reduce((s: number, i: any) => s + Number(i.price_snapshot) * i.qty, 0);

  if (subtotal < Number(voucher.min_purchase)) {
    return Response.json({ success: false, message: `Minimum pembelian Rp${Number(voucher.min_purchase).toLocaleString('id-ID')}` }, { status: 400 });
  }

  let discount = voucher.type === 'percent'
    ? (subtotal * Number(voucher.value)) / 100
    : Number(voucher.value);
  if (voucher.max_discount && discount > Number(voucher.max_discount)) {
    discount = Number(voucher.max_discount);
  }

  return Response.json({
    success: true,
    data: { voucher_id: voucher.id, code: voucher.code, type: voucher.type, discount: Math.round(discount) },
  });
}
