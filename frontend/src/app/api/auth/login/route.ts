import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/server/db';
import { signToken } from '@/lib/server/auth';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return Response.json({ success: false, message: 'Email dan password wajib diisi' }, { status: 400 });
    }

    const rows = await query('SELECT * FROM users WHERE email = ? AND is_active = true', [email]);
    if (rows.length === 0) {
      return Response.json({ success: false, message: 'Email atau password salah' }, { status: 401 });
    }

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return Response.json({ success: false, message: 'Email atau password salah' }, { status: 401 });
    }

    const token = signToken(user);
    const { password: _, ...safeUser } = user;
    return Response.json({ success: true, token, user: safeUser });
  } catch (err: any) {
    console.error('[login]', err);
    return Response.json({ success: false, message: 'Terjadi kesalahan' }, { status: 500 });
  }
}
