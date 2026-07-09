'use client';

import { Suspense } from 'react';
import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { SlidersHorizontal, X, ChevronDown } from 'lucide-react';
import api from '@/lib/api';
import ProductCard, { Product } from '@/components/ProductCard';
import { SkeletonGrid } from '@/components/SkeletonCard';

interface Pagination { page: number; limit: number; total: number; total_pages: number; }

const SORT_OPTIONS = [
  { value: 'created_at_desc', label: 'Terbaru' },
  { value: 'price_asc',       label: 'Harga Termurah' },
  { value: 'price_desc',      label: 'Harga Termahal' },
  { value: 'sold_desc',       label: 'Terlaris' },
  { value: 'rating_desc',     label: 'Rating Tertinggi' },
];

function CatalogContent() {
  const searchParams = useSearchParams();
  const router       = useRouter();

  const [products,   setProducts]   = useState<Product[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [showFilter, setShowFilter] = useState(false);

  const [minPrice,  setMinPrice]  = useState(searchParams.get('min_price') || '');
  const [maxPrice,  setMaxPrice]  = useState(searchParams.get('max_price') || '');
  const [sort,      setSort]      = useState(searchParams.get('sort') || 'created_at_desc');
  const [page,      setPage]      = useState(Number(searchParams.get('page') || 1));
  const [search,    setSearch]    = useState(searchParams.get('search') || '');
  const [featured,  setFeatured]  = useState(searchParams.get('featured') === 'true');
  const [flashSale, setFlashSale] = useState(searchParams.get('flash_sale') === 'true');

  useEffect(() => {
    // no-op (categories removed)
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { sort, page: String(page), limit: '20' };
      if (minPrice)  params.min_price  = minPrice;
      if (maxPrice)  params.max_price  = maxPrice;
      if (search)    params.search     = search;
      if (featured)  params.featured   = 'true';
      if (flashSale) params.flash_sale = 'true';

      const { data } = await api.get('/products', { params });
      setProducts(data.data);
      setPagination(data.pagination);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [minPrice, maxPrice, sort, page, search, featured, flashSale]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  // Sync URL params
  useEffect(() => {
    const p = new URLSearchParams();
    if (minPrice)  p.set('min_price',  minPrice);
    if (maxPrice)  p.set('max_price',  maxPrice);
    if (sort !== 'created_at_desc') p.set('sort', sort);
    if (page > 1)  p.set('page',       String(page));
    if (search)    p.set('search',     search);
    if (featured)  p.set('featured',   'true');
    if (flashSale) p.set('flash_sale', 'true');
    router.replace(`/catalog?${p.toString()}`, { scroll: false });
  }, [minPrice, maxPrice, sort, page, search, featured, flashSale, router]);

  function resetFilters() {
    setMinPrice(''); setMaxPrice('');
    setFeatured(false); setFlashSale(false); setPage(1);
  }

  const activeFilters = [minPrice, maxPrice, featured, flashSale].filter(Boolean).length;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {search ? `Hasil pencarian: "${search}"` : 'Katalog Produk'}
          </h1>
          {pagination && (
            <p className="text-sm text-gray-500 mt-1">{pagination.total.toLocaleString('id-ID')} produk ditemukan</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <select value={sort} onChange={e => { setSort(e.target.value); setPage(1); }}
              className="input-field py-2 pr-9 text-sm appearance-none cursor-pointer w-44">
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
          <button onClick={() => setShowFilter(!showFilter)}
            className="btn-outline py-2 flex items-center gap-2 text-sm">
            <SlidersHorizontal size={16} />
            Filter
            {activeFilters > 0 && (
              <span className="bg-primary-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">{activeFilters}</span>
            )}
          </button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Sidebar Filter */}
        {showFilter && (
          <aside className="w-64 flex-shrink-0 space-y-6">
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Filter</h3>
                {activeFilters > 0 && (
                  <button onClick={resetFilters} className="text-xs text-primary-500 hover:underline flex items-center gap-1">
                    <X size={12} /> Reset
                  </button>
                )}
              </div>

              {/* Harga */}
              <div className="mb-5">
                <p className="text-sm font-medium text-gray-700 mb-2">Rentang Harga</p>
                <div className="flex gap-2">
                  <input type="number" placeholder="Min" value={minPrice}
                    onChange={e => { setMinPrice(e.target.value); setPage(1); }}
                    className="input-field py-2 text-sm" />
                  <input type="number" placeholder="Max" value={maxPrice}
                    onChange={e => { setMaxPrice(e.target.value); setPage(1); }}
                    className="input-field py-2 text-sm" />
                </div>
              </div>

              {/* Tipe Produk */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Tipe Produk</p>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={featured}
                    onChange={e => { setFeatured(e.target.checked); setPage(1); }}
                    className="accent-primary-500" />
                  <span className="text-sm text-gray-600">Produk Unggulan</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={flashSale}
                    onChange={e => { setFlashSale(e.target.checked); setPage(1); }}
                    className="accent-primary-500" />
                  <span className="text-sm text-gray-600">Flash Sale</span>
                </label>
              </div>
            </div>
          </aside>
        )}

        {/* Product Grid */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <SkeletonGrid count={20} />
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-4xl mb-4">🔍</p>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Produk tidak ditemukan</h3>
              <p className="text-gray-500 text-sm mb-5">Coba ubah filter atau kata kunci pencarian.</p>
              <button onClick={resetFilters} className="btn-primary">Reset Filter</button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {products.map(p => <ProductCard key={p.id} product={p} />)}
              </div>

              {/* Pagination */}
              {pagination && pagination.total_pages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-8">
                  <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                    className="btn-outline py-2 px-4 text-sm disabled:opacity-40">
                    ← Prev
                  </button>
                  {Array.from({ length: Math.min(5, pagination.total_pages) }, (_, i) => {
                    const pg = Math.max(1, Math.min(page - 2, pagination.total_pages - 4)) + i;
                    return (
                      <button key={pg} onClick={() => setPage(pg)}
                        className={`w-10 h-10 rounded-xl text-sm font-medium transition-colors
                          ${pg === page ? 'bg-primary-500 text-white' : 'bg-white border border-gray-200 hover:border-primary-300 text-gray-700'}`}>
                        {pg}
                      </button>
                    );
                  })}
                  <button disabled={page === pagination.total_pages} onClick={() => setPage(p => p + 1)}
                    className="btn-outline py-2 px-4 text-sm disabled:opacity-40">
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Suspense wrapper — wajib karena useSearchParams() di Next.js 14
export default function CatalogPage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-4 py-6"><SkeletonGrid count={20} /></div>}>
      <CatalogContent />
    </Suspense>
  );
}
