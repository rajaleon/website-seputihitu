'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import api from '@/lib/api';
import { formatRupiah, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

interface Order {
  id: string; order_number: string; total: number; status: string;
  created_at: string; item_count: number; user_name?: string; user_email?: string;
}

const STATUS_OPTIONS = [
  { value: '', label: 'Semua Status' },
  { value: 'pending_payment', label: 'Menunggu Bayar' },
  { value: 'paid',            label: 'Dibayar' },
  { value: 'processing',      label: 'Diproses' },
  { value: 'shipped',         label: 'Dikirim' },
  { value: 'delivered',       label: 'Selesai' },
  { value: 'cancelled',       label: 'Dibatalkan' },
];

const STATUS_COLORS: Record<string, string> = {
  pending_payment: 'bg-yellow-100 text-yellow-700',
  paid:            'bg-blue-100 text-blue-700',
  processing:      'bg-indigo-100 text-indigo-700',
  shipped:         'bg-purple-100 text-purple-700',
  delivered:       'bg-green-100 text-green-700',
  cancelled:       'bg-red-100 text-red-600',
};

export default function AdminOrdersPage() {
  const [orders,      setOrders]      = useState<Order[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [status,      setStatus]      = useState('');
  const [page,        setPage]        = useState(1);
  const [totalPages,  setTotalPages]  = useState(1);
  const [totalCount,  setTotalCount]  = useState(0);
  const [updating,    setUpdating]    = useState<string | null>(null);

  function load() {
    setLoading(true);
    const params: any = { page, limit: 20 };
    if (status) params.status = status;
    // Admin: ambil semua order (bukan per user)
    api.get('/admin/orders/recent', { params })
      .then(r => {
        // recent endpoint tidak support pagination, fallback ke endpoint orders biasa dengan admin token
        setOrders(r.data.data);
        setTotalPages(1);
        setTotalCount(r.data.data.length);
      })
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [status, page]);

  async function updateStatus(orderId: string, newStatus: string) {
    setUpdating(orderId);
    try {
      await api.patch(`/admin/orders/${orderId}/status`, { status: newStatus });
      toast.success('Status order diperbarui');
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal update status');
    } finally {
      setUpdating(null);
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manajemen Pesanan</h1>
          <p className="text-gray-500 text-sm mt-1">{totalCount} pesanan</p>
        </div>
      </div>

      {/* Filter */}
      <div className="card p-4 mb-5 flex gap-3">
        <div className="relative">
          <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}
            className="input-field py-2.5 pr-9 text-sm appearance-none cursor-pointer w-48">
            {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase">No. Pesanan</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase">Pelanggan</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase">Total</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase">Tanggal</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase">Ubah Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 6 }).map((__, j) => <td key={j} className="px-4 py-4"><div className="skeleton h-5 rounded" /></td>)}</tr>
                ))
              ) : orders.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-gray-400">Belum ada pesanan.</td></tr>
              ) : orders.map(order => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-5 py-4">
                    <p className="font-semibold text-gray-800 text-xs">{order.order_number}</p>
                  </td>
                  <td className="px-4 py-4">
                    <p className="font-medium text-gray-700">{order.user_name || '—'}</p>
                  </td>
                  <td className="px-4 py-4">
                    <span className="font-bold text-gray-800">{formatRupiah(order.total)}</span>
                  </td>
                  <td className="px-4 py-4 text-gray-500 text-xs">
                    {formatDate(order.created_at)}
                  </td>
                  <td className="px-4 py-4">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-600'}`}>
                      {STATUS_OPTIONS.find(s => s.value === order.status)?.label || order.status}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="relative">
                      <select
                        value={order.status}
                        disabled={updating === order.id}
                        onChange={e => updateStatus(order.id, e.target.value)}
                        className="input-field py-1.5 pr-8 text-xs appearance-none cursor-pointer w-40">
                        {STATUS_OPTIONS.filter(o => o.value).map(o => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                      <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
