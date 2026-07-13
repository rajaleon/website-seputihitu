import { NextRequest } from 'next/server';
import { query, execute } from '@/lib/server/db';
import { requireAuth } from '@/lib/server/auth';

/**
 * POST /api/orders/[order_number]/confirm
 * Customer konfirmasi pesanan sudah diterima → status jadi 'delivered'
 */
export async function POST(req: NextRequest, { params }: { params: { order_number: string } }) {
  try {
    const user = requireAuth(req);
    if (user instanceof Response) return user;

    const orders = await query(
      'SELECT id, status FROM orders WHERE order_number = ? AND user_id = ?',
      [params.order_number, user.id]
    );

    if (orders.length === 0) {
      return Response.json({ success: false, message: 'Order tidak ditemukan' }, { status: 404 });
    }

    const order = orders[0];

    // Hanya bisa konfirmasi dari status shipped atau processing
    if (!['shipped', 'processing', 'paid'].includes(order.status)) {
      return Response.json({
        success: false,
        message: 'Pesanan tidak bisa dikonfirmasi pada status ini'
      }, { status: 400 });
    }

    // Update status ke delivered
    await execute("UPDATE orders SET status = 'delivered' WHERE id = ?", [order.id]);

    // Update shipment status juga
    await execute("UPDATE shipments SET status = 'delivered', last_status_at = NOW() WHERE order_id = ?", [order.id]);

    return Response.json({
      success: true,
      message: 'Pesanan dikonfirmasi sudah diterima'
    });
  } catch (err: any) {
    console.error('[POST /api/orders/confirm]', err);
    return Response.json({ success: false, message: err.message || 'Terjadi kesalahan' }, { status: 500 });
  }
}
