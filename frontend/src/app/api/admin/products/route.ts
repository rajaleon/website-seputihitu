import { NextRequest } from 'next/server';
import { query } from '@/lib/server/db';
import { requireAdmin } from '@/lib/server/auth';

export async function GET(req: NextRequest) {
  const user = requireAdmin(req);
  if (user instanceof Response) return user;

  const sp = req.nextUrl.searchParams;
  const search = sp.get('search') || '';
  const sort   = sp.get('sort') || 'created_at_desc';
  const page   = Math.max(1, parseInt(sp.get('page') || '1'));
  const limit  = Math.min(100, parseInt(sp.get('limit') || '20'));
  const offset = (page - 1) * limit;

  const sortMap: Record<string, string> = {
    price_asc: 'p.price ASC', price_desc: 'p.price DESC',
    sold_desc: 'p.total_sold DESC', created_at_desc: 'p.created_at DESC',
  };
  const orderBy = sortMap[sort] || 'p.created_at DESC';

  let where = '';
  const params: any[] = [];
  if (search) {
    where = 'WHERE p.name ILIKE $1 OR p.sku ILIKE $2';
    params.push(`%${search}%`, `%${search}%`);
  }

  const countRes = await query(`SELECT COUNT(*) as total FROM products p ${where}`, params);
  const total = parseInt(countRes[0]?.total || '0');

  const rows = await query(
    `SELECT p.id, p.sku, p.name, p.slug, p.price, p.discount_price, p.stock,
            p.thumbnail_url, p.is_active, p.is_featured, p.is_flash_sale,
            p.total_sold, p.rating_avg, p.created_at, c.name AS category_name
     FROM products p LEFT JOIN categories c ON c.id = p.category_id
     ${where} ORDER BY ${orderBy} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, offset]
  );

  return Response.json({ success: true, data: rows, pagination: { page, limit, total, total_pages: Math.ceil(total / limit) } });
}
