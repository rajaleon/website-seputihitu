import { query } from '@/lib/server/db';

export async function GET() {
  const rows = await query(
    `SELECT id, name, slug, price, discount_price, thumbnail_url, rating_avg, flash_sale_end
     FROM products WHERE is_active = true AND is_flash_sale = true AND flash_sale_end > NOW()
     ORDER BY flash_sale_end ASC LIMIT 12`
  );
  return Response.json({ success: true, data: rows });
}
