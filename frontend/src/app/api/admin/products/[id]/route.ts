import { NextRequest } from 'next/server';
import { query } from '@/lib/server/db';
import { requireAdmin } from '@/lib/server/auth';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = requireAdmin(req);
  if (user instanceof Response) return user;

  const rows = await query(
    `SELECT p.*, c.name AS category_name FROM products p
     LEFT JOIN categories c ON c.id = p.category_id WHERE p.id = ?`, [params.id]
  );
  if (rows.length === 0) return Response.json({ success: false, message: 'Produk tidak ditemukan' }, { status: 404 });

  const variants = await query('SELECT * FROM product_variants WHERE product_id = ?', [params.id]);
  return Response.json({ success: true, data: { ...rows[0], variants } });
}
