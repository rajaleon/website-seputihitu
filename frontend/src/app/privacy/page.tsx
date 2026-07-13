'use client';

import { Shield } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="text-center mb-10">
        <div className="w-14 h-14 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Shield size={28} className="text-primary-600" />
        </div>
        <h1 className="text-3xl font-black text-gray-900 mb-2">Kebijakan Privasi</h1>
        <p className="text-gray-500 text-sm">Terakhir diperbarui: Juli 2026</p>
      </div>

      <div className="card p-8">
        <div className="prose prose-sm max-w-none text-gray-600 leading-relaxed space-y-6">

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">1. Informasi yang Kami Kumpulkan</h2>
            <p>Saat Anda menggunakan layanan Seputihitu, kami mengumpulkan informasi berikut:</p>
            <ul className="list-disc ml-5 space-y-1.5 mt-2">
              <li><strong>Data Pribadi:</strong> Nama lengkap, alamat email, nomor telepon, dan alamat pengiriman yang Anda berikan saat mendaftar atau melakukan pembelian.</li>
              <li><strong>Data Transaksi:</strong> Riwayat pembelian, metode pembayaran yang digunakan, dan status pesanan.</li>
              <li><strong>Data Teknis:</strong> Alamat IP, jenis browser, perangkat yang digunakan, dan cookies untuk meningkatkan pengalaman pengguna.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">2. Penggunaan Informasi</h2>
            <p>Informasi yang kami kumpulkan digunakan untuk:</p>
            <ul className="list-disc ml-5 space-y-1.5 mt-2">
              <li>Memproses dan mengirimkan pesanan Anda</li>
              <li>Mengirimkan notifikasi terkait status pesanan</li>
              <li>Meningkatkan layanan dan pengalaman belanja</li>
              <li>Mengirimkan informasi promosi (dengan persetujuan Anda)</li>
              <li>Mencegah penipuan dan menjaga keamanan platform</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">3. Perlindungan Data</h2>
            <p>
              Kami menerapkan langkah-langkah keamanan yang sesuai untuk melindungi data pribadi Anda, termasuk:
            </p>
            <ul className="list-disc ml-5 space-y-1.5 mt-2">
              <li>Enkripsi SSL/TLS untuk semua transmisi data</li>
              <li>Penyimpanan password dengan hashing (bcrypt)</li>
              <li>Akses terbatas ke data pribadi hanya untuk karyawan yang membutuhkan</li>
              <li>Monitoring keamanan sistem secara berkala</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">4. Pembagian Data ke Pihak Ketiga</h2>
            <p>Kami hanya membagikan data Anda kepada pihak ketiga dalam kondisi berikut:</p>
            <ul className="list-disc ml-5 space-y-1.5 mt-2">
              <li><strong>Jasa Pengiriman:</strong> Nama, alamat, dan nomor telepon untuk keperluan pengiriman paket.</li>
              <li><strong>Payment Gateway:</strong> Data transaksi diproses oleh Midtrans yang memiliki sertifikasi PCI DSS.</li>
              <li><strong>Kewajiban Hukum:</strong> Jika diwajibkan oleh peraturan perundang-undangan yang berlaku.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">5. Cookies</h2>
            <p>
              Website kami menggunakan cookies untuk menyimpan preferensi Anda, keranjang belanja, 
              dan data sesi login. Anda dapat mengatur penggunaan cookies melalui pengaturan browser Anda.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">6. Hak Pengguna</h2>
            <p>Anda memiliki hak untuk:</p>
            <ul className="list-disc ml-5 space-y-1.5 mt-2">
              <li>Mengakses dan memperbarui data pribadi Anda</li>
              <li>Meminta penghapusan akun dan data pribadi</li>
              <li>Menolak pengiriman email promosi</li>
              <li>Mengajukan keluhan terkait penggunaan data</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">7. Kontak</h2>
            <p>
              Jika Anda memiliki pertanyaan terkait kebijakan privasi ini, silakan hubungi kami melalui email 
              di <a href="mailto:cs@seputihitu.com" className="text-primary-500 hover:underline">cs@seputihitu.com</a> atau 
              WhatsApp di <a href="https://wa.me/62818061455844" className="text-primary-500 hover:underline">0818-0614-5844</a>.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
