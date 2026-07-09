'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Heart, ShoppingCart, Star } from 'lucide-react';
import { formatRupiah, discountPercent } from '@/lib/utils';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  discount_price?: number;
  thumbnail_url?: string;
  rating_avg?: number;
  total_sold?: number;
  is_flash_sale?: boolean;
  flash_sale_end?: string;
  category_name?: string;
}

interface Props {
  product: Product;
  className?: string;
}

export default function ProductCard({ product, className = '' }: Props) {
  const router   = useRouter();
  const { user } = useAuthStore();
  const addItem  = useCartStore(s => s.addItem);

  async function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    if (!user) { router.push('/login'); return; }
    await addItem(product.id, 1);
  }

  const finalPrice = product.discount_price || product.price;
  const hasDiscount = product.discount_price && product.discount_price < product.price;

  return (
    <Link href={`/products/${product.slug}`}
      className={`card hover:shadow-md transition-shadow group ${className}`}>
      <div className="relative overflow-hidden aspect-square bg-gray-100">
        {product.thumbnail_url ? (
          <Image
            src={product.thumbnail_url}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <ShoppingCart size={40} />
          </div>
        )}
        {hasDiscount && (
          <span className="badge-discount absolute top-2 left-2">
            -{discountPercent(product.price, product.discount_price!)}%
          </span>
        )}
        {product.is_flash_sale && (
          <span className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-0.5 rounded-full">
            Flash Sale
          </span>
        )}
        <button
          onClick={handleAddToCart}
          className="absolute bottom-2 right-2 w-9 h-9 bg-white rounded-full shadow-md flex items-center justify-center
                     opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary-500 hover:text-white"
          aria-label="Tambah ke keranjang"
        >
          <ShoppingCart size={16} />
        </button>
      </div>
      <div className="p-3">
        <h3 className="text-sm font-medium text-gray-800 line-clamp-2 leading-snug mb-2">
          {product.name}
        </h3>
        <div className="flex items-center gap-1 mb-2">
          <Star size={12} className="text-yellow-400 fill-yellow-400" />
          <span className="text-xs text-gray-500">
            {product.rating_avg ? Number(product.rating_avg).toFixed(1) : '0.0'}
          </span>
          {product.total_sold != null && (
            <span className="text-xs text-gray-400">· {product.total_sold.toLocaleString('id-ID')} terjual</span>
          )}
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-primary-600 text-sm">{formatRupiah(finalPrice)}</span>
          {hasDiscount && (
            <span className="text-xs text-gray-400 line-through">{formatRupiah(product.price)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
