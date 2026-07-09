import { NextRequest } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { execute, query } from '@/lib/server/db';
import { requireAuth } from '@/lib/server/auth';

export async function POST(req: NextRequest) {
  const user = requireAuth(req);
  if (user instanceof Response) return user;

  const { product_id, rating, comment } = await req.json();
  if (!product_id || !rating || rating < 1 || rating > 5) {
    return Response.json({ success: false, message: 'product_id dan rating (1-5) wajib' }, { status: 400 });
  }

  try {
    await execute(
      'INSERT INTO product_reviews (id, product_id, user_id, rating, comment) VALUES (?,?,?,?,?)',
      [uuidv4(), product_id, user.id, rating, comment || null]
    );
    // Update avg
    const avg = await query('SELECT AVG(rating) as avg FROM product_reviews WHERE product_id = ?', [product_id]);
    await execute('UPDATE products SET rating_avg = ? WHERE id = ?', [avg[0]?.avg || 0, product_id]);
    return Response.json({ success: true, message: 'Ulasan berhasil ditambahkan' }, { status: 201 });
  } catch (err: any) {
    if (err.code === '23505') { // unique violation
      return Response.json({ success: false, message: 'Anda sudah memberikan ulasan' }, { status: 409 });
    }
    throw err;
  }
}
