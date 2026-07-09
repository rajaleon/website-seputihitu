import { NextRequest } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { query, execute } from '@/lib/server/db';
import { requireAuth } from '@/lib/server/auth';

export async function GET(req: NextRequest) {
  const user = requireAuth(req);
  if (user instanceof Response) return user;

  const rows = await query(
    'SELECT * FROM addresses WHERE user_id = ? ORDER BY is_primary DESC, created_at DESC', [user.id]
  );
  return Response.json({ success: true, data: rows });
}

export async function POST(req: NextRequest) {
  const user = requireAuth(req);
  if (user instanceof Response) return user;

  const { recipient_name, phone, full_address, postal_code, city, province, latitude, longitude, is_primary } = await req.json();
  if (!recipient_name || !phone || !full_address || !postal_code || !city || !province) {
    return Response.json({ success: false, message: 'Semua field alamat wajib diisi' }, { status: 400 });
  }

  const id = uuidv4();
  if (is_primary) {
    await execute('UPDATE addresses SET is_primary = false WHERE user_id = ?', [user.id]);
  }
  const countRes = await query('SELECT COUNT(*) as cnt FROM addresses WHERE user_id = ?', [user.id]);
  const setPrimary = is_primary || parseInt(countRes[0]?.cnt) === 0;

  await execute(
    `INSERT INTO addresses (id, user_id, recipient_name, phone, full_address, postal_code, city, province, latitude, longitude, is_primary)
     VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
    [id, user.id, recipient_name, phone, full_address, postal_code, city, province,
     latitude || null, longitude || null, setPrimary]
  );

  return Response.json({ success: true, message: 'Alamat berhasil ditambahkan', id }, { status: 201 });
}
