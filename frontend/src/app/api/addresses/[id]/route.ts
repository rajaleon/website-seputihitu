import { NextRequest } from 'next/server';
import { query, execute } from '@/lib/server/db';
import { requireAuth } from '@/lib/server/auth';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = requireAuth(req);
  if (user instanceof Response) return user;

  const rows = await query('SELECT id FROM addresses WHERE id = ? AND user_id = ?', [params.id, user.id]);
  if (rows.length === 0) return Response.json({ success: false, message: 'Alamat tidak ditemukan' }, { status: 404 });

  const { recipient_name, phone, full_address, postal_code, city, province, latitude, longitude, is_primary } = await req.json();
  if (is_primary) await execute('UPDATE addresses SET is_primary = false WHERE user_id = ?', [user.id]);
  await execute(
    `UPDATE addresses SET recipient_name=?, phone=?, full_address=?, postal_code=?, city=?, province=?, latitude=?, longitude=?, is_primary=? WHERE id = ?`,
    [recipient_name, phone, full_address, postal_code, city, province, latitude || null, longitude || null, is_primary || false, params.id]
  );
  return Response.json({ success: true, message: 'Alamat diperbarui' });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = requireAuth(req);
  if (user instanceof Response) return user;
  await execute('DELETE FROM addresses WHERE id = ? AND user_id = ?', [params.id, user.id]);
  return Response.json({ success: true, message: 'Alamat dihapus' });
}
