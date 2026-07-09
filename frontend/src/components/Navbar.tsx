'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Search, User, Menu, X, Package } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';

export default function Navbar() {
  const router   = useRouter();
  const { user, logout, loadFromStorage } = useAuthStore();
  const { totalItems, fetchCart }         = useCartStore();
  const [menuOpen,    setMenuOpen]    = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userMenu,    setUserMenu]    = useState(false);

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  useEffect(() => {
    if (user) fetchCart();
  }, [user, fetchCart]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/catalog?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  }

  return (
    <header className="bg-white sticky top-0 z-50 shadow-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center gap-4 h-16">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0 flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-black text-sm">S</span>
            </div>
            <span className="font-bold text-lg text-gray-900 hidden sm:block">Seputihitu</span>
          </Link>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1 max-w-xl hidden md:flex">
            <div className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Cari produk..."
                className="input-field pr-12 py-2.5 text-sm"
              />
              <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary-500">
                <Search size={18} />
              </button>
            </div>
          </form>

          {/* Nav actions */}
          <div className="flex items-center gap-1 ml-auto">
            {user ? (
              <>
                <Link href="/orders" className="btn-ghost p-2.5 hidden sm:flex">
                  <Package size={20} />
                </Link>
                <Link href="/cart" className="btn-ghost p-2.5 relative">
                  <ShoppingCart size={20} />
                  {totalItems() > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-primary-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center font-bold">
                      {totalItems() > 9 ? '9+' : totalItems()}
                    </span>
                  )}
                </Link>
                {/* User menu */}
                <div className="relative">
                  <button onClick={() => setUserMenu(!userMenu)} className="btn-ghost p-2.5 flex items-center gap-2">
                    <User size={20} />
                    <span className="hidden md:block text-sm font-medium">{user.name.split(' ')[0]}</span>
                  </button>
                  {userMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
                      <Link href="/profile" onClick={() => setUserMenu(false)} className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">Profil Saya</Link>
                      <Link href="/orders" onClick={() => setUserMenu(false)} className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">Pesanan Saya</Link>
                      {user.role === 'admin' && (
                        <Link href="/admin" onClick={() => setUserMenu(false)} className="block px-4 py-2.5 text-sm text-primary-600 font-medium hover:bg-primary-50">Admin Panel</Link>
                      )}
                      <hr className="my-1" />
                      <button onClick={() => { logout(); setUserMenu(false); router.push('/'); }}
                        className="block w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50">
                        Keluar
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link href="/login" className="btn-ghost text-sm px-3 py-2 hidden sm:block">Masuk</Link>
                <Link href="/register" className="btn-primary text-sm px-4 py-2">Daftar</Link>
              </>
            )}
            <button onClick={() => setMenuOpen(!menuOpen)} className="btn-ghost p-2.5 md:hidden">
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile search */}
        <form onSubmit={handleSearch} className="md:hidden pb-3">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Cari produk..."
              className="input-field pr-12 py-2 text-sm"
            />
            <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              <Search size={16} />
            </button>
          </div>
        </form>

        {/* Mobile menu */}
        {menuOpen && (
          <nav className="md:hidden border-t border-gray-100 py-3 space-y-1">
            {[
              { href: '/', label: 'Beranda' },
              { href: '/catalog', label: 'Katalog Produk' },
              { href: '/cart', label: 'Keranjang' },
              { href: '/orders', label: 'Pesanan' },
            ].map(({ href, label }) => (
              <Link key={href} href={href} onClick={() => setMenuOpen(false)}
                className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg">
                {label}
              </Link>
            ))}
            {!user && (
              <div className="flex gap-2 pt-2">
                <Link href="/login" onClick={() => setMenuOpen(false)} className="btn-outline text-sm flex-1 text-center">Masuk</Link>
                <Link href="/register" onClick={() => setMenuOpen(false)} className="btn-primary text-sm flex-1 text-center">Daftar</Link>
              </div>
            )}
          </nav>
        )}
      </div>
    </header>
  );
}
