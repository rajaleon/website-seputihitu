'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  CreditCard, Smartphone, QrCode, Building2, Wallet,
  CheckCircle, Clock, Shield, ArrowLeft, Copy, Check
} from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { formatRupiah } from '@/lib/utils';
import toast from 'react-hot-toast';

type PaymentMethod = 'va_bca' | 'va_bni' | 'va_mandiri' | 'va_bri' | 'gopay' | 'shopeepay' | 'qris' | 'credit_card';

interface MethodOption {
  id: PaymentMethod;
  name: string;
  icon: React.ReactNode;
  category: string;
  description: string;
}

const PAYMENT_METHODS: MethodOption[] = [
  { id: 'qris', name: 'QRIS', icon: <QrCode size={22} />, category: 'qris', description: 'Scan QR dari aplikasi apapun' },
  { id: 'gopay', name: 'GoPay', icon: <Wallet size={22} />, category: 'ewallet', description: 'Bayar lewat GoPay' },
  { id: 'shopeepay', name: 'ShopeePay', icon: <Smartphone size={22} />, category: 'ewallet', description: 'Bayar lewat ShopeePay' },
  { id: 'va_bca', name: 'BCA Virtual Account', icon: <Building2 size={22} />, category: 'va', description: 'Transfer ke VA BCA' },
  { id: 'va_bni', name: 'BNI Virtual Account', icon: <Building2 size={22} />, category: 'va', description: 'Transfer ke VA BNI' },
  { id: 'va_mandiri', name: 'Mandiri Virtual Account', icon: <Building2 size={22} />, category: 'va', description: 'Transfer ke VA Mandiri' },
  { id: 'va_bri', name: 'BRI Virtual Account', icon: <Building2 size={22} />, category: 'va', description: 'Transfer ke VA BRI' },
  { id: 'credit_card', name: 'Kartu Kredit / Debit', icon: <CreditCard size={22} />, category: 'card', description: 'Visa, Mastercard, JCB' },
];

const CATEGORIES = [
  { id: 'qris', label: 'QRIS' },
  { id: 'ewallet', label: 'E-Wallet' },
  { id: 'va', label: 'Virtual Account' },
  { id: 'card', label: 'Kartu' },
];

