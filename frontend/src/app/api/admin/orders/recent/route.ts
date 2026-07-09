import { NextRequest } from 'next/server';
import { query } from '@/lib/server/db';
import { requireAdmin } from '@/lib/server/auth';

export async function GET(req: NextRequest) {
  const user = requireAdmin(req);
  if (user instanceof Response) return user;

  const rows = await query(
    `SELECT o.id, o.order_number, o.total, o.status, o.created_at, u.name AS user_name
     FROM orders o JOIN users u ON u.id = o.user_id
     ORDER BY o.created_at DESC LIMIT 10`
  );
  return Response.json({ success: true, data: rows });
}
