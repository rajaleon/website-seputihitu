import { NextRequest } from 'next/server';
import { query } from '@/lib/server/db';
import { requireAdmin } from '@/lib/server/auth';

export async function GET(req: NextRequest) {
  const user = requireAdmin(req);
  if (user instanceof Response) return user;

  const [products] = await query('SELECT COUNT(*) as total FROM products');
  const [orders]   = await query('SELECT COUNT(*) as total FROM orders');
  const [users]    = await query("SELECT COUNT(*) as total FROM users WHERE role = 'customer'");
  const [revenue]  = await query(
    `SELECT COALESCE(SUM(total), 0) as total FROM orders
     WHERE status IN ('paid','processing','shipped','delivered') AND DATE(created_at) = CURRENT_DATE`
  );

  return Response.json({
    success: true,
    data: {
      total_products: parseInt(products?.total || '0'),
      total_orders:   parseInt(orders?.total || '0'),
      total_users:    parseInt(users?.total || '0'),
      revenue_today:  Number(revenue?.total || 0),
    },
  });
}
