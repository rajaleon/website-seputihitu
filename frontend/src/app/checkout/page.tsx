'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MapPin, Truck, Plus, CreditCard } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { formatRupiah } from '@/lib/utils';
import toast from 'react-hot-toast';

interface Address {
  id: string; recipient_name: string; phone: string;
  full_address: string; city: string; province: string;
  postal_code: string; is_primary: boolean;
}
interface CourierRate {
  courier_code: string; courier_name: string;
  service_code: string; service_name: string;
  price: number; min_day: number; max_day: number;
}

function CheckoutContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const { user }     = useAuthStore();
  const { items, subtotal, fetchCart } = useCartStore();
  const voucherId    = searchParams.get('voucher_id');

  const [addresses,       setAddresses]       = useState<Address[]>([]);
  const [selectedAddr,    setSelectedAddr]    = useState('');
  const [couriers,        setCouriers]        = useState<CourierRate[]>([]);
  const [selectedCourier, setSelectedCourier] = useState<CourierRate | null>(null);
  const [notes,           setNotes]           = useState('');
  const [loadingRates,    setLoadingRates]    = useState(false);
  const [placingOrder,    setPlacingOrder]    = useState(false);
  const [showAddrForm,    setShowAddrForm]    = useState(false);
  const [newAddr, setNewAddr] = useState({
    recipient_name: '', phone: '', full_address: '',
    postal_code: '', city: '', province: '', is_primary: false,
  });

  const selectedItems = items.filter(i => i.is_selected);
  const shippingCost  = selectedCourier?.price ?? 0;
  const total         = subtotal + shippingCost;

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    fetchCart();
    api.get('/addresses').then(r => {
      setAddresses(r.data.data);
      const primary = r.data.data.find((a: Address) => a.is_primary);
      if (primary) setSelectedAddr(primary.id);
    }).catch(() => {});
  }, [user, router, fetchCart]);

  useEffect(() => {
    if (!selectedAddr || selectedItems.length === 0) return;
    const addr = addresses.find(a => a.id === selectedAddr);
    if (!addr) return;
    setLoadingRates(true);
    setCouriers([]);
    setSelectedCourier(null);
    api.post('/shipping/estimate', {
      destination_postal_code: addr.postal_code,
      destination_city_name:   addr.city,
      items: selectedItems.map(i => ({
        name: i.name, value: Number(i.price_snapshot), weight: 500, qty: i.qty,
      })),
    }).then(r => setCouriers(r.data.data || []))
      .catch(() => toast.error('Gagal mengambil data ongkir'))
      .finally(() => setLoadingRates(false));
  }, [selectedAddr, addresses]);

  async function saveAddress() {
    const { recipient_name, phone, full_address, postal_code, city, province } = newAddr;
    if (!recipient_name || !phone || !full_address || !postal_code || !city || !province) {
      toast.error('Semua field alamat wajib diisi'); return;
    }
    try {
      const { data } = await api.post('/addresses', newAddr);
      const list = await api.get('/addresses');
      setAddresses(list.data.data);
      setSelectedAddr(data.id);
      setShowAddrForm(false);
      toast.success('Alamat disimpan');
    } catch { toast.error('Gagal menyimpan alamat'); }
  }

  async function placeOrder() {
    if (!selectedAddr)    { toast.error('Pilih alamat pengiriman'); return; }
    if (!selectedCourier) { toast.error('Pilih kurir pengiriman'); return; }
    if (selectedItems.length === 0) { toast.error('Keranjang kosong'); return; }
    setPlacingOrder(true);
    try {
      const { data } = await api.post('/orders', {
        address_id:      selectedAddr,
        courier_service: `${selectedCourier.courier_code}-${selectedCourier.service_code}`,
        shipping_cost:   selectedCourier.price,
        voucher_id:      voucherId ? Number(voucherId) : undefined,
        notes,
        idempotency_key: `${user!.id}-${Date.now()}`,
      });
      // Get Snap token
      const payRes = await api.post('/payment/token', { order_id: data.order_id });
      const { snap_token, client_key } = payRes.data;
      if (typeof window !== 'undefined') {
        const isProduction = process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === 'true';
        const snapUrl = isProduction
          ? 'https://app.midtrans.com/snap/snap.js'
          : 'https://app.sandbox.midtrans.com/snap/snap.js';
        const script = document.createElement('script');
        script.src   = snapUrl;
        script.setAttribute('data-client-key', client_key);
        script.onload = () => {
          (window as any).snap.pay(snap_token, {
            onSuccess: () => router.push(`/thank-you/${data.order_number}`),
            onPending: () => router.push(`/thank-you/${data.order_number}?status=pending`),
            onError:   () => toast.error('Pembayaran gagal'),
            onClose:   () => toast('Pembayaran dibatalkan'),
          });
        };
        document.head.appendChild(script);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal membuat pesanan');
    } finally {
      setPlacingOrder(false);
    }
  }

  if (!user) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Checkout</h1>
      <div className="flex flex-col lg:flex-row gap-6">

        {/* ── Kiri ── */}
        <div className="flex-1 space-y-5">
          {/* Alamat */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <MapPin size={18} className="text-primary-500" /> Alamat Pengiriman
              </h2>
              <button onClick={() => setShowAddrForm(!showAddrForm)}
                className="text-primary-500 text-sm font-medium flex items-center gap-1 hover:underline">
                <Plus size={14} /> Tambah
              </button>
            </div>
            {showAddrForm && (
              <div className="bg-gray-50 rounded-xl p-4 mb-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { key: 'recipient_name', label: 'Nama Penerima', placeholder: 'Nama lengkap' },
                    { key: 'phone',          label: 'No. Telepon',   placeholder: '08xxxxxxxxxx' },
                    { key: 'city',           label: 'Kota',          placeholder: 'Jakarta' },
                    { key: 'province',       label: 'Provinsi',      placeholder: 'DKI Jakarta' },
                    { key: 'postal_code',    label: 'Kode Pos',      placeholder: '10110' },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="text-xs font-medium text-gray-600 block mb-1">{f.label}</label>
                      <input type="text" placeholder={f.placeholder}
                        value={(newAddr as any)[f.key]}
                        onChange={e => setNewAddr(a => ({ ...a, [f.key]: e.target.value }))}
                        className="input-field py-2 text-sm" />
                    </div>
                  ))}
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Alamat Lengkap</label>
                  <textarea rows={2} placeholder="Nama jalan, RT/RW, kelurahan..."
                    value={newAddr.full_address}
                    onChange={e => setNewAddr(a => ({ ...a, full_address: e.target.value }))}
                    className="input-field text-sm resize-none" />
                </div>
                <div className="flex gap-2">
                  <button onClick={saveAddress} className="btn-primary text-sm py-2">Simpan</button>
                  <button onClick={() => setShowAddrForm(false)} className="btn-ghost text-sm py-2">Batal</button>
                </div>
              </div>
            )}
            {addresses.length === 0 ? (
              <p className="text-sm text-gray-400">Belum ada alamat. Tambah alamat baru.</p>
            ) : (
              <div className="space-y-3">
                {addresses.map(a => (
                  <label key={a.id} className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors
                    ${selectedAddr === a.id ? 'border-primary-500 bg-primary-50' : 'border-gray-100 hover:border-gray-200'}`}>
                    <input type="radio" name="address" value={a.id} checked={selectedAddr === a.id}
                      onChange={() => setSelectedAddr(a.id)} className="mt-1 accent-primary-500" />
                    <div className="text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-800">{a.recipient_name}</span>
                        <span className="text-gray-400">·</span>
                        <span className="text-gray-600">{a.phone}</span>
                        {a.is_primary && <span className="text-xs bg-primary-100 text-primary-600 px-2 py-0.5 rounded-full font-medium">Utama</span>}
                      </div>
                      <p className="text-gray-600 mt-1">{a.full_address}</p>
                      <p className="text-gray-500">{a.city}, {a.province} {a.postal_code}</p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Kurir */}
          <div className="card p-5">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
              <Truck size={18} className="text-primary-500" /> Pilih Kurir
            </h2>
            {!selectedAddr ? (
              <p className="text-sm text-gray-400">Pilih alamat pengiriman terlebih dahulu.</p>
            ) : loadingRates ? (
              <div className="space-y-3">
                {[1,2,3].map(i => <div key={i} className="skeleton h-16 rounded-xl" />)}
              </div>
            ) : couriers.length === 0 ? (
              <p className="text-sm text-gray-400">Tidak ada layanan pengiriman tersedia.</p>
            ) : (
              <div className="space-y-2">
                {couriers.map((c, i) => {
                  const isSelected = selectedCourier?.courier_code === c.courier_code && selectedCourier?.service_code === c.service_code;
                  return (
                    <label key={i} className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors
                      ${isSelected ? 'border-primary-500 bg-primary-50' : 'border-gray-100 hover:border-gray-200'}`}>
                      <input type="radio" name="courier" checked={isSelected}
                        onChange={() => setSelectedCourier(c)} className="accent-primary-500" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-800">{c.courier_name} — {c.service_name}</p>
                        <p className="text-xs text-gray-500">{c.min_day}–{c.max_day} hari kerja</p>
                      </div>
                      <span className="font-bold text-gray-800 text-sm">{formatRupiah(c.price)}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* Catatan */}
          <div className="card p-5">
            <h2 className="font-semibold text-gray-900 mb-3">Catatan untuk Penjual</h2>
            <textarea rows={3} placeholder="Catatan opsional..."
              value={notes} onChange={e => setNotes(e.target.value)}
              className="input-field text-sm resize-none" />
          </div>
        </div>

        {/* ── Kanan ── */}
        <div className="lg:w-80">
          <div className="card p-5 space-y-4">
            <h2 className="font-semibold text-gray-900">Ringkasan Pesanan</h2>
            <div className="space-y-3 max-h-56 overflow-y-auto">
              {selectedItems.map(item => (
                <div key={item.id} className="flex gap-3 text-sm">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 line-clamp-1">{item.name}</p>
                    {item.variant_name && <p className="text-xs text-gray-400">{item.variant_name}</p>}
                    <p className="text-xs text-gray-500">x{item.qty}</p>
                  </div>
                  <span className="font-semibold text-gray-800 whitespace-nowrap">
                    {formatRupiah(item.price_snapshot * item.qty)}
                  </span>
                </div>
              ))}
            </div>
            <div className="border-t pt-3 space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>{formatRupiah(subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Ongkos Kirim</span>
                <span>{selectedCourier ? formatRupiah(shippingCost) : '—'}</span>
              </div>
            </div>
            <div className="border-t pt-3 flex justify-between font-bold text-gray-900">
              <span>Total Bayar</span>
              <span className="text-primary-600">{formatRupiah(total)}</span>
            </div>
            <button onClick={placeOrder} disabled={placingOrder || !selectedAddr || !selectedCourier}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-base">
              <CreditCard size={18} />
              {placingOrder ? 'Memproses...' : 'Bayar Sekarang'}
            </button>
            <p className="text-xs text-gray-400 text-center">
              Dengan melanjutkan, kamu menyetujui syarat & ketentuan kami.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="skeleton h-8 w-32 rounded mb-6" />
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 space-y-5">
            <div className="skeleton h-48 rounded-2xl" />
            <div className="skeleton h-48 rounded-2xl" />
          </div>
          <div className="lg:w-80"><div className="skeleton h-64 rounded-2xl" /></div>
        </div>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
