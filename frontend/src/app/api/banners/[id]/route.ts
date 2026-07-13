import { NextRequest } from 'next/server';
import { execute } from '@/lib/server/db';
import { requireAdmin } from '@/lib/server/auth';

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = requireAdmin(req);
  if (user instanceof Response) return user;

  await execute('DELETE FROM banners WHERE id = ?', [params.id]);
  return Response.json({ success: true, message: 'Banner dihapus' });
}
