import { query } from '@/lib/server/db';

export async function GET() {
  const rows = await query('SELECT * FROM categories WHERE is_active = true ORDER BY name ASC');
  return Response.json({ success: true, data: rows });
}
