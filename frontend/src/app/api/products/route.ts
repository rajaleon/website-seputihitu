import { NextRequest } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { query, execute } from '@/lib/server/db';
import { requireAdmin } from '@/lib/server/auth';

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const category   = sp.get('category') || '';
  const min_price  = sp.get('min_price') || '';
  const max_price  = sp.get('max_price') || '';
  const sort       = sp.get('sort') || 'created_at_desc';
  const page       = Math.max(1, parseInt(sp.get('page') || '1'));
  const limit      = Math.min(100, Math.max(1, parseInt(sp.get('limit') || '20')));
  const search     = sp.get('search') || '';
  const featured   = sp.get('featured');
  const flash_sale = sp.get('flash_sale');

  const conditions: string[] = ['p.is_active = true'];
  const params: any[] = [];
  let paramIdx = 0;

  if (category)  { paramIdx++; conditions.push(`c.slug = $${paramIdx}`); params.push(category); }
  if (min_price) { paramIdx++; conditions.push(`p.price >= $${paramIdx}`); params.push(Number(min_price)); }
  if (max_price) { paramIdx++; conditions.push(`p.price <= $${paramIdx}`); params.push(Number(max_price)); }
  if (featured === 'true')    conditions.push('p.is_featured = true');
  if (flash_sale === 'true')  conditions.push("p.is_flash_sale = true AND p.flash_sale_end > NOW()");
  if (search) {
    paramIdx++; const s = paramIdx;
    paramIdx++; const s2 = paramIdx;
    conditions.push(`(p.name ILIKE $${s} OR p.description ILIKE $${s2})`);
    params.push(`%${search}%`, `%${search}%`);
  }

  const where = 'WHERE ' + conditions.join(' AND ');
  const sortMap: Record<string, string> = {
    price_asc: 'p.price ASC', price_desc: 'p.price DESC',
    rating_desc: 'p.rating_avg DESC', sold_desc: 'p.total_sold DESC',
    created_at_desc: 'p.created_at DESC',
  };
  const orderBy = sortMap[sort] || 'p.created_at DESC';
  const offset = (page - 1) * limit;

  const baseFrom = `FROM products p LEFT JOIN categories c ON c.id = p.category_id ${where}`;

  paramIdx++;
  const countRes = await query(`SELECT COUNT(*) as total ${baseFrom}`, params);
  const total = parseInt(countRes[0]?.total || '0');

  const dataParams = [...params, limit, offset];
  const rows = await query(
    `SELECT p.id, p.sku, p.name, p.slug, p.price, p.discount_price,
            p.stock, p.thumbnail_url, p.rating_avg, p.total_sold,
            p.is_flash_sale, p.flash_sale_end,
            c.name AS category_name, c.slug AS category_slug
     ${baseFrom}
     ORDER BY ${orderBy}
     LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    dataParams
  );

  return Response.json({
    success: true, data: rows,
    pagination: { page, limit, total, total_pages: Math.ceil(total / limit) },
  });
}

export async function POST(req: NextRequest) {
  const user = requireAdmin(req);
  if (user instanceof Response) return user;

  const body = await req.json();
  const { sku, name, slug, description, specification, price, discount_price, stock,
    category_id, thumbnail_url, weight_gram, length_cm, width_cm, height_cm,
    is_featured, is_flash_sale, flash_sale_end } = body;

  if (!sku || !name || !slug || !price) {
    return Response.json({ success: false, message: 'SKU, nama, slug, dan harga wajib diisi' }, { status: 400 });
  }

  const id = uuidv4();
  await execute(
    `INSERT INTO products (id, sku, name, slug, description, specification, price, discount_price, stock,
      category_id, thumbnail_url, weight_gram, length_cm, width_cm, height_cm, is_featured, is_flash_sale, flash_sale_end)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [id, sku, name, slug, description || null, specification || null, price, discount_price || null,
     stock || 0, category_id || null, thumbnail_url || null, weight_gram || 0,
     length_cm || null, width_cm || null, height_cm || null,
     is_featured ? true : false, is_flash_sale ? true : false, flash_sale_end || null]
  );

  return Response.json({ success: true, message: 'Produk berhasil dibuat', id }, { status: 201 });
}
