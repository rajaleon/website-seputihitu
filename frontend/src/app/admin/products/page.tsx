'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Plus, Search, Pencil, Power, PowerOff, Package, ChevronDown } from 'lucide-react';
import api from '@/lib/api';
import { formatRupiah } from '@/lib/utils';
import toast from 'react-hot-toast';

interface Product {
  id: string; sku: string; name: string; slug: string;
  price: number; discount_price?: number; stock: number;
  thumbnail_url?: string; is_active: number; is_featured: number;
  is_flash_sale: number; category_name?: string; total_sold: number;
  rating_avg: number;
}

const SORT_OPTIONS = [
  { value: 'created_at_desc', label: 'Terbaru' },
  { value: 'price_asc',       label: 'Harga Terendah' },
  { value: 'price_desc',      label: 'Harga Tertinggi' },
  { value: 'sold_desc',       label: 'Terlaris' },
];

export default function AdminProductsPage() {
  const [products,   setProducts]   = useState<Product[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [sort,       setSort]       = useState('created_at_desc');
  const [page,       setPage]       = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [toggling,   setToggling]   = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      // Admin butuh semua produk termasuk non-aktif — pakai endpoint admin atau parameter khusus
      const params: Record<string, string> = { sort, page: String(page), limit: '20' };
      if (search) params.search = search;
      // Minta semua status (aktif dan non-aktif) via admin endpoint
      const { data } = await api.get('/admin/products', { params });
      setProducts(data.data);
      setTotalPages(data.pagination.total_pages);
      setTotalCount(data.pagination.total);
    } catch {
      // Fallback ke public endpoint jika admin endpoint belum ada
      try {
        const params: Record<string, string> = { sort, page: String(page), limit: '20' };
        if (search) params.search = search;
        const { data } = await api.get('/products', { params });
        setProducts(data.data);
        setTotalPages(data.pagination.total_pages);
        setTotalCount(data.pagination.total);
      } catch {
        setProducts([]);
      }
    } finally {
      setLoading(false);
    }
  }, [search, sort, page]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  async function toggleActive(product: Product) {
    setToggling(product.id);
    try {
      await api.patch(`/products/${product.id}`, { is_active: product.is_active ? 0 : 1 });
      toast.success(`Produk ${product.is_active ? 'dinonaktifkan' : 'diaktifkan'}`);
      fetchProducts();
    } catch {
      toast.error('Gagal mengubah status produk');
    } finally {
      setToggling(null);
    }
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manajemen Produk</h1>
          <p className="text-gray-500 text-sm mt-1">{totalCount} produk total</p>
        </div>
        <Link href="/admin/products/new" className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Tambah Produk
        </Link>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-5 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Cari nama produk atau SKU..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="input-field pl-9 py-2.5 text-sm" />
        </div>
        <div className="relative">
          <select value={sort} onChange={e => { setSort(e.target.value); setPage(1); }}
            className="input-field py-2.5 pr-9 text-sm appearance-none cursor-pointer w-44">
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Produk</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">SKU</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Harga</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Stok</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Label</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((__, j) => (
                      <td key={j} className="px-4 py-4"><div className="skeleton h-5 rounded" /></td>
                    ))}
                  </tr>
                ))
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-gray-400">
                    <Package size={40} className="mx-auto mb-3 opacity-30" />
                    <p>Belum ada produk</p>
                    <Link href="/admin/products/new" className="text-primary-500 text-sm font-medium hover:underline mt-1 inline-block">
                      + Tambah produk pertama
                    </Link>
                  </td>
                </tr>
              ) : (
                products.map(product => (
                  <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                    {/* Produk */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0">
                          {product.thumbnail_url ? (
                            <Image src={product.thumbnail_url} alt={product.name}
                              width={48} height={48} className="object-cover w-full h-full" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                              <Package size={20} />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-800 truncate max-w-[200px]">{product.name}</p>
                          <p className="text-xs text-gray-400">{product.category_name || '—'}</p>
                        </div>
                      </div>
                    </td>
                    {/* SKU */}
                    <td className="px-4 py-4">
                      <span className="font-mono text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-lg">
                        {product.sku}
                      </span>
                    </td>
                    {/* Harga */}
                    <td className="px-4 py-4">
                      <p className="font-semibold text-gray-800">{formatRupiah(product.discount_price || product.price)}</p>
                      {product.discount_price && (
                        <p className="text-xs text-gray-400 line-through">{formatRupiah(product.price)}</p>
                      )}
                    </td>
                    {/* Stok */}
                    <td className="px-4 py-4">
                      <span className={`font-semibold ${product.stock === 0 ? 'text-red-500' : product.stock < 10 ? 'text-yellow-600' : 'text-gray-800'}`}>
                        {product.stock}
                      </span>
                    </td>
                    {/* Label */}
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-1">
                        {product.is_featured ? (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">Unggulan</span>
                        ) : null}
                        {product.is_flash_sale ? (
                          <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">Flash Sale</span>
                        ) : null}
                        {!product.is_featured && !product.is_flash_sale && (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </div>
                    </td>
                    {/* Status */}
                    <td className="px-4 py-4">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-semibold
                        ${product.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {product.is_active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    {/* Aksi */}
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/admin/products/edit/${product.id}`}
                          className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 hover:border-primary-400 hover:text-primary-600 text-gray-500 transition-colors"
                          title="Edit">
                          <Pencil size={14} />
                        </Link>
                        <button onClick={() => toggleActive(product)}
                          disabled={toggling === product.id}
                          className={`w-8 h-8 flex items-center justify-center rounded-lg border transition-colors
                            ${product.is_active
                              ? 'border-gray-200 hover:border-red-300 hover:text-red-500 text-gray-500'
                              : 'border-gray-200 hover:border-green-400 hover:text-green-600 text-gray-500'}`}
                          title={product.is_active ? 'Nonaktifkan' : 'Aktifkan'}>
                          {toggling === product.id
                            ? <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            : product.is_active ? <PowerOff size={14} /> : <Power size={14} />
                          }
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Halaman {page} dari {totalPages}
            </p>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                className="btn-outline py-1.5 px-3 text-sm disabled:opacity-40">← Prev</button>
              <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}
                className="btn-outline py-1.5 px-3 text-sm disabled:opacity-40">Next →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
