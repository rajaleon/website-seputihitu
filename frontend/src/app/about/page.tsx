'use client';

import { Store, Users, Heart, Truck, Shield, Award } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* Hero */}
      <div className="text-center mb-12">
        <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Store size={32} className="text-primary-600" />
        </div>
        <h1 className="text-3xl font-black text-gray-900 mb-3">Tentang Seputihitu</h1>
        <p className="text-gray-500 max-w-2xl mx-auto leading-relaxed">
          Seputihitu adalah platform belanja online yang menghadirkan produk-produk berkualitas 
          dengan harga terjangkau untuk masyarakat Indonesia.
        </p>
      </div>

      {/* Story */}
      <div className="card p-8 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Cerita Kami</h2>
        <div className="text-gray-600 leading-relaxed space-y-4 text-sm">
          <p>
            Berawal dari keinginan untuk memberikan pengalaman belanja online yang mudah, aman, dan menyenangkan, 
            Seputihitu hadir sebagai solusi bagi masyarakat yang mencari produk berkualitas tanpa harus 
            mengeluarkan biaya lebih.
          </p>
          <p>
            Kami percaya bahwa setiap orang berhak mendapatkan produk terbaik. Dengan menjalin kerjasama 
            langsung dengan brand dan supplier terpercaya, kami mampu menghadirkan harga yang kompetitif 
            tanpa mengorbankan kualitas.
          </p>
          <p>
            Berlokasi di Tangerang, Banten, kami melayani pengiriman ke seluruh Indonesia dengan berbagai 
            pilihan kurir yang cepat dan terpercaya. Tim kami berkomitmen untuk memberikan pelayanan terbaik 
            di setiap transaksi.
          </p>
        </div>
      </div>

      {/* Values */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {[
          { icon: <Heart size={24} />, title: 'Kepuasan Pelanggan', desc: 'Prioritas utama kami adalah kepuasan dan kenyamanan setiap pelanggan.' },
          { icon: <Shield size={24} />, title: 'Transaksi Aman', desc: 'Pembayaran terenkripsi dan data pribadi terlindungi dengan baik.' },
          { icon: <Award size={24} />, title: 'Produk Berkualitas', desc: 'Setiap produk dipilih dan dikurasi untuk menjamin kualitas terbaik.' },
          { icon: <Truck size={24} />, title: 'Pengiriman Cepat', desc: 'Kerjasama dengan kurir terpercaya untuk pengiriman tepat waktu.' },
          { icon: <Users size={24} />, title: 'Tim Profesional', desc: 'Customer service responsif dan siap membantu kapan saja.' },
          { icon: <Store size={24} />, title: 'Harga Terjangkau', desc: 'Kerjasama langsung dengan supplier untuk harga terbaik.' },
        ].map(({ icon, title, desc }) => (
          <div key={title} className="card p-5">
            <div className="w-11 h-11 bg-primary-50 rounded-xl flex items-center justify-center text-primary-500 mb-3">
              {icon}
            </div>
            <h3 className="font-semibold text-gray-900 mb-1.5 text-sm">{title}</h3>
            <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>

      {/* Contact Info */}
      <div className="card p-8 bg-primary-50 border-primary-100">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Hubungi Kami</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500 mb-1">Alamat</p>
            <p className="font-medium text-gray-800">RT.001/RW.002, Pakojan, Pinang, Kota Tangerang, Banten 15142</p>
          </div>
          <div>
            <p className="text-gray-500 mb-1">Telepon / WhatsApp</p>
            <p className="font-medium text-gray-800">0818-0614-5844</p>
          </div>
          <div>
            <p className="text-gray-500 mb-1">Email</p>
            <p className="font-medium text-gray-800">cs@seputihitu.com</p>
          </div>
          <div>
            <p className="text-gray-500 mb-1">Jam Operasional</p>
            <p className="font-medium text-gray-800">Senin - Sabtu, 09.00 - 18.00 WIB</p>
          </div>
        </div>
      </div>
    </div>
  );
}
