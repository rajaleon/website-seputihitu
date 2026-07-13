'use client';

import { FileText } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="text-center mb-10">
        <div className="w-14 h-14 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <FileText size={28} className="text-primary-600" />
        </div>
        <h1 className="text-3xl font-black text-gray-900 mb-2">Syarat & Ketentuan</h1>
        <p className="text-gray-500 text-sm">Terakhir diperbarui: Juli 2026</p>
      </div>

      <div className="card p-8">
        <div className="prose prose-sm max-w-none text-gray-600 leading-relaxed space-y-6">

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">1. Ketentuan Umum</h2>
            <ul className="list-disc ml-5 space-y-1.5">
              <li>Dengan mengakses dan menggunakan website Seputihitu, Anda menyetujui untuk terikat dengan syarat dan ketentuan ini.</li>
              <li>Seputihitu berhak mengubah syarat dan ketentuan ini sewaktu-waktu tanpa pemberitahuan terlebih dahulu.</li>
              <li>Pengguna wajib berusia minimal 17 tahun atau didampingi orang tua/wali.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">2. Akun Pengguna</h2>
            <ul className="list-disc ml-5 space-y-1.5">
              <li>Pengguna bertanggung jawab atas keamanan akun dan password masing-masing.</li>
              <li>Satu alamat email hanya dapat digunakan untuk satu akun.</li>
              <li>Seputihitu berhak menonaktifkan akun yang melanggar ketentuan atau melakukan aktivitas mencurigakan.</li>
              <li>Informasi yang diberikan saat pendaftaran harus akurat dan dapat dipertanggungjawabkan.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">3. Pemesanan & Pembayaran</h2>
            <ul className="list-disc ml-5 space-y-1.5">
              <li>Harga produk yang tertera sudah termasuk pajak (jika berlaku), belum termasuk ongkos kirim.</li>
              <li>Pesanan yang sudah dibayar tidak dapat dibatalkan kecuali dalam kondisi tertentu yang diatur dalam kebijakan pengembalian.</li>
              <li>Pembayaran harus dilakukan dalam waktu 24 jam setelah pesanan dibuat. Pesanan yang tidak dibayar akan otomatis dibatalkan.</li>
              <li>Metode pembayaran yang tersedia: Virtual Account (BCA, BNI, Mandiri, BRI), E-Wallet (GoPay, ShopeePay), QRIS, dan Kartu Kredit/Debit.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">4. Pengiriman</h2>
            <ul className="list-disc ml-5 space-y-1.5">
              <li>Pengiriman dilakukan melalui jasa kurir yang dipilih oleh pembeli saat checkout.</li>
              <li>Estimasi waktu pengiriman bersifat perkiraan dan dapat berbeda tergantung kondisi lapangan.</li>
              <li>Pembeli wajib mencantumkan alamat pengiriman yang lengkap dan benar.</li>
              <li>Seputihitu tidak bertanggung jawab atas keterlambatan yang disebabkan oleh pihak kurir atau force majeure.</li>
              <li>Konfirmasi penerimaan barang wajib dilakukan dalam waktu 7 hari setelah barang diterima.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">5. Pengembalian & Refund</h2>
            <ul className="list-disc ml-5 space-y-1.5">
              <li>Pengembalian barang dapat dilakukan dalam waktu <strong>7 hari</strong> setelah barang diterima.</li>
              <li>Barang yang dikembalikan harus dalam kondisi asli, belum digunakan, dan kemasan lengkap.</li>
              <li>Pengembalian dapat diajukan jika: barang rusak/cacat, barang tidak sesuai deskripsi, atau salah kirim.</li>
              <li>Proses refund membutuhkan waktu 3-7 hari kerja setelah pengembalian barang disetujui.</li>
              <li>Ongkos kirim pengembalian ditanggung oleh Seputihitu jika kesalahan berasal dari pihak kami.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">6. Produk & Stok</h2>
            <ul className="list-disc ml-5 space-y-1.5">
              <li>Ketersediaan stok bersifat real-time namun dapat berubah sewaktu-waktu.</li>
              <li>Foto produk merupakan representasi — warna asli dapat sedikit berbeda tergantung layar perangkat.</li>
              <li>Seputihitu berhak membatalkan pesanan jika terjadi kesalahan harga atau stok.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">7. Larangan</h2>
            <p>Pengguna dilarang untuk:</p>
            <ul className="list-disc ml-5 space-y-1.5 mt-2">
              <li>Menggunakan platform untuk aktivitas ilegal atau penipuan</li>
              <li>Menyebarkan informasi palsu atau menyesatkan</li>
              <li>Mengganggu sistem keamanan atau performa website</li>
              <li>Menyalahgunakan promosi, voucher, atau program loyalty</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">8. Batasan Tanggung Jawab</h2>
            <p>
              Seputihitu tidak bertanggung jawab atas kerugian tidak langsung yang timbul dari penggunaan layanan kami. 
              Tanggung jawab maksimal kami terbatas pada nilai pesanan yang bersangkutan.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">9. Hukum yang Berlaku</h2>
            <p>
              Syarat dan ketentuan ini diatur dan ditafsirkan berdasarkan hukum yang berlaku di Republik Indonesia. 
              Segala perselisihan akan diselesaikan secara musyawarah, dan jika tidak tercapai kesepakatan, 
              akan diselesaikan melalui Pengadilan Negeri Tangerang.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
