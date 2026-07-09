import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { query, execute } from '@/lib/server/db';
import { signToken } from '@/lib/server/auth';

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, phone } = await req.json();
    if (!name || !email || !password) {
      return Response.json({ success: false, message: 'Nama, email, dan password wajib diisi' }, { status: 400 });
    }
    if (password.length < 8) {
      return Response.json({ success: false, message: 'Password minimal 8 karakter' }, { status: 400 });
    }

    const existing = await query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return Response.json({ success: false, message: 'Email sudah terdaftar' }, { status: 409 });
    }

    const hashed = await bcrypt.hash(password, 12);
    const userId = uuidv4();
    const cartId = uuidv4();

    await execute(
      'INSERT INTO users (id, name, email, password, phone) VALUES (?, ?, ?, ?, ?)',
      [userId, name, email, hashed, phone || null]
    );
    await execute('INSERT INTO carts (id, user_id) VALUES (?, ?)', [cartId, userId]);

    const user = { id: userId, name, email, role: 'customer' };
    const token = signToken(user);

    return Response.json({ success: true, message: 'Registrasi berhasil', token, user }, { status: 201 });
  } catch (err: any) {
    console.error('[register]', err);
    return Response.json({ success: false, message: 'Terjadi kesalahan' }, { status: 500 });
  }
}
