import { NextRequest } from 'next/server';
import crypto from 'crypto';
import { query, execute, transaction } from '@/lib/server/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { order_id: orderNumber, status_code, gross_amount, transaction_status,
      fraud_status, payment_type, transaction_id, signature_key: receivedSig } = body;

    // Validate signature
    const expectedSig = crypto.createHash('sha512')
      .update(`${orderNumber}${status_code}${gross_amount}${process.env.MIDTRANS_SERVER_KEY}`)
      .digest('hex');
    if (receivedSig !== expectedSig) {
      return Response.json({ message: 'ignored' });
    }

    const orders = await query('SELECT id, status FROM orders WHERE order_number = ?', [orderNumber]);
    if (orders.length === 0) return Response.json({ message: 'order not found' });

    const orderId = orders[0].id;
    let newOrderStatus: string | null = null;
    let paidAt: string | null = null;

    if (transaction_status === 'settlement' || (transaction_status === 'capture' && fraud_status === 'accept')) {
      newOrderStatus = 'paid';
      paidAt = new Date().toISOString();
    } else if (['cancel', 'deny', 'expire'].includes(transaction_status)) {
      newOrderStatus = 'cancelled';
    }

    await execute(
      `UPDATE payments SET midtrans_transaction_id=?, payment_type=?, transaction_status=?, fraud_status=?, paid_at=?, raw_response_json=? WHERE order_id=?`,
      [transaction_id, payment_type, transaction_status, fraud_status || null, paidAt, JSON.stringify(body), orderId]
    );

    if (newOrderStatus && orders[0].status === 'pending_payment') {
      await execute('UPDATE orders SET status = ? WHERE id = ?', [newOrderStatus, orderId]);
      if (newOrderStatus === 'paid') {
        await execute("UPDATE orders SET status = 'processing' WHERE id = ?", [orderId]);
      }
    }

    return Response.json({ message: 'ok' });
  } catch (err) {
    console.error('[midtrans webhook]', err);
    return Response.json({ message: 'error handled' });
  }
}
