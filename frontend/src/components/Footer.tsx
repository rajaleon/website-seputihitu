import Link from 'next/link';
import { MapPin, Phone, Mail, Instagram, Facebook } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-16">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <div className="mb-4">
              <img src="/images/logo.png" alt="Seputih.itu" className="h-9 w-auto brightness-0 invert" />
            </div>
            <p className="text-sm leading-relaxed text-gray-400">
              Seputih.itu Menghadirkan skincare berkualitas untuk menemani perjalanan kulitmu sejak 2020.
            </p>
            <div className="flex gap-3 mt-4">
              <a href="#" className="w-9 h-9 bg-gray-800 hover:bg-primary-500 rounded-lg flex items-center justify-center transition-colors">
                <Instagram size={16} />
              </a>
              <a href="#" className="w-9 h-9 bg-gray-800 hover:bg-primary-500 rounded-lg flex items-center justify-center transition-colors">
                <Facebook size={16} />
              </a>
            </div>
          </div>

          {/* Layanan */}
          <div>
            <h3 className="text-white font-semibold mb-4">Layanan</h3>
            <ul className="space-y-2.5 text-sm">
              {[
                { href: '/catalog', label: 'Katalog Produk' },
                { href: '/cart', label: 'Keranjang' },
                { href: '/orders', label: 'Lacak Pesanan' },
              ].map(({ href, label }) => (
                <li key={href}><Link href={href} className="hover:text-primary-400 transition-colors">{label}</Link></li>
              ))}
            </ul>
          </div>

          {/* Info */}
          <div>
            <h3 className="text-white font-semibold mb-4">Informasi</h3>
            <ul className="space-y-2.5 text-sm">
              {[
                { href: '/about', label: 'Tentang Kami' },
                { href: '/privacy', label: 'Kebijakan Privasi' },
                { href: '/terms', label: 'Syarat & Ketentuan' },
                { href: '/faq', label: 'FAQ' },
              ].map(({ href, label }) => (
                <li key={href}><Link href={href} className="hover:text-primary-400 transition-colors">{label}</Link></li>
              ))}
            </ul>
          </div>

          {/* Kontak */}
          <div>
            <h3 className="text-white font-semibold mb-4">Kontak</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <MapPin size={16} className="mt-0.5 flex-shrink-0 text-primary-400" />
                <span>Jl. Ruko Estrella no 11, Kota Tangerang</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone size={16} className="flex-shrink-0 text-primary-400" />
                <a href="tel:+6281387840944" className="hover:text-primary-400 transition-colors">+62 813-8784-0944</a>
              </li>
              <li className="flex items-center gap-2">
                <Mail size={16} className="flex-shrink-0 text-primary-400" />
                <a href="mailto:cs@seputihitu.com" className="hover:text-primary-400 transition-colors">cs@seputihitu.com</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-sm text-gray-500">
          <span>© {new Date().getFullYear()} Seputihitu Store. All rights reserved.</span>
          <div className="flex items-center gap-2">
            <span className="text-xs">QRIS • VA • E-Wallet</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
