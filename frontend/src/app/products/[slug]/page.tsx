'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  Star, ShoppingCart, Zap, Truck, Shield,
  ChevronLeft, ChevronRight, Heart, Package
} from 'lucide-react';
import api from '@/lib/api';
import { formatRupiah, discountPercent } from '@/lib/utils';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import ProductCard, { Product } from '@/components/ProductCard';
import toast from 'react-hot-toast';

interface Variant { id: string; variant_name: string; price?: number; stock: number; }
interface ProductDetail extends Product {
  description?: string;
  specification?: string;
  stock: number;
  images: { id: number; image_url: string }[];
  variants: Variant[];
  related: Product[];
  weight_gram?: number;
}

export default function ProductDetailPage() {
  const { slug }   = useParams<{ slug: string }>();
  const router     = useRouter();
  const { user }   = useAuthStore();
  const addItem    = useCartStore(s => s.addItem);

  const [product,      setProduct]      = useState<ProductDetail | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [imgIdx,       setImgIdx]       = useState(0);
  const [selectedVar,  setSelectedVar]  = useState<string | null>(null);
  const [qty,          setQty]          = useState(1);
  const [activeTab,    setActiveTab]    = useState<'desc'|'spec'>('desc');
  const [postalCode,   setPostalCode]   = useState('');
  const [shippingRates, setShippingRates] = useState<any[]>([]);
  const [loadingRates,  setLoadingRates]  = useState(false);
  const [addingCart,    setAddingCart]    = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const { data } = await api.get(`/products/${slug}`);
        setProduct(data.data);
      } catch {
        router.push('/catalog');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug, router]);

  if (loading) return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="skeleton aspect-square rounded-2xl" />
        <div className="space-y-4">
          {[...Array(6)].map((_, i) => <div key={i} className="skeleton h-6 rounded" />)}
        </div>
      </div>
    </div>
  );

  if (!product) return null;

  const allImages = [
    ...(product.thumbnail_url ? [{ id: 0, image_url: product.thumbnail_url }] : []),
    ...product.images,
  ];

  const variant       = product.variants.find(v => v.id === selectedVar);
  const finalPrice    = variant?.price ?? product.discount_price ?? product.price;
  const displayStock  = variant?.stock ?? product.stock;
  const hasDiscount   = product.discount_price && product.discount_price < product.price && !variant?.price;

  async function handleAddToCart() {
    if (!user) { router.push('/login'); return; }
    if (!product) return;
    if (product.variants.length > 0 && !selectedVar) {
      toast.error('Pilih varian terlebih dahulu'); return;
    }
    setAddingCart(true);
    await addItem(product.id, qty, selectedVar || undefined);
    setAddingCart(false);
  }

  async function handleBuyNow() {
    if (!user) { router.push('/login'); return; }
    if (!product) return;
    if (product.variants.length > 0 && !selectedVar) {
      toast.error('Pilih varian terlebih dahulu'); return;
    }
    setAddingCart(true);
    await addItem(product.id, qty, selectedVar || undefined);
    setAddingCart(false);
    router.push('/cart');
  }

  async function checkOngkir() {
    if (!product) return;
    if (!postalCode || postalCode.length < 5) {
      toast.error('Masukkan kode pos (5 digit)'); return;
    }
    setLoadingRates(true);
    try {
      const { data } = await api.post('/shipping/estimate', {
        destination_postal_code: postalCode,
        items: [{ name: product.name, value: Number(finalPrice), weight: product.weight_gram || 500, qty }],
      });
      setShippingRates(data.data);
    } catch {
      toast.error('Gagal mengecek ongkir, coba lagi');
    } finally {
      setLoadingRates(false);
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-primary-500">Beranda</Link>
        <ChevronRight size={14} />
        <Link href="/catalog" className="hover:text-primary-500">Katalog</Link>
        <ChevronRight size={14} />
        <span className="text-gray-800 font-medium truncate max-w-xs">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        {/* ── Galeri Gambar ─────────────────────────── */}
        <div>
          <div className="relative aspect-square bg-gray-100 rounded-2xl overflow-hidden mb-3">
            {allImages[imgIdx] ? (
              <Image src={allImages[imgIdx].image_url} alt={product.name} fill className="object-contain" />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-300">
                <Package size={80} />
              </div>
            )}
            {allImages.length > 1 && (
              <>
                <button onClick={() => setImgIdx(i => Math.max(0, i - 1))}
                  disabled={imgIdx === 0}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/80 rounded-full flex items-center justify-center shadow disabled:opacity-30">
                  <ChevronLeft size={18} />
                </button>
                <button onClick={() => setImgIdx(i => Math.min(allImages.length - 1, i + 1))}
                  disabled={imgIdx === allImages.length - 1}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/80 rounded-full flex items-center justify-center shadow disabled:opacity-30">
                  <ChevronRight size={18} />
                </button>
              </>
            )}
          </div>
          {/* Thumbnails */}
          {allImages.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {allImages.map((img, i) => (
                <button key={img.id} onClick={() => setImgIdx(i)}
                  className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-colors
                    ${i === imgIdx ? 'border-primary-500' : 'border-transparent'}`}>
                  <Image src={img.image_url} alt="" width={64} height={64} className="object-cover w-full h-full" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Info Produk ───────────────────────────── */}
        <div className="space-y-5">
          <div>
            <p className="text-sm text-primary-500 font-medium mb-1">{product.category_name}</p>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-snug">{product.name}</h1>
          </div>

          {/* Rating & Terjual */}
          <div className="flex items-center gap-3 text-sm">
            <div className="flex items-center gap-1">
              {[1,2,3,4,5].map(s => (
                <Star key={s} size={14} className={`${s <= Math.round(Number(product.rating_avg)) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'}`} />
              ))}
              <span className="text-gray-600 ml-1">{Number(product.rating_avg).toFixed(1)}</span>
            </div>
            <span className="text-gray-300">|</span>
            <span className="text-gray-500">{product.total_sold?.toLocaleString('id-ID')} terjual</span>
            <span className="text-gray-300">|</span>
            <span className={displayStock > 0 ? 'text-green-600' : 'text-red-500'}>
              {displayStock > 0 ? `Stok: ${displayStock}` : 'Habis'}
            </span>
          </div>

          {/* Harga */}
          <div className="bg-primary-50 rounded-xl p-4">
            <div className="flex items-baseline gap-3">
              <span className="text-2xl sm:text-3xl font-black text-primary-600">{formatRupiah(finalPrice)}</span>
              {hasDiscount && (
                <>
                  <span className="text-gray-400 line-through text-base">{formatRupiah(product.price)}</span>
                  <span className="badge-discount">-{discountPercent(product.price, product.discount_price!)}%</span>
                </>
              )}
            </div>
          </div>

          {/* Varian */}
          {product.variants.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Pilih Varian:</p>
              <div className="flex flex-wrap gap-2">
                {product.variants.map(v => (
                  <button key={v.id} onClick={() => setSelectedVar(v.id === selectedVar ? null : v.id)}
                    disabled={v.stock === 0}
                    className={`px-4 py-2 rounded-xl border-2 text-sm font-medium transition-all
                      ${v.id === selectedVar ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-200 text-gray-700 hover:border-primary-300'}
                      ${v.stock === 0 ? 'opacity-40 cursor-not-allowed line-through' : ''}`}>
                    {v.variant_name}
                    {v.price && <span className="text-xs text-gray-500 ml-1">· {formatRupiah(v.price)}</span>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Qty */}
          <div className="flex items-center gap-3">
            <p className="text-sm font-semibold text-gray-700">Jumlah:</p>
            <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
              <button onClick={() => setQty(q => Math.max(1, q - 1))}
                className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 transition-colors text-gray-600 font-bold">
                −
              </button>
              <span className="w-12 text-center text-sm font-semibold">{qty}</span>
              <button onClick={() => setQty(q => Math.min(displayStock, q + 1))}
                disabled={qty >= displayStock}
                className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 transition-colors text-gray-600 font-bold disabled:opacity-40">
                +
              </button>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex gap-3">
            <button onClick={handleAddToCart} disabled={addingCart || displayStock === 0}
              className="btn-outline flex-1 flex items-center justify-center gap-2">
              <ShoppingCart size={16} />
              {addingCart ? 'Menambahkan...' : 'Keranjang'}
            </button>
            <button onClick={handleBuyNow} disabled={addingCart || displayStock === 0}
              className="btn-primary flex-1 flex items-center justify-center gap-2">
              <Zap size={16} />
              Beli Sekarang
            </button>
          </div>

          {/* Trust */}
          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              { icon: <Truck size={16} />, text: 'Pengiriman\nCepat' },
              { icon: <Shield size={16} />, text: 'Pembayaran\nAman' },
              { icon: <Heart size={16} />, text: 'Garansi\n7 Hari' },
            ].map(({ icon, text }) => (
              <div key={text} className="bg-gray-50 rounded-xl p-3 flex flex-col items-center gap-1.5 text-primary-500">
                {icon}
                <span className="text-xs text-gray-500 whitespace-pre-line leading-tight">{text}</span>
              </div>
            ))}
          </div>

          {/* Cek Ongkir */}
          <div className="card p-4">
            <p className="text-sm font-semibold text-gray-700 mb-3">Estimasi Ongkos Kirim</p>
            <div className="flex gap-2">
              <input type="text" maxLength={5} placeholder="Masukkan kode pos tujuan"
                value={postalCode} onChange={e => setPostalCode(e.target.value.replace(/\D/g, ''))}
                className="input-field py-2 text-sm flex-1" />
              <button onClick={checkOngkir} disabled={loadingRates}
                className="btn-primary text-sm px-4 py-2 whitespace-nowrap">
                {loadingRates ? '...' : 'Cek'}
              </button>
            </div>
            {shippingRates.length > 0 && (
              <div className="mt-3 space-y-1.5 max-h-40 overflow-y-auto">
                {shippingRates.map((r, i) => (
                  <div key={i} className="flex items-center justify-between text-sm py-2 border-b border-gray-50 last:border-0">
                    <div>
                      <span className="font-medium">{r.courier_name}</span>
                      <span className="text-gray-500 text-xs ml-1">({r.service_name})</span>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-800">{formatRupiah(r.price)}</p>
                      <p className="text-xs text-gray-400">{r.min_day}–{r.max_day} hari</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Tab: Deskripsi / Spesifikasi ─── */}
      <div className="card mb-10">
        <div className="flex border-b border-gray-100">
          {(['desc','spec'] as const).map((tab, i) => {
            const labels = ['Deskripsi', 'Spesifikasi'];
            return (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-6 py-4 text-sm font-semibold transition-colors border-b-2
                  ${activeTab === tab ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                {labels[i]}
              </button>
            );
          })}
        </div>
        <div className="p-5 min-h-32">
          {activeTab === 'desc' && (
            <div className="prose prose-sm max-w-none text-gray-600 leading-relaxed">
              {product.description
                ? <div dangerouslySetInnerHTML={{ __html: product.description.replace(/\n/g, '<br/>') }} />
                : <p className="text-gray-400">Deskripsi belum tersedia.</p>
              }
            </div>
          )}
          {activeTab === 'spec' && (
            <div className="text-gray-600 text-sm leading-relaxed">
              {product.specification
                ? <div dangerouslySetInnerHTML={{ __html: product.specification.replace(/\n/g, '<br/>') }} />
                : <p className="text-gray-400">Spesifikasi belum tersedia.</p>
              }
            </div>
          )}
        </div>
      </div>

      {/* ── Produk Terkait ─────────────────────────── */}
      {product.related.length > 0 && (
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-5">Produk Terkait</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {product.related.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}
    </div>
  );
}
