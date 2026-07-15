import { NextRequest } from 'next/server';
import { execute } from '@/lib/server/db';
import { requireAdmin } from '@/lib/server/auth';

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = requireAdmin(req);
  if (user instanceof Response) return user;

  await execute('DELETE FROM banners WHERE id = ?', [params.id]);
  return Response.json({ success: true, message: 'Banner dihapus' });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = requireAdmin(req);
  if (user instanceof Response) return user;

  const { title, image_url, link_url, sort_order } = await req.json();
  await execute(
    'UPDATE banners SET title = ?, image_url = ?, link_url = ?, sort_order = ? WHERE id = ?',
    [title, image_url, link_url || null, sort_order || 0, params.id]
  );
  return Response.json({ success: true, message: 'Banner berhasil diperbarui' });
}
