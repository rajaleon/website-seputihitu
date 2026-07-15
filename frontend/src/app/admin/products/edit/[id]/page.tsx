'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import api from '@/lib/api';
import ProductForm, { ProductFormData } from '@/components/ProductForm';

interface Variant { id: string; variant_name: string; sku: string; price: string; stock: string; }

export default function EditProductPage() {
  const { id }   = useParams<{ id: string }>();
  const router   = useRouter();
  const [data,    setData]    = useState<Partial<ProductFormData> | null>(null);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        // Fetch by id — ambil semua produk admin lalu filter, atau pakai endpoint slug
        // Coba endpoint admin khusus dulu
        let product: any;
        try {
          const { data: r } = await api.get(`/admin/products/${id}`);
          product = r.data;
        } catch {
          // Fallback: karena GET /:slug butuh slug, kita pakai list dan filter
          const { data: r } = await api.get('/admin/products', { params: { limit: 100 } });
          product = r.data.find((p: any) => p.id === id);
        }

        if (!product) { router.push('/admin/products'); return; }

        // Map ke form data
        setData({
          sku:            product.sku || '',
          name:           product.name || '',
          slug:           product.slug || '',
          description:    product.description || '',
          specification:  product.specification || '',
          price:          String(product.price || ''),
          discount_price: product.discount_price ? String(product.discount_price) : '',
          stock:          String(product.stock ?? '0'),
          total_sold:     String(product.total_sold ?? '0'),
          category_id:    product.category_id ? String(product.category_id) : '',
          thumbnail_url:  product.thumbnail_url || '',
          weight_gram:    String(product.weight_gram ?? '0'),
          length_cm:      product.length_cm  ? String(product.length_cm)  : '',
          width_cm:       product.width_cm   ? String(product.width_cm)   : '',
          height_cm:      product.height_cm  ? String(product.height_cm)  : '',
          is_featured:    Boolean(product.is_featured),
          is_flash_sale:  Boolean(product.is_flash_sale),
          flash_sale_end: product.flash_sale_end
            ? new Date(product.flash_sale_end).toISOString().slice(0, 16)
            : '',
          is_active:      product.is_active !== 0,
        });

        // Variants
        if (product.variants?.length) {
          setVariants(product.variants.map((v: any) => ({
            id:           v.id,
            variant_name: v.variant_name,
            sku:          v.sku,
            price:        v.price ? String(v.price) : '',
            stock:        String(v.stock ?? '0'),
          })));
        }
      } catch {
        router.push('/admin/products');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, router]);

  if (loading) return (
    <div className="p-8">
      <div className="space-y-4 max-w-4xl">
        <div className="skeleton h-6 w-48 rounded" />
        <div className="skeleton h-8 w-64 rounded" />
        <div className="card p-6 space-y-4">
          {[...Array(6)].map((_, i) => <div key={i} className="skeleton h-10 rounded-xl" />)}
        </div>
      </div>
    </div>
  );

  if (!data) return null;

  return (
    <div className="p-8 max-w-4xl">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/admin" className="hover:text-primary-500">Dashboard</Link>
        <ChevronRight size={14} />
        <Link href="/admin/products" className="hover:text-primary-500">Produk</Link>
        <ChevronRight size={14} />
        <span className="text-gray-800 font-medium truncate max-w-xs">{data.name || 'Edit Produk'}</span>
      </nav>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Edit Produk</h1>
        <p className="text-gray-500 text-sm mt-1">
          Perubahan akan langsung diterapkan ke halaman katalog setelah disimpan.
        </p>
      </div>

      <div className="card p-6">
        <ProductForm
          mode="edit"
          productId={id}
          initialData={data}
          initialVariants={variants}
        />
      </div>
    </div>
  );
}
