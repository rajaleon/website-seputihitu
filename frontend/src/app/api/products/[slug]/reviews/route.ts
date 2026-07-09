import { NextRequest } from 'next/server';
import { query } from '@/lib/server/db';

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  // slug here is actually product ID when called from PDP
  const productId = params.slug;
  const page   = Math.max(1, parseInt(req.nextUrl.searchParams.get('page') || '1'));
  const limit  = 10;
  const offset = (page - 1) * limit;

  const countRes = await query('SELECT COUNT(*) as total FROM product_reviews WHERE product_id = ?', [productId]);
  const total = parseInt(countRes[0]?.total || '0');

  const rows = await query(
    `SELECT r.*, u.name AS user_name, u.avatar_url
     FROM product_reviews r JOIN users u ON u.id = r.user_id
     WHERE r.product_id = ? ORDER BY r.created_at DESC LIMIT ? OFFSET ?`,
    [productId, limit, offset]
  );

  return Response.json({ success: true, data: rows, pagination: { page, limit, total, total_pages: Math.ceil(total / limit) } });
}