export default function PaymentPage() {
  const { order_number } = useParams<{ order_number: string }>();
  const router = useRouter();
  const { user } = useAuthStore();

  const [order,          setOrder]          = useState<any>(null);
  const [loading,        setLoading]        = useState(true);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [activeCategory, setActiveCategory] = useState('qris');
  const [processing,     setProcessing]     = useState(false);
  const [paymentDone,    setPaymentDone]    = useState(false);
  const [vaNumber,       setVaNumber]       = useState('');
  const [copied,         setCopied]         = useState(false);
  const [countdown,      setCountdown]      = useState(0);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    api.get(`/orders/${order_number}`)
      .then(r => setOrder(r.data.data))
      .catch(() => { toast.error('Order tidak ditemukan'); router.push('/orders'); })
      .finally(() => setLoading(false));
  }, [user, order_number, router]);

  // Countdown timer for payment simulation
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setInterval(() => setCountdown(c => c - 1), 1000);
    return () => clearInterval(t);
  }, [countdown]);

  useEffect(() => {
    if (countdown === 0 && processing) {
      // Payment berhasil — buat shipment di BiteShip
      createShipment();
    }
  }, [countdown, processing]);

  async function createShipment() {
    try {
      await api.post('/shipping/create', { order_id: order?.id });
    } catch {
      // Non-blocking — shipment bisa dibuat manual nanti dari admin
      console.log('Shipment creation skipped (demo or API error)');
    }
    setPaymentDone(true);
    setProcessing(false);
  }

  async function handlePay() {
    if (!selectedMethod) { toast.error('Pilih metode pembayaran'); return; }
    setProcessing(true);

    // Generate fake VA number for demo
    if (selectedMethod.startsWith('va_')) {
      const bank = selectedMethod.replace('va_', '').toUpperCase();
      setVaNumber(`${bank} 8800 1234 5678 ${Math.floor(Math.random() * 9000) + 1000}`);
    }

    // Simulate payment processing (3 seconds)
    setCountdown(3);
  }

  function handleCopyVA() {
    navigator.clipboard.writeText(vaNumber.replace(/\s/g, ''));
    setCopied(true);
    toast.success('Nomor VA disalin');
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDone() {
    router.push(`/thank-you/${order_number}`);
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="space-y-4">
          <div className="skeleton h-8 w-48 rounded" />
          <div className="skeleton h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!order) return null;

  // ── Payment Success Screen ─────────────────────────────
  if (paymentDone) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12">
        <div className="text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
            <CheckCircle size={40} className="text-green-500" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 mb-2">Pembayaran Berhasil!</h1>
          <p className="text-gray-500 mb-2">Order #{order.order_number}</p>
          <p className="text-3xl font-black text-primary-600 mb-8">{formatRupiah(Number(order.total))}</p>

          <div className="bg-gray-50 rounded-2xl p-5 mb-6 text-sm text-left space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-500">Metode</span>
              <span className="font-medium text-gray-800">
                {PAYMENT_METHODS.find(m => m.id === selectedMethod)?.name}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Status</span>
              <span className="font-medium text-green-600">Lunas</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Waktu</span>
              <span className="font-medium text-gray-800">{new Date().toLocaleString('id-ID')}</span>
            </div>
          </div>

          <button onClick={handleDone} className="btn-primary w-full py-3.5 text-base">
            Lihat Detail Pesanan
          </button>
        </div>
      </div>
    );
  }

  // ── Processing Screen ───────────────────────────────────
  if (processing) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Memproses Pembayaran...</h2>
          <p className="text-gray-500 mb-6">Mohon tunggu, jangan tutup halaman ini.</p>

          {vaNumber && (
            <div className="bg-gray-50 rounded-2xl p-5 text-left mb-6">
              <p className="text-sm text-gray-500 mb-2">Nomor Virtual Account:</p>
              <div className="flex items-center justify-between bg-white border border-gray-200 rounded-xl p-4">
                <span className="font-mono font-bold text-lg text-gray-900">{vaNumber}</span>
                <button onClick={handleCopyVA} className="text-primary-500 hover:text-primary-700 p-1">
                  {copied ? <Check size={18} /> : <Copy size={18} />}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-2">Transfer sebelum 24 jam</p>
            </div>
          )}

          <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
            <Shield size={14} />
            <span>Transaksi dilindungi enkripsi SSL</span>
          </div>
        </div>
      </div>
    );
  }

  // ── Payment Method Selection ─────────────────────────────
  const filteredMethods = PAYMENT_METHODS.filter(m => m.category === activeCategory);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors">
          <ArrowLeft size={18} className="text-gray-600" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Pilih Metode Pembayaran</h1>
          <p className="text-sm text-gray-500">Order #{order.order_number}</p>
        </div>
      </div>

      {/* Total Card */}
      <div className="card p-5 mb-6 bg-gradient-to-br from-primary-500 to-pink-600 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm opacity-80 mb-1">Total Pembayaran</p>
            <p className="text-2xl font-black">{formatRupiah(Number(order.total))}</p>
          </div>
          <div className="flex items-center gap-2 bg-white/20 rounded-xl px-3 py-1.5">
            <Clock size={14} />
            <span className="text-sm font-medium">24:00:00</span>
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-2xl p-1.5 mb-5">
        {CATEGORIES.map(cat => (
          <button key={cat.id} onClick={() => { setActiveCategory(cat.id); setSelectedMethod(null); }}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all
              ${activeCategory === cat.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'}`}>
            {cat.label}
          </button>
        ))}
      </div>

      {/* Methods List */}
      <div className="space-y-2 mb-6">
        {filteredMethods.map(method => (
          <button key={method.id}
            onClick={() => setSelectedMethod(method.id)}
            className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left
              ${selectedMethod === method.id
                ? 'border-primary-500 bg-primary-50 shadow-sm'
                : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm'}`}>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0
              ${selectedMethod === method.id ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-500'}`}>
              {method.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 text-sm">{method.name}</p>
              <p className="text-xs text-gray-500">{method.description}</p>
            </div>
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0
              ${selectedMethod === method.id ? 'border-primary-500 bg-primary-500' : 'border-gray-300'}`}>
              {selectedMethod === method.id && (
                <div className="w-2 h-2 bg-white rounded-full" />
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Pay Button */}
      <div className="sticky bottom-4">
        <button onClick={handlePay} disabled={!selectedMethod || processing}
          className="btn-primary w-full py-4 text-base flex items-center justify-center gap-2 shadow-lg shadow-primary-500/30">
          <Shield size={18} />
          Bayar {formatRupiah(Number(order.total))}
        </button>
        <div className="flex items-center justify-center gap-3 mt-3 text-xs text-gray-400">
          <span>🔒 Secure Payment</span>
          <span>·</span>
          <span>Visa</span>
          <span>·</span>
          <span>Mastercard</span>
          <span>·</span>
          <span>QRIS</span>
        </div>
      </div>
    </div>
  );
}
