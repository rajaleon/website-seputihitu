'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight, Zap, Shield, Truck, RotateCcw, Star, ShoppingBag } from 'lucide-react';
import api from '@/lib/api';
import ProductCard, { Product } from '@/components/ProductCard';
import { SkeletonGrid } from '@/components/SkeletonCard';
import CountdownTimer from '@/components/CountdownTimer';
import { formatRupiah } from '@/lib/utils';

interface Banner  { id: number; title: string; image_url: string; link_url?: string; }
interface FlashProduct extends Product { flash_sale_end: string; }

export default function HomePage() {
  const [banners,    setBanners]    = useState<Banner[]>([]);
  const [featured,   setFeatured]   = useState<Product[]>([]);
  const [flashSale,  setFlashSale]  = useState<FlashProduct[]>([]);
  const [bannerIdx,  setBannerIdx]  = useState(0);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [b, f, fs] = await Promise.all([
          api.get('/banners'),
          api.get('/products/featured'),
          api.get('/products/flash-sale'),
        ]);
        setBanners(b.data.data);
        setFeatured(f.data.data);
        setFlashSale(fs.data.data);
      } catch {
        // silently fail with empty arrays
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Auto-slide banner
  useEffect(() => {
    if (banners.length <= 1) return;
    const t = setInterval(() => setBannerIdx(i => (i + 1) % banners.length), 4000);
    return () => clearInterval(t);
  }, [banners.length]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-12">

      {/* ── Hero Banner ─────────────────────────────────────── */}
      <section className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-primary-500 to-orange-400 h-56 sm:h-72 md:h-96">
        {banners.length > 0 ? (
          <>
            {banners.map((b, i) => (
              <Link key={b.id} href={b.link_url || '/catalog'}
                className={`absolute inset-0 transition-opacity duration-700 ${i === bannerIdx ? 'opacity-100' : 'opacity-0'}`}>
                <Image src={b.image_url} alt={b.title} fill className="object-cover" priority={i === 0} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                <h2 className="absolute bottom-6 left-6 text-white font-bold text-xl sm:text-3xl drop-shadow">
                  {b.title}
                </h2>
              </Link>
            ))}
            {/* Dots */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {banners.map((_, i) => (
                <button key={i} onClick={() => setBannerIdx(i)}
                  className={`w-2 h-2 rounded-full transition-all ${i === bannerIdx ? 'bg-white w-6' : 'bg-white/50'}`} />
              ))}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-white px-6 text-center">
            <h1 className="text-3xl sm:text-4xl font-black mb-3">Selamat Datang di Seputihitu!</h1>
            <p className="text-lg opacity-90 mb-5">Skincare terpercaya sejak 2020 dengan produk pilihan untuk membantu merawat dan mencerahkan kulit.</p>
            <Link href="/catalog" className="bg-white text-primary-600 font-bold px-6 py-3 rounded-xl hover:bg-orange-50 transition-colors">
              Mulai Belanja
            </Link>
          </div>
        )}
      </section>

      {/* ── Trust Badges ────────────────────────────────────── */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { icon: <Truck className="text-primary-500" size={20} />, title: 'Gratis Ongkir', desc: 'Min. pembelian Rp200rb' },
          { icon: <Shield className="text-primary-500" size={20} />, title: 'Belanja Aman', desc: 'Pembayaran terenkripsi' },
          { icon: <Zap className="text-primary-500" size={20} />, title: 'Pengiriman Cepat', desc: 'Sampai dalam 1-3 hari' },
          { icon: <RotateCcw className="text-primary-500" size={20} />, title: 'Mudah Return', desc: 'Garansi 7 hari' },
        ].map(({ icon, title, desc }) => (
          <div key={title} className="card p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary-50 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">{icon}</div>
            <div className="min-w-0">
              <p className="font-semibold text-xs sm:text-sm text-gray-800 truncate">{title}</p>
              <p className="text-[10px] sm:text-xs text-gray-500 truncate">{desc}</p>
            </div>
          </div>
        ))}
      </section>

      {/* ── Flash Sale ──────────────────────────────────────── */}
      {(loading || flashSale.length > 0) && (
        <section>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <Zap size={22} className="text-yellow-500 fill-yellow-400" />
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">Flash Sale</h2>
              </div>
              {flashSale[0]?.flash_sale_end && (
                <CountdownTimer endTime={flashSale[0].flash_sale_end} />
              )}
            </div>
            <Link href="/catalog?flash_sale=true" className="text-primary-500 text-sm font-medium flex items-center gap-1 hover:gap-2 transition-all">
              Lihat Semua <ChevronRight size={16} />
            </Link>
          </div>
          {loading
            ? <SkeletonGrid count={4} />
            : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {flashSale.slice(0, 8).map(p => <ProductCard key={p.id} product={p} />)}
              </div>
            )
          }
        </section>
      )}

      {/* ── Produk Unggulan ─────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-gray-900">Produk Unggulan</h2>
          <Link href="/catalog?featured=true" className="text-primary-500 text-sm font-medium flex items-center gap-1 hover:gap-2 transition-all">
            Lihat Semua <ChevronRight size={16} />
          </Link>
        </div>
        {loading
          ? <SkeletonGrid count={8} />
          : featured.length > 0
            ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {featured.map(p => <ProductCard key={p.id} product={p} />)}
              </div>
            )
            : (
              <div className="text-center py-16 text-gray-400">
                <ShoppingBag size={48} className="mx-auto mb-3 opacity-30" />
                <p>Produk unggulan belum tersedia</p>
              </div>
            )
        }
      </section>

      {/* ── Testimoni ───────────────────────────────────────── */}
      <section className="bg-white rounded-2xl p-4 sm:p-6 md:p-8 border border-gray-100">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 text-center mb-6 sm:mb-8">Apa Kata Pelanggan Kami</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          {[
            { name: 'R***za', rating: 5, comment: 'Sudah pembelian k3 dan cuma vitamin seputih itu yg ada perubahan dbadan ku klo kena cahaya matahari bener2 agak putih dan bersih trus kulit brasa halus pakai handbody apa aja jd ga dempul karna lembut akan beli trus sampe kulitku kaya ownernya hehe' },
            { name: 'M***ch', rating: 5, comment: 'pemakaian pertama kelihatan hasilnya walau perubahan sedikit, tapi saya coba untuk terus konsumsi lagi secara rutin supaya hasil lebih memuaskan' },
            { name: 'S***at.', rating: 5, comment: 'Paketanya vitamin yang sdh nyampe ya,, sdh jd langganan brp bulan ini,,,respon penjualnya baik mudah mudahan dpt lgi isi yg 30 dpt free 30 jadi 60 kapsul lbh murah ,,, yang sering aja kakak owner yg cantik' },
          ].map(({ name, rating, comment }) => (
            <div key={name} className="bg-gray-50 rounded-xl p-5">
              <div className="flex mb-3">
                {Array.from({ length: rating }).map((_, i) => (
                  <Star key={i} size={14} className="text-yellow-400 fill-yellow-400" />
                ))}
              </div>
              <p className="text-sm text-gray-600 italic mb-4">"{comment}"</p>
              <p className="font-semibold text-sm text-gray-800">{name}</p>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
