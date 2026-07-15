'use client';

import { useState } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';

const ADMIN_PHONE = '6281387840944';

export default function WhatsAppFloat() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<'form' | 'ready'>('form');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;
    setStep('ready');
  }

  function openWhatsApp(message?: string) {
    const defaultMsg = `Halo Admin Seputihitu, saya ${name} (${phone}).\n\nSaya ingin bertanya:`;
    const text = encodeURIComponent(message || defaultMsg);
    window.open(`https://wa.me/${ADMIN_PHONE}?text=${text}`, '_blank');
  }

  function handleClose() {
    setOpen(false);
    setStep('form');
  }

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setOpen(!open)}
        className={`fixed bottom-5 right-5 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300
          ${open ? 'bg-gray-700 rotate-0' : 'bg-green-500 hover:bg-green-600 hover:scale-110'}`}
      >
        {open ? <X size={22} className="text-white" /> : <MessageCircle size={24} className="text-white" />}
      </button>

      {/* Chat Widget */}
      {open && (
        <div className="fixed bottom-24 right-5 z-50 w-80 sm:w-96 animate-in fade-in slide-in-from-bottom-4">
          <div className="card shadow-2xl overflow-hidden border border-gray-200">
            {/* Header */}
            <div className="bg-green-500 px-5 py-4 text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <MessageCircle size={20} />
                </div>
                <div>
                  <p className="font-semibold text-sm">Chat dengan Admin</p>
                  <p className="text-xs text-green-100">Biasanya membalas dalam beberapa menit</p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="p-5 bg-gray-50">
              {step === 'form' ? (
                <form onSubmit={handleSubmit} className="space-y-3">
                  <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
                    <p className="text-sm text-gray-600 mb-3">
                      Hai! 👋 Sebelum chat, isi data kamu dulu ya.
                    </p>
                    <div className="space-y-2.5">
                      <div>
                        <label className="text-xs font-medium text-gray-500 block mb-1">Nama</label>
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={e => setName(e.target.value)}
                          placeholder="Nama lengkap kamu"
                          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500 block mb-1">No. WhatsApp</label>
                        <input
                          type="tel"
                          required
                          value={phone}
                          onChange={e => setPhone(e.target.value)}
                          placeholder="08xxxxxxxxxx"
                          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors text-sm"
                  >
                    <Send size={16} /> Lanjut ke WhatsApp
                  </button>
                </form>
              ) : (
                <div className="space-y-3">
                  <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
                    <p className="text-sm text-gray-600 mb-1">
                      Halo <strong>{name}</strong>! 👋
                    </p>
                    <p className="text-sm text-gray-500">
                      Klik tombol di bawah untuk mulai chat dengan admin via WhatsApp.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <button
                      onClick={() => openWhatsApp(`Halo Admin Seputihitu, saya ${name} (${phone}).\n\nSaya ingin bertanya tentang produk.`)}
                      className="w-full bg-white border border-gray-200 hover:border-green-300 hover:bg-green-50 text-gray-700 font-medium py-2.5 px-4 rounded-xl text-sm text-left transition-colors"
                    >
                      💬 Tanya tentang produk
                    </button>
                    <button
                      onClick={() => openWhatsApp(`Halo Admin Seputihitu, saya ${name} (${phone}).\n\nSaya ingin bertanya tentang pesanan saya.`)}
                      className="w-full bg-white border border-gray-200 hover:border-green-300 hover:bg-green-50 text-gray-700 font-medium py-2.5 px-4 rounded-xl text-sm text-left transition-colors"
                    >
                      📦 Tanya tentang pesanan
                    </button>
                    <button
                      onClick={() => openWhatsApp(`Halo Admin Seputihitu, saya ${name} (${phone}).\n\nSaya butuh bantuan.`)}
                      className="w-full bg-white border border-gray-200 hover:border-green-300 hover:bg-green-50 text-gray-700 font-medium py-2.5 px-4 rounded-xl text-sm text-left transition-colors"
                    >
                      🆘 Butuh bantuan lainnya
                    </button>
                  </div>

                  <button
                    onClick={() => openWhatsApp()}
                    className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors text-sm"
                  >
                    <MessageCircle size={16} /> Chat Langsung via WhatsApp
                  </button>

                  <button
                    onClick={() => setStep('form')}
                    className="w-full text-xs text-gray-400 hover:text-gray-600 py-1"
                  >
                    Ganti data
                  </button>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-2.5 bg-white border-t border-gray-100 text-center">
              <p className="text-xs text-gray-400">Powered by WhatsApp</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
