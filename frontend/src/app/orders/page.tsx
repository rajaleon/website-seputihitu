'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Package, ChevronRight } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { formatRupiah, formatDate } from '@/lib/utils';

interface Order { id: string; order_number: string; total: number; status: string; created_at: string; item_count: number; }

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending_payment: { label: 'Menunggu Bayar',  color: 'bg-yellow-100 text-yellow-700' },
  paid:            { label: 'Dibayar',          color: 'bg-blue-100 text-blue-700' },
  processing:      { label: 'Diproses',         color: 'bg-indigo-100 text-indigo-700' },
  shipped:         { label: 'Dikirim',          color: 'bg-purple-100 text-purple-700' },
  delivered:       { label: 'Selesai',          color: 'bg-green-100 text-green-700' },
  cancelled:       { label: 'Dibatalkan',       color: 'bg-red-100 text-red-600' },
};

const FILTER_TABS = [
  { value: '', label: 'Semua' },
  { value: 'pending_payment', label: 'Belum Bayar' },
  { value: 'processing', label: 'Diproses' },
  { value: 'shipped', label: 'Dikirim' },
  { value: 'delivered', label: 'Selesai' },
];

export default function OrdersPage() {
  const router       = useRouter();
  const { user }     = useAuthStore();
  const [orders,   setOrders]   = useState<Order[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [status,   setStatus]   = useState('');
  const [page,     setPage]     = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
  }, [user, router]);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const params: any = { page };
    if (status) params.status = status;
    api.get('/orders', { params })
      .then(r => {
        setOrders(r.data.data);
        setTotalPages(r.data.pagination.total_pages);
      })
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [user, status, page]);

  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Pesanan Saya</h1>

      {/* Tab filter */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 overflow-x-auto no-scrollbar">
        {FILTER_TABS.map(tab => (
          <button key={tab.value} onClick={() => { setStatus(tab.value); setPage(1); }}
            className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0
              ${status === tab.value ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="skeleton h-24 rounded-2xl" />)}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16">
          <Package size={56} className="mx-auto mb-4 text-gray-200" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Belum ada pesanan</h3>
          <p className="text-gray-400 text-sm mb-5">Yuk, belanja sekarang!</p>
          <Link href="/catalog" className="btn-primary">Mulai Belanja</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map(order => {
            const statusInfo = STATUS_LABELS[order.status] || { label: order.status, color: 'bg-gray-100 text-gray-600' };
            return (
              <Link key={order.id} href={`/thank-you/${order.order_number}`}
                className="card p-5 flex items-center justify-between gap-4 hover:shadow-md transition-shadow group">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-900 text-sm">{order.order_number}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">{formatDate(order.created_at)} · {order.item_count} item</p>
                  <p className="font-bold text-primary-600 mt-1 text-sm">{formatRupiah(order.total)}</p>
                </div>
                <ChevronRight size={18} className="text-gray-300 group-hover:text-primary-500 flex-shrink-0 transition-colors" />
              </Link>
            );
          })}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                className="btn-outline py-2 px-4 text-sm disabled:opacity-40">← Prev</button>
              <span className="flex items-center text-sm text-gray-600">{page} / {totalPages}</span>
              <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}
                className="btn-outline py-2 px-4 text-sm disabled:opacity-40">Next →</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
