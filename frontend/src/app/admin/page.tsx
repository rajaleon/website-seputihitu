'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Package, ShoppingBag, Users, TrendingUp, ArrowUpRight, Plus } from 'lucide-react';
import api from '@/lib/api';
import { formatRupiah } from '@/lib/utils';

interface Stats {
  total_products: number;
  total_orders: number;
  total_users: number;
  revenue_today: number;
}

interface RecentOrder {
  order_number: string;
  user_name?: string;
  total: number;
  status: string;
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending_payment: 'bg-yellow-100 text-yellow-700',
  paid:            'bg-blue-100 text-blue-700',
  processing:      'bg-indigo-100 text-indigo-700',
  shipped:         'bg-purple-100 text-purple-700',
  delivered:       'bg-green-100 text-green-700',
  cancelled:       'bg-red-100 text-red-600',
};

const STATUS_LABELS: Record<string, string> = {
  pending_payment: 'Menunggu Bayar',
  paid:            'Dibayar',
  processing:      'Diproses',
  shipped:         'Dikirim',
  delivered:       'Selesai',
  cancelled:       'Dibatalkan',
};

export default function AdminDashboard() {
  const [stats,        setStats]        = useState<Stats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading,      setLoading]      = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [statsRes, ordersRes] = await Promise.all([
          api.get('/admin/stats'),
          api.get('/admin/orders/recent'),
        ]);
        setStats(statsRes.data.data);
        setRecentOrders(ordersRes.data.data);
      } catch {
        // Backend stats endpoint belum ada — tampilkan fallback
        setStats({ total_products: 0, total_orders: 0, total_users: 0, revenue_today: 0 });
        setRecentOrders([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const statCards = [
    { label: 'Total Produk',   value: stats?.total_products ?? '—', icon: Package,    color: 'bg-blue-50 text-blue-500',   href: '/admin/products' },
    { label: 'Total Pesanan',  value: stats?.total_orders   ?? '—', icon: ShoppingBag, color: 'bg-purple-50 text-purple-500', href: '/admin/orders' },
    { label: 'Total Pengguna', value: stats?.total_users    ?? '—', icon: Users,       color: 'bg-green-50 text-green-500',  href: '/admin/users' },
    { label: 'Revenue Hari Ini', value: stats ? formatRupiah(stats.revenue_today) : '—', icon: TrendingUp, color: 'bg-orange-50 text-orange-500', href: '/admin/orders' },
  ];

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Selamat datang di Admin Panel Seputihitu</p>
        </div>
        <Link href="/admin/products/new" className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Tambah Produk
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {statCards.map(({ label, value, icon: Icon, color, href }) => (
          <Link key={label} href={href}
            className="card p-5 hover:shadow-md transition-shadow group">
            <div className="flex items-start justify-between mb-4">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
                <Icon size={22} />
              </div>
              <ArrowUpRight size={16} className="text-gray-300 group-hover:text-primary-500 transition-colors" />
            </div>
            <p className="text-2xl font-black text-gray-900">{loading ? '...' : value}</p>
            <p className="text-sm text-gray-500 mt-1">{label}</p>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-8">
        <div className="lg:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-gray-900">Pesanan Terbaru</h2>
            <Link href="/admin/orders" className="text-primary-500 text-sm font-medium hover:underline">
              Lihat Semua
            </Link>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="skeleton h-10 rounded-lg" />)}
            </div>
          ) : recentOrders.length === 0 ? (
            <p className="text-gray-400 text-sm py-8 text-center">Belum ada pesanan masuk.</p>
          ) : (
            <div className="space-y-2">
              {recentOrders.map(order => (
                <div key={order.order_number}
                  className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{order.order_number}</p>
                    <p className="text-xs text-gray-400">{order.user_name || '—'}</p>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-600'}`}>
                      {STATUS_LABELS[order.status] || order.status}
                    </span>
                    <span className="font-semibold text-sm text-gray-800">{formatRupiah(order.total)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions Panel */}
        <div className="card p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Aksi Cepat</h2>
          <div className="space-y-2">
            {[
              { href: '/admin/products/new',  label: 'Tambah Produk Baru',   icon: Package,    color: 'text-blue-500 bg-blue-50' },
              { href: '/admin/banners',       label: 'Kelola Banner',        icon: TrendingUp,  color: 'text-orange-500 bg-orange-50' },
              { href: '/admin/orders',        label: 'Lihat Semua Pesanan',  icon: ShoppingBag, color: 'text-green-500 bg-green-50' },
            ].map(({ href, label, icon: Icon, color }) => (
              <Link key={href} href={href}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
                  <Icon size={15} />
                </div>
                <span className="text-sm text-gray-700 group-hover:text-gray-900 font-medium">{label}</span>
                <ArrowUpRight size={13} className="ml-auto text-gray-300 group-hover:text-primary-500" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
