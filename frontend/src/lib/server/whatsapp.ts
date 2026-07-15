/**
 * WhatsApp Notification untuk Admin
 * 
 * Menggunakan Fonnte.com API (gratis trial 7 hari)
 * Atau bisa diganti dengan provider lain (Wablas, CallMeBot, dll)
 * 
 * Setup Fonnte:
 * 1. Daftar di https://fonnte.com
 * 2. Hubungkan WhatsApp admin
 * 3. Dapatkan API token
 * 4. Set env: FONNTE_TOKEN=xxx dan ADMIN_WHATSAPP=6281387840944
 */

const ADMIN_WHATSAPP = process.env.ADMIN_WHATSAPP || '6281387840944';
const FONNTE_TOKEN = process.env.FONNTE_TOKEN || '';

interface OrderNotification {
  order_number: string;
  customer_name: string;
  customer_phone: string;
  total: number;
  items_count: number;
  courier: string;
  address_city: string;
}

/**
 * Kirim notifikasi WhatsApp ke admin saat ada pesanan baru
 */
export async function notifyNewOrder(order: OrderNotification) {
  const message = `🛒 *PESANAN BARU!*

No. Pesanan: *${order.order_number}*
Pelanggan: ${order.customer_name}
Telepon: ${order.customer_phone}
Jumlah Item: ${order.items_count}
Total: *Rp${order.total.toLocaleString('id-ID')}*
Kurir: ${order.courier || '-'}
Kota: ${order.address_city || '-'}

Cek di admin panel:
https://website-seputihitu.vercel.app/admin/orders`;

  await sendWhatsApp(ADMIN_WHATSAPP, message);
}

/**
 * Kirim notifikasi saat pembayaran berhasil
 */
export async function notifyPaymentSuccess(orderNumber: string, total: number, method: string) {
  const message = `💰 *PEMBAYARAN BERHASIL!*

No. Pesanan: *${orderNumber}*
Total: *Rp${total.toLocaleString('id-ID')}*
Metode: ${method}

Segera proses pengiriman!`;

  await sendWhatsApp(ADMIN_WHATSAPP, message);
}

/**
 * Core function: kirim pesan WhatsApp via Fonnte API
 */
async function sendWhatsApp(target: string, message: string) {
  if (!FONNTE_TOKEN) {
    console.log('[WA Notif] Token belum diset. Pesan:', message.substring(0, 100));
    return;
  }

  try {
    const res = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: {
        'Authorization': FONNTE_TOKEN,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        target,
        message,
      }).toString(),
    });

    const data = await res.json();
    if (data.status) {
      console.log('[WA Notif] Terkirim ke', target);
    } else {
      console.error('[WA Notif] Gagal:', data.reason || data.message);
    }
  } catch (err: any) {
    console.error('[WA Notif] Error:', err.message);
  }
}
