'use client';

import { useState } from 'react';
import { HelpCircle, ChevronDown } from 'lucide-react';

interface FaqItem { question: string; answer: string; }

const FAQ_DATA: { category: string; items: FaqItem[] }[] = [
  {
    category: 'Pemesanan',
    items: [
      { question: 'Bagaimana cara memesan produk?', answer: 'Pilih produk yang diinginkan, klik "Tambah ke Keranjang", lalu lanjut ke halaman Checkout. Pilih alamat pengiriman dan kurir, lalu selesaikan pembayaran.' },
      { question: 'Apakah bisa membatalkan pesanan?', answer: 'Pesanan dapat dibatalkan selama status masih "Menunggu Pembayaran". Setelah dibayar, pembatalan hanya bisa dilakukan dengan menghubungi customer service kami.' },
      { question: 'Berapa lama batas waktu pembayaran?', answer: 'Batas waktu pembayaran adalah 24 jam setelah pesanan dibuat. Jika tidak dibayar dalam waktu tersebut, pesanan akan otomatis dibatalkan.' },
    ],
  },
  {
    category: 'Pembayaran',
    items: [
      { question: 'Metode pembayaran apa saja yang tersedia?', answer: 'Kami menerima pembayaran via Virtual Account (BCA, BNI, Mandiri, BRI), E-Wallet (GoPay, ShopeePay), QRIS, dan Kartu Kredit/Debit.' },
      { question: 'Apakah pembayaran di Seputihitu aman?', answer: 'Ya, semua transaksi diproses melalui payment gateway Midtrans yang tersertifikasi PCI DSS. Data kartu kredit tidak disimpan di server kami.' },
      { question: 'Bagaimana jika pembayaran gagal?', answer: 'Anda bisa mencoba kembali dengan metode pembayaran lain. Jika saldo terpotong tapi pesanan belum terkonfirmasi, hubungi customer service.' },
    ],
  },
  {
    category: 'Pengiriman',
    items: [
      { question: 'Berapa lama estimasi pengiriman?', answer: 'Tergantung kurir dan lokasi tujuan. Umumnya 1-5 hari kerja untuk Jawa dan 3-7 hari kerja untuk luar Jawa.' },
      { question: 'Bagaimana cara melacak pesanan?', answer: 'Setelah pesanan dikirim, lihat status di halaman "Pesanan Saya". Nomor resi otomatis tersedia setelah kurir mengambil paket.' },
      { question: 'Apakah ada gratis ongkir?', answer: 'Kami secara berkala mengadakan promo gratis ongkir. Pantau halaman utama dan media sosial kami untuk info promo terbaru.' },
    ],
  },
  {
    category: 'Pengembalian & Refund',
    items: [
      { question: 'Bagaimana jika barang rusak?', answer: 'Laporkan ke customer service dalam 7 hari setelah diterima dengan foto bukti. Kami akan proses pengembalian atau penggantian.' },
      { question: 'Berapa lama proses refund?', answer: 'Proses refund membutuhkan 3-7 hari kerja setelah pengajuan disetujui. Dana dikembalikan ke metode pembayaran asal.' },
      { question: 'Apakah bisa tukar ukuran?', answer: 'Penukaran bisa dilakukan selama stok tersedia. Hubungi customer service untuk prosedur. Ongkir ditanggung pembeli kecuali kesalahan dari kami.' },
    ],
  },
];

function FaqAccordion({ item }: { item: FaqItem }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-4 text-left group">
        <span className="text-sm font-semibold text-gray-800 group-hover:text-primary-600 transition-colors pr-4">
          {item.question}
        </span>
        <ChevronDown size={16}
          className={`text-gray-400 flex-shrink-0 transition-transform ${open ? 'rotate-180 text-primary-500' : ''}`} />
      </button>
      {open && (
        <div className="pb-4 -mt-1">
          <p className="text-sm text-gray-600 leading-relaxed">{item.answer}</p>
        </div>
      )}
    </div>
  );
}

export default function FaqPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="text-center mb-10">
        <div className="w-14 h-14 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <HelpCircle size={28} className="text-primary-600" />
        </div>
        <h1 className="text-3xl font-black text-gray-900 mb-2">Frequently Asked Questions</h1>
        <p className="text-gray-500 text-sm">Temukan jawaban untuk pertanyaan yang sering diajukan</p>
      </div>
      <div className="space-y-6">
        {FAQ_DATA.map(({ category, items }) => (
          <div key={category} className="card p-6">
            <h2 className="font-bold text-gray-900 mb-3 text-base">{category}</h2>
            <div>{items.map((item, i) => <FaqAccordion key={i} item={item} />)}</div>
          </div>
        ))}
      </div>
      <div className="card p-6 mt-8 text-center bg-primary-50 border-primary-100">
        <h3 className="font-bold text-gray-900 mb-2">Masih punya pertanyaan?</h3>
        <p className="text-sm text-gray-600 mb-4">Tim kami siap membantu kapan saja.</p>
        <a href="https://wa.me/62818061455844" target="_blank" rel="noopener noreferrer"
          className="btn-primary inline-flex items-center gap-2 text-sm">Hubungi via WhatsApp</a>
      </div>
    </div>
  );
}
