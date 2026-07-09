import { NextRequest } from 'next/server';
import { query } from '@/lib/server/db';
import { requireAdmin } from '@/lib/server/auth';

export async function GET(req: NextRequest) {
  const user = requireAdmin(req);
  if (user instanceof Response) return user;

  const sp = req.nextUrl.searchParams;
  const page   = Math.max(1, parseInt(sp.get('page') || '1'));
  const limit  = 20;
  const offset = (page - 1) * limit;
  const search = sp.get('search') || '';

  let where = '';
  const params: any[] = [];
  if (search) {
    where = 'WHERE name ILIKE $1 OR email ILIKE $2';
    params.push(`%${search}%`, `%${search}%`);
  }

  const countRes = await query(`SELECT COUNT(*) as total FROM users ${where}`, params);
  const total = parseInt(countRes[0]?.total || '0');

  const rows = await query(
    `SELECT id, name, email, phone, role, is_active, created_at FROM users
     ${where} ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, offset]
  );

  return Response.json({ success: true, data: rows, pagination: { page, limit, total, total_pages: Math.ceil(total / limit) } });
}
