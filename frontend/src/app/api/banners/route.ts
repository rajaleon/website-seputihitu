import { NextRequest } from 'next/server';
import { query, execute } from '@/lib/server/db';
import { requireAdmin } from '@/lib/server/auth';

export async function GET() {
  const rows = await query('SELECT * FROM banners WHERE is_active = true ORDER BY sort_order ASC');
  return Response.json({ success: true, data: rows });
}

export async function POST(req: NextRequest) {
  const user = requireAdmin(req);
  if (user instanceof Response) return user;

  const { title, image_url, link_url, sort_order } = await req.json();
  if (!title || !image_url) {
    return Response.json({ success: false, message: 'Judul dan gambar wajib diisi' }, { status: 400 });
  }
  await execute(
    'INSERT INTO banners (title, image_url, link_url, sort_order) VALUES (?,?,?,?)',
    [title, image_url, link_url || null, sort_order || 0]
  );
  return Response.json({ success: true, message: 'Banner berhasil dibuat' }, { status: 201 });
}
