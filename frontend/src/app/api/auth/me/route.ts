import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/server/auth';
import { query, execute } from '@/lib/server/db';

export async function GET(req: NextRequest) {
  const user = requireAuth(req);
  if (user instanceof Response) return user;

  const rows = await query(
    'SELECT id, name, email, phone, avatar_url, role, created_at FROM users WHERE id = ?',
    [user.id]
  );
  if (rows.length === 0) return Response.json({ success: false, message: 'User tidak ditemukan' }, { status: 404 });
  return Response.json({ success: true, user: rows[0] });
}

export async function PATCH(req: NextRequest) {
  const user = requireAuth(req);
  if (user instanceof Response) return user;

  const { name, phone } = await req.json();
  await execute('UPDATE users SET name = ?, phone = ? WHERE id = ?', [name, phone, user.id]);
  return Response.json({ success: true, message: 'Profil diperbarui' });
}
