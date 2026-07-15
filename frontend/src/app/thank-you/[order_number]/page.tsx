'use client';

import { Suspense } from 'react';
import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Clock, Package, Truck, ArrowRight, Share2 } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { formatRupiah, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

interface OrderItem { name: string; qty: number; price: number; variant_name?: string; thumbnail_url?: string; }
interface Order {
  id: string; order_number: string; total: number; status: string;
  created_at: string; subtotal: number; shipping_cost: number; discount: number;
  courier_service?: string; notes?: string;
  recipient_name?: string; addr_phone?: string; full_address?: string; city?: string;
  province?: string; postal_code?: string;
  items: OrderItem[];
  payment?: { payment_type?: string; transaction_status?: string; };
}

const STATUS_STEPS = ['pending_payment','paid','processing','shipped','delivered'];

export default function ThankYouPage() {
  return (
    <Suspense fallback={
      <div className="max-w-2xl mx-auto px-4 py-12 space-y-4">
        <div className="skeleton h-40 rounded-2xl" />
        <div className="skeleton h-32 rounded-2xl" />
        <div className="skeleton h-48 rounded-2xl" />
      </div>
    }>
      <ThankYouContent />
    </Suspense>
  );
}

function ThankYouContent() {
  const { order_number } = useParams<{ order_number: string }>();
  const searchParams     = useSearchParams();
  const router           = useRouter();
  const { user }         = useAuthStore();
  const [order,   setOrder]   = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);

  const isPending = searchParams.get('status') === 'pending';

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    api.get(`/orders/${order_number}`)
      .then(r => setOrder(r.data.data))
      .catch(() => router.push('/orders'))
      .finally(() => setLoading(false));
  }, [user, order_number, router]);

  async function handleConfirmReceived() {
    if (!order) return;
    const confirmed = window.confirm('Konfirmasi pesanan sudah diterima? Status akan berubah menjadi "Selesai".');
    if (!confirmed) return;

    setConfirming(true);
    try {
      await api.post(`/orders/${order_number}/confirm`);
      toast.success('Pesanan berhasil dikonfirmasi!');
      setOrder({ ...order, status: 'delivered' });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal mengkonfirmasi pesanan');
    } finally {
      setConfirming(false);
    }
  }

  if (loading) return (
    <div className="max-w-2xl mx-auto px-4 py-12 text-center">
      <div className="skeleton h-16 w-16 rounded-full mx-auto mb-4" />
      <div className="skeleton h-6 w-48 mx-auto mb-2" />
      <div className="skeleton h-4 w-64 mx-auto" />
    </div>
  );

  if (!order) return null;

  const currentStep = STATUS_STEPS.indexOf(order.status);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* ── Status Header ──────────────────────────── */}
      <div className={`rounded-2xl p-6 text-center mb-6 ${isPending || order.status === 'pending_payment'
        ? 'bg-yellow-50 border border-yellow-100'
        : 'bg-green-50 border border-green-100'}`}>
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4
          ${isPending || order.status === 'pending_payment'
            ? 'bg-yellow-100 text-yellow-500'
            : 'bg-green-100 text-green-500'}`}>
          {isPending || order.status === 'pending_payment'
            ? <Clock size={32} />
            : <CheckCircle size={32} />
          }
        </div>
        <h1 className="text-2xl font-black text-gray-900 mb-2">
          {isPending || order.status === 'pending_payment'
            ? 'Menunggu Pembayaran'
            : 'Pesanan Dikonfirmasi!'}
        </h1>
        <p className="text-gray-500 text-sm">
          {isPending || order.status === 'pending_payment'
            ? 'Selesaikan pembayaranmu sebelum waktu habis.'
            : `Terima kasih, ${user?.name.split(' ')[0]}! Pesananmu sedang diproses.`}
        </p>
        <div className="mt-4 inline-flex items-center gap-2 bg-white rounded-xl px-4 py-2 shadow-sm">
          <span className="text-xs text-gray-500">No. Pesanan:</span>
          <span className="font-bold text-gray-800 text-sm">{order.order_number}</span>
          <button onClick={() => { navigator.clipboard.writeText(order.order_number); }}
            className="text-gray-400 hover:text-gray-600 ml-1">
            <Share2 size={12} />
          </button>
        </div>
      </div>

      {/* ── Order Progress ─────────────────────────── */}
      <div className="card p-4 sm:p-5 mb-5">
        <h2 className="font-semibold text-gray-900 mb-5">Status Pesanan</h2>
        <div className="relative">
          {/* Progress bar */}
          <div className="absolute top-3.5 left-4 right-4 h-0.5 bg-gray-200">
            <div className="h-full bg-primary-500 transition-all duration-500"
              style={{ width: `${Math.max(0, currentStep) / (STATUS_STEPS.length - 1) * 100}%` }} />
          </div>
          <div className="relative flex justify-between">
            {[
              { label: 'Menunggu\nBayar',  icon: <Clock size={14} /> },
              { label: 'Dibayar',          icon: <CheckCircle size={14} /> },
              { label: 'Diproses',         icon: <Package size={14} /> },
              { label: 'Dikirim',          icon: <Truck size={14} /> },
              { label: 'Selesai',          icon: <CheckCircle size={14} /> },
            ].map(({ label, icon }, i) => (
              <div key={i} className="flex flex-col items-center gap-1 sm:gap-1.5 relative">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center z-10 transition-colors
                  ${i <= currentStep
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-200 text-gray-400'}`}>
                  {icon}
                </div>
                <span className={`text-[10px] sm:text-xs text-center whitespace-pre-line leading-tight
                  ${i <= currentStep ? 'text-primary-600 font-medium' : 'text-gray-400'}`}>
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Detail Pesanan ─────────────────────────── */}
      <div className="card p-5 mb-5">
        <h2 className="font-semibold text-gray-900 mb-4">Detail Pesanan</h2>
        <div className="space-y-3">
          {order.items.map((item, i) => (
            <div key={i} className="flex justify-between text-sm">
              <div>
                <p className="font-medium text-gray-800">{item.name}</p>
                {item.variant_name && <p className="text-xs text-gray-400">{item.variant_name}</p>}
                <p className="text-xs text-gray-500">x{item.qty}</p>
              </div>
              <span className="font-semibold text-gray-800">{formatRupiah(item.price * item.qty)}</span>
            </div>
          ))}
        </div>

        <div className="border-t mt-4 pt-4 space-y-2 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal</span>
            <span>{formatRupiah(order.subtotal)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Ongkos Kirim ({order.courier_service || '—'})</span>
            <span>{formatRupiah(order.shipping_cost)}</span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Diskon Voucher</span>
              <span>-{formatRupiah(order.discount)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-gray-900 pt-1 border-t">
            <span>Total Bayar</span>
            <span className="text-primary-600">{formatRupiah(order.total)}</span>
          </div>
        </div>
      </div>

      {/* ── Alamat Pengiriman ─────────────────────── */}
      {order.recipient_name && (
        <div className="card p-5 mb-5">
          <h2 className="font-semibold text-gray-900 mb-3">Alamat Pengiriman</h2>
          <div className="text-sm text-gray-600">
            <p className="font-semibold text-gray-800">{order.recipient_name}</p>
            <p>{order.addr_phone}</p>
            <p>{order.full_address}</p>
            <p>{order.city}, {order.province} {order.postal_code}</p>
          </div>
        </div>
      )}

      {/* ── Info Pembayaran ───────────────────────── */}
      {order.payment && (
        <div className="card p-5 mb-6">
          <h2 className="font-semibold text-gray-900 mb-3">Info Pembayaran</h2>
          <div className="text-sm space-y-1">
            <div className="flex justify-between text-gray-600">
              <span>Metode</span>
              <span className="font-medium capitalize">{order.payment.payment_type?.replace('_', ' ') || '—'}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Status</span>
              <span className={`font-medium capitalize ${
                order.payment.transaction_status === 'settlement' ? 'text-green-600'
                : order.payment.transaction_status === 'pending'  ? 'text-yellow-600'
                : 'text-red-500'
              }`}>
                {order.payment.transaction_status === 'settlement' ? 'Lunas'
                 : order.payment.transaction_status === 'pending' ? 'Menunggu Pembayaran'
                 : order.payment.transaction_status || 'Pending'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── Actions ───────────────────────────────── */}
      {/* Tombol Konfirmasi Pesanan Diterima — muncul saat status shipped/processing */}
      {['shipped', 'processing', 'paid'].includes(order.status) && (
        <div className="card p-5 mb-5 border-2 border-primary-100 bg-primary-50/30">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Package size={22} className="text-primary-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1">Pesanan Sudah Sampai?</h3>
              <p className="text-sm text-gray-500 mb-4">
                Konfirmasi bahwa kamu sudah menerima pesanan ini. Setelah dikonfirmasi, status akan berubah menjadi "Selesai".
              </p>
              <button
                onClick={handleConfirmReceived}
                disabled={confirming}
                className="btn-primary flex items-center gap-2 text-sm">
                <CheckCircle size={16} />
                {confirming ? 'Memproses...' : 'Ya, Pesanan Sudah Diterima'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sudah selesai */}
      {order.status === 'delivered' && (
        <div className="card p-5 mb-5 border-2 border-green-100 bg-green-50/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <CheckCircle size={20} className="text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-green-800">Pesanan Selesai</h3>
              <p className="text-sm text-green-600">Terima kasih! Pesanan sudah dikonfirmasi diterima.</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <Link href="/orders" className="btn-outline flex-1 flex items-center justify-center gap-2">
          <Package size={16} /> Lihat Semua Pesanan
        </Link>
        <Link href="/catalog" className="btn-primary flex-1 flex items-center justify-center gap-2">
          Lanjut Belanja <ArrowRight size={16} />
        </Link>
      </div>

      {/* Rekomendasi singkat */}
      <div className="mt-8 text-center">
        <p className="text-sm text-gray-500 mb-3">Jangan lupa follow kami di media sosial untuk promo terbaru!</p>
        <div className="flex justify-center gap-3">
          <a href="#" className="text-primary-500 text-sm font-medium hover:underline">Instagram</a>
          <span className="text-gray-300">·</span>
          <a href="#" className="text-primary-500 text-sm font-medium hover:underline">Facebook</a>
          <span className="text-gray-300">·</span>
          <a href="#" className="text-primary-500 text-sm font-medium hover:underline">WhatsApp</a>
        </div>
      </div>
    </div>
  );
}
