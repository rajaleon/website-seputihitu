import { NextRequest } from 'next/server';
import { query, execute } from '@/lib/server/db';
import { requireAdmin } from '@/lib/server/auth';

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const { slug } = params;

  const rows = await query(
    `SELECT p.*, c.name AS category_name, c.slug AS category_slug
     FROM products p LEFT JOIN categories c ON c.id = p.category_id
     WHERE p.slug = ? AND p.is_active = true`, [slug]
  );
  if (rows.length === 0) {
    return Response.json({ success: false, message: 'Produk tidak ditemukan' }, { status: 404 });
  }

  const product = rows[0];
  const images   = await query('SELECT * FROM product_images WHERE product_id = ? ORDER BY sort_order', [product.id]);
  const variants = await query('SELECT * FROM product_variants WHERE product_id = ?', [product.id]);
  const related  = await query(
    `SELECT id, name, slug, price, discount_price, thumbnail_url, rating_avg
     FROM products WHERE category_id = ? AND id != ? AND is_active = true LIMIT 8`,
    [product.category_id, product.id]
  );

  return Response.json({ success: true, data: { ...product, images, variants, related } });
}

export async function PATCH(req: NextRequest, { params }: { params: { slug: string } }) {
  // slug here acts as ID for admin edit
  const user = requireAdmin(req);
  if (user instanceof Response) return user;

  const id = params.slug; // In edit context, this is product ID
  const body = await req.json();
  const fields = ['name','slug','description','specification','price','discount_price',
    'stock','total_sold','category_id','thumbnail_url','weight_gram','length_cm','width_cm','height_cm',
    'is_featured','is_flash_sale','flash_sale_end','is_active'];

  const updates: string[] = [];
  const values: any[] = [];
  let idx = 0;
  fields.forEach(f => {
    if (body[f] !== undefined) {
      idx++;
      updates.push(`${f} = $${idx}`);
      values.push(body[f]);
    }
  });
  if (updates.length === 0) {
    return Response.json({ success: false, message: 'Tidak ada data yang diubah' }, { status: 400 });
  }
  idx++;
  values.push(id);

  const pg = (await import('@/lib/server/db')).getPool();
  await pg.query(`UPDATE products SET ${updates.join(', ')} WHERE id = $${idx}`, values);

  return Response.json({ success: true, message: 'Produk berhasil diperbarui' });
}
