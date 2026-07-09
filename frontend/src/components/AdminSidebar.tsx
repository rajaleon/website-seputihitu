'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Package, Image, ShoppingBag,
  Users, LogOut, ChevronRight, Store,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/admin',           label: 'Dashboard',    icon: LayoutDashboard },
  { href: '/admin/products',  label: 'Produk',       icon: Package },
  { href: '/admin/banners',   label: 'Banner',       icon: Image },
  { href: '/admin/orders',    label: 'Pesanan',      icon: ShoppingBag },
  { href: '/admin/users',     label: 'Pengguna',     icon: Users },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router   = useRouter();
  const { user, logout } = useAuthStore();

  function handleLogout() {
    logout();
    router.push('/login');
  }

  return (
    <aside className="w-60 min-h-screen bg-gray-900 flex flex-col flex-shrink-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-gray-800">
        <Link href="/admin" className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white font-black text-sm">S</span>
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">Seputihitu</p>
            <p className="text-gray-500 text-xs">Admin Panel</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = href === '/admin'
            ? pathname === '/admin'
            : pathname.startsWith(href);
          return (
            <Link key={href} href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors
                ${isActive
                  ? 'bg-primary-500 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}>
              <Icon size={17} className="flex-shrink-0" />
              {label}
              {isActive && <ChevronRight size={14} className="ml-auto opacity-60" />}
            </Link>
          );
        })}
      </nav>

      {/* Footer: lihat toko + logout */}
      <div className="px-3 pb-5 space-y-0.5 border-t border-gray-800 pt-4">
        <Link href="/" target="_blank"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">
          <Store size={17} />
          Lihat Toko
        </Link>
        <button onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-gray-800 transition-colors">
          <LogOut size={17} />
          Keluar
        </button>
        <div className="px-3 pt-3">
          <p className="text-xs text-gray-600 truncate">{user?.email || '—'}</p>
        </div>
      </div>
    </aside>
  );
}
