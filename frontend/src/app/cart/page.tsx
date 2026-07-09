'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Trash2, ShoppingBag, Tag, ArrowRight } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { formatRupiah } from '@/lib/utils';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function CartPage() {
  const router              = useRouter();
  const { user }            = useAuthStore();
  const { items, subtotal, fetchCart, updateItem, removeItem } = useCartStore();
  const [voucher, setVoucher] = useState('');
  const [discount, setDiscount] = useState(0);
  const [voucherId, setVoucherId] = useState<number | null>(null);
  const [loadingVoucher, setLoadingVoucher] = useState(false);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    fetchCart();
  }, [user, router, fetchCart]);

  async function applyVoucher() {
    if (!voucher.trim()) return;
    setLoadingVoucher(true);
    try {
      const { data } = await api.post('/cart/apply-voucher', { code: voucher });
      setDiscount(data.data.discount);
      setVoucherId(data.data.voucher_id);
      toast.success(`Voucher berhasil! Hemat ${formatRupiah(data.data.discount)}`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Voucher tidak valid');
    } finally {
      setLoadingVoucher(false);
    }
  }

  const selectedItems = items.filter(i => i.is_selected);
  const total = subtotal - discount;

  function handleCheckout() {
    if (selectedItems.length === 0) { toast.error('Pilih item yang ingin di-checkout'); return; }
    const q = new URLSearchParams();
    if (voucherId) q.set('voucher_id', String(voucherId));
    router.push(`/checkout?${q.toString()}`);
  }

  if (!user) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Keranjang Belanja</h1>

      {items.length === 0 ? (
        <div className="text-center py-20">
          <ShoppingBag size={64} className="mx-auto mb-4 text-gray-200" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Keranjangmu kosong</h3>
          <p className="text-gray-400 text-sm mb-6">Yuk, mulai belanja produk favorit kamu!</p>
          <Link href="/catalog" className="btn-primary">Mulai Belanja</Link>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6">
          {/* ── Cart Items ────────────────────────────── */}
          <div className="flex-1 space-y-3">
            {/* Select All */}
            <div className="card p-4 flex items-center gap-3">
              <input type="checkbox"
                checked={selectedItems.length === items.length && items.length > 0}
                onChange={e => items.forEach(i => updateItem(i.id, undefined, e.target.checked))}
                className="w-4 h-4 accent-primary-500 cursor-pointer" />
              <span className="text-sm font-medium text-gray-700">
                Pilih Semua ({items.length} item)
              </span>
            </div>

            {items.map(item => (
              <div key={item.id} className="card p-4 flex gap-4">
                <input type="checkbox" checked={item.is_selected}
                  onChange={e => updateItem(item.id, undefined, e.target.checked)}
                  className="w-4 h-4 mt-1 accent-primary-500 cursor-pointer flex-shrink-0" />

                <Link href={`/products/${item.slug}`}
                  className="w-20 h-20 flex-shrink-0 bg-gray-100 rounded-xl overflow-hidden">
                  {item.thumbnail_url
                    ? <Image src={item.thumbnail_url} alt={item.name} width={80} height={80} className="object-cover w-full h-full" />
                    : <div className="w-full h-full flex items-center justify-center text-gray-300"><ShoppingBag size={24} /></div>
                  }
                </Link>

                <div className="flex-1 min-w-0">
                  <Link href={`/products/${item.slug}`}
                    className="text-sm font-semibold text-gray-800 hover:text-primary-600 line-clamp-2 leading-snug">
                    {item.name}
                  </Link>
                  {item.variant_name && (
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full mt-1 inline-block">
                      {item.variant_name}
                    </span>
                  )}
                  <div className="flex items-center justify-between mt-3">
                    <span className="font-bold text-primary-600">{formatRupiah(item.price_snapshot)}</span>
                    <div className="flex items-center gap-3">
                      {/* Qty */}
                      <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                        <button onClick={() => item.qty > 1 ? updateItem(item.id, item.qty - 1) : removeItem(item.id)}
                          className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 text-gray-600 font-bold text-sm">
                          −
                        </button>
                        <span className="w-9 text-center text-sm font-medium">{item.qty}</span>
                        <button onClick={() => updateItem(item.id, item.qty + 1)}
                          disabled={item.qty >= item.stock}
                          className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 text-gray-600 font-bold text-sm disabled:opacity-40">
                          +
                        </button>
                      </div>
                      {/* Delete */}
                      <button onClick={() => removeItem(item.id)}
                        className="text-red-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Subtotal: <span className="font-semibold text-gray-700">{formatRupiah(item.price_snapshot * item.qty)}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* ── Order Summary ─────────────────────────── */}
          <div className="lg:w-80 space-y-4">
            {/* Voucher */}
            <div className="card p-4">
              <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Tag size={16} className="text-primary-500" /> Kode Voucher
              </p>
              <div className="flex gap-2">
                <input type="text" placeholder="Masukkan kode" value={voucher}
                  onChange={e => setVoucher(e.target.value.toUpperCase())}
                  className="input-field py-2 text-sm flex-1" />
                <button onClick={applyVoucher} disabled={loadingVoucher}
                  className="btn-primary text-sm px-4 py-2">
                  {loadingVoucher ? '...' : 'Pakai'}
                </button>
              </div>
              {discount > 0 && (
                <p className="text-green-600 text-xs mt-2 font-medium">
                  ✓ Hemat {formatRupiah(discount)}
                </p>
              )}
            </div>

            {/* Summary */}
            <div className="card p-4 space-y-3">
              <h3 className="font-semibold text-gray-900">Ringkasan Belanja</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal ({selectedItems.length} item)</span>
                  <span>{formatRupiah(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Diskon Voucher</span>
                    <span>-{formatRupiah(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Ongkos kirim</span>
                  <span>Dihitung saat checkout</span>
                </div>
              </div>
              <div className="border-t pt-3 flex justify-between font-bold text-gray-900">
                <span>Total</span>
                <span className="text-primary-600">{formatRupiah(total)}</span>
              </div>
              <button onClick={handleCheckout}
                className="btn-primary w-full flex items-center justify-center gap-2">
                Checkout ({selectedItems.length} item)
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
