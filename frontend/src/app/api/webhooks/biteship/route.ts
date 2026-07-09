import { NextRequest } from 'next/server';
import { query, execute } from '@/lib/server/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { order_id: biteshipOrderId, status, waybill_id, courier } = body;
    if (!biteshipOrderId) return Response.json({ message: 'ok' });

    const shipments = await query('SELECT id, order_id FROM shipments WHERE biteship_order_id = ?', [biteshipOrderId]);
    if (shipments.length === 0) return Response.json({ message: 'not found' });

    await execute(
      `UPDATE shipments SET status=?, tracking_id=?, waybill_url=?, last_status_at=NOW() WHERE id=?`,
      [status, waybill_id || null, courier?.link || null, shipments[0].id]
    );

    if (status === 'delivered') {
      await execute("UPDATE orders SET status = 'delivered' WHERE id = ?", [shipments[0].order_id]);
    } else if (['dropping_off', 'in_transit'].includes(status)) {
      await execute("UPDATE orders SET status = 'shipped' WHERE id = ?", [shipments[0].order_id]);
    }

    return Response.json({ message: 'ok' });
  } catch (err) {
    console.error('[biteship webhook]', err);
    return Response.json({ message: 'error handled' });
  }
}
