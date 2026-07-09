import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { requireAuth } from '@/lib/server/auth';
import { query, execute } from '@/lib/server/db';

export async function POST(req: NextRequest) {
  const user = requireAuth(req);
  if (user instanceof Response) return user;

  const { old_password, new_password } = await req.json();
  if (!old_password || !new_password || new_password.length < 8) {
    return Response.json({ success: false, message: 'Password lama dan baru (min 8 karakter) wajib diisi' }, { status: 400 });
  }

  const rows = await query('SELECT password FROM users WHERE id = ?', [user.id]);
  const valid = await bcrypt.compare(old_password, rows[0].password);
  if (!valid) return Response.json({ success: false, message: 'Password lama salah' }, { status: 401 });

  const hashed = await bcrypt.hash(new_password, 12);
  await execute('UPDATE users SET password = ? WHERE id = ?', [hashed, user.id]);
  return Response.json({ success: true, message: 'Password berhasil diubah' });
}
