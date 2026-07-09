import { NextRequest } from 'next/server';
import { execute } from '@/lib/server/db';
import { requireAdmin } from '@/lib/server/auth';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = requireAdmin(req);
  if (user instanceof Response) return user;

  const { status } = await req.json();
  const valid = ['pending_payment','paid','processing','shipped','delivered','cancelled'];
  if (!valid.includes(status)) {
    return Response.json({ success: false, message: 'Status tidak valid' }, { status: 400 });
  }
  await execute('UPDATE orders SET status = ? WHERE id = ?', [status, params.id]);
  return Response.json({ success: true, message: 'Status diperbarui' });
}
