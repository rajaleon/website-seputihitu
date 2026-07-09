'use client';

import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import ProductForm from '@/components/ProductForm';

export default function NewProductPage() {
  return (
    <div className="p-8 max-w-4xl">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/admin" className="hover:text-primary-500">Dashboard</Link>
        <ChevronRight size={14} />
        <Link href="/admin/products" className="hover:text-primary-500">Produk</Link>
        <ChevronRight size={14} />
        <span className="text-gray-800 font-medium">Tambah Baru</span>
      </nav>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Tambah Produk Baru</h1>
        <p className="text-gray-500 text-sm mt-1">
          Isi informasi produk di bawah ini. Produk akan langsung tampil di halaman katalog.
        </p>
      </div>

      <div className="card p-6">
        <ProductForm mode="create" />
      </div>
    </div>
  );
}
