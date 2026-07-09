import { query } from '@/lib/server/db';

export async function GET() {
  const rows = await query(
    `SELECT id, name, slug, price, discount_price, thumbnail_url, rating_avg, total_sold
     FROM products WHERE is_active = true AND is_featured = true ORDER BY total_sold DESC LIMIT 12`
  );
  return Response.json({ success: true, data: rows });
}
