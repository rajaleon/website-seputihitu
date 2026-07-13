'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Plus, Trash2, Info } from 'lucide-react';
import api from '@/lib/api';
import { formatRupiah } from '@/lib/utils';
import toast from 'react-hot-toast';
import ImageUpload from '@/components/ImageUpload';

interface Category { id: number; name: string; slug: string; }

interface Variant { id?: string; variant_name: string; sku: string; price: string; stock: string; }

export interface ProductFormData {
  sku: string;
  name: string;
  slug: string;
  description: string;
  specification: string;
  price: string;
  discount_price: string;
  stock: string;
  category_id: string;
  thumbnail_url: string;
  weight_gram: string;
  length_cm: string;
  width_cm: string;
  height_cm: string;
  is_featured: boolean;
  is_flash_sale: boolean;
  flash_sale_end: string;
  is_active: boolean;
}

const EMPTY_FORM: ProductFormData = {
  sku: '', name: '', slug: '', description: '', specification: '',
  price: '', discount_price: '', stock: '0',
  category_id: '', thumbnail_url: '',
  weight_gram: '0', length_cm: '', width_cm: '', height_cm: '',
  is_featured: false, is_flash_sale: false, flash_sale_end: '', is_active: true,
};

interface Props {
  mode: 'create' | 'edit';
  productId?: string;
  initialData?: Partial<ProductFormData>;
  initialVariants?: Variant[];
}

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export default function ProductForm({ mode, productId, initialData, initialVariants }: Props) {
  const router = useRouter();
  const [form,       setForm]       = useState<ProductFormData>({ ...EMPTY_FORM, ...initialData });
  const [variants,   setVariants]   = useState<Variant[]>(initialVariants || []);
  const [categories, setCategories] = useState<Category[]>([]);
  const [saving,     setSaving]     = useState(false);
  const [activeTab,  setActiveTab]  = useState<'basic'|'detail'|'shipping'|'variants'>('basic');

  useEffect(() => {
    api.get('/categories').then(r => setCategories(r.data.data)).catch(() => {});
  }, []);

  // Auto-generate slug dari nama
  function handleNameChange(val: string) {
    setForm(f => ({
      ...f,
      name: val,
      slug: mode === 'create' ? slugify(val) : f.slug,
    }));
  }

  function updateField<K extends keyof ProductFormData>(key: K, val: ProductFormData[K]) {
    setForm(f => ({ ...f, [key]: val }));
  }

  // Variants helpers
  function addVariant() {
    setVariants(v => [...v, { variant_name: '', sku: '', price: '', stock: '0' }]);
  }
  function removeVariant(i: number) {
    setVariants(v => v.filter((_, idx) => idx !== i));
  }
  function updateVariant(i: number, key: keyof Variant, val: string) {
    setVariants(v => v.map((item, idx) => idx === i ? { ...item, [key]: val } : item));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.sku.trim())   { toast.error('SKU wajib diisi'); setActiveTab('basic'); return; }
    if (!form.name.trim())  { toast.error('Nama produk wajib diisi'); setActiveTab('basic'); return; }
    if (!form.slug.trim())  { toast.error('Slug wajib diisi'); setActiveTab('basic'); return; }
    if (!form.price)        { toast.error('Harga wajib diisi'); setActiveTab('basic'); return; }

    setSaving(true);
    try {
      const payload = {
        ...form,
        price:          Number(form.price),
        discount_price: form.discount_price ? Number(form.discount_price) : null,
        stock:          Number(form.stock),
        category_id:    form.category_id || null,
        weight_gram:    Number(form.weight_gram) || 0,
        length_cm:      form.length_cm  ? Number(form.length_cm)  : null,
        width_cm:       form.width_cm   ? Number(form.width_cm)   : null,
        height_cm:      form.height_cm  ? Number(form.height_cm)  : null,
        flash_sale_end: form.flash_sale_end || null,
        is_active:      form.is_active ? 1 : 0,
        is_featured:    form.is_featured ? 1 : 0,
        is_flash_sale:  form.is_flash_sale ? 1 : 0,
      };

      if (mode === 'create') {
        const { data } = await api.post('/products', payload);
        toast.success('Produk berhasil ditambahkan!');
        router.push('/admin/products');
        router.refresh();
      } else {
        await api.patch(`/products/${productId}`, payload);
        toast.success('Produk berhasil diperbarui!');
        router.push('/admin/products');
        router.refresh();
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menyimpan produk');
    } finally {
      setSaving(false);
    }
  }

  const previewPrice  = Number(form.price) || 0;
  const previewDisc   = Number(form.discount_price) || 0;
  const discPercent   = previewPrice > 0 && previewDisc > 0
    ? Math.round(((previewPrice - previewDisc) / previewPrice) * 100) : 0;

  const TABS = [
    { key: 'basic',    label: 'Info Dasar' },
    { key: 'detail',   label: 'Deskripsi & Label' },
    { key: 'shipping', label: 'Berat & Dimensi' },
    { key: 'variants', label: `Varian (${variants.length})` },
  ] as const;

  return (
    <form onSubmit={handleSubmit}>
      {/* Tab Navigation */}
      <div className="flex gap-0 border-b border-gray-200 mb-6">
        {TABS.map(tab => (
          <button key={tab.key} type="button" onClick={() => setActiveTab(tab.key)}
            className={`px-5 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap
              ${activeTab === tab.key
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab: Info Dasar ──────────────────────────────── */}
      {activeTab === 'basic' && (
        <div className="space-y-5">
          {/* Thumbnail upload */}
          <ImageUpload
            value={form.thumbnail_url}
            onChange={(url) => updateField('thumbnail_url', url)}
            folder="products"
            label="Gambar Utama (Thumbnail)"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* SKU */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                SKU <span className="text-red-500">*</span>
              </label>
              <input type="text" placeholder="SPH-001" required
                value={form.sku} onChange={e => updateField('sku', e.target.value.toUpperCase())}
                className="input-field text-sm font-mono" />
            </div>

            {/* Kategori */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Kategori</label>
              <select value={form.category_id}
                onChange={e => updateField('category_id', e.target.value)}
                className="input-field text-sm">
                <option value="">— Pilih Kategori —</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Nama */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nama Produk <span className="text-red-500">*</span>
              </label>
              <input type="text" placeholder="Nama produk yang menarik" required
                value={form.name} onChange={e => handleNameChange(e.target.value)}
                className="input-field text-sm" />
            </div>

            {/* Slug */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Slug URL <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center">
                <span className="bg-gray-100 border border-r-0 border-gray-300 px-3 py-3 rounded-l-xl text-xs text-gray-500 whitespace-nowrap">
                  /products/
                </span>
                <input type="text" required value={form.slug}
                  onChange={e => updateField('slug', slugify(e.target.value))}
                  className="input-field rounded-l-none text-sm flex-1" />
              </div>
            </div>
          </div>

          {/* Harga */}
          <div className="card p-5 bg-gray-50 border-0">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Harga</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  Harga Normal <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">Rp</span>
                  <input type="number" min="0" required placeholder="0"
                    value={form.price} onChange={e => updateField('price', e.target.value)}
                    className="input-field pl-9 text-sm" />
                </div>
                {previewPrice > 0 && (
                  <p className="text-xs text-gray-400 mt-1">{formatRupiah(previewPrice)}</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Harga Diskon</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">Rp</span>
                  <input type="number" min="0" placeholder="Kosongkan jika tidak ada"
                    value={form.discount_price} onChange={e => updateField('discount_price', e.target.value)}
                    className="input-field pl-9 text-sm" />
                </div>
                {previewDisc > 0 && (
                  <p className="text-xs text-gray-400 mt-1">{formatRupiah(previewDisc)}</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Stok</label>
                <input type="number" min="0" required
                  value={form.stock} onChange={e => updateField('stock', e.target.value)}
                  className="input-field text-sm" />
              </div>
            </div>
            {discPercent > 0 && (
              <div className="mt-3 flex items-center gap-2">
                <span className="badge-discount">-{discPercent}%</span>
                <span className="text-sm text-gray-600">
                  Hemat <strong>{formatRupiah(previewPrice - previewDisc)}</strong> per item
                </span>
              </div>
            )}
          </div>

          {/* Status */}
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <div className="relative">
                <input type="checkbox" checked={form.is_active}
                  onChange={e => updateField('is_active', e.target.checked)}
                  className="sr-only peer" />
                <div className="w-10 h-6 bg-gray-200 peer-checked:bg-primary-500 rounded-full transition-colors" />
                <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform peer-checked:translate-x-4" />
              </div>
              <span className="text-sm font-medium text-gray-700">Produk Aktif</span>
            </label>
          </div>
        </div>
      )}

      {/* ── Tab: Deskripsi & Label ───────────────────────── */}
      {activeTab === 'detail' && (
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Deskripsi Produk</label>
            <textarea rows={6} placeholder="Jelaskan produk kamu secara menarik..."
              value={form.description} onChange={e => updateField('description', e.target.value)}
              className="input-field text-sm resize-y" />
            <p className="text-xs text-gray-400 mt-1">{form.description.length} karakter</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Spesifikasi</label>
            <textarea rows={5} placeholder="Material: Cotton 100%&#10;Ukuran: S, M, L, XL&#10;Warna: Merah, Biru"
              value={form.specification} onChange={e => updateField('specification', e.target.value)}
              className="input-field text-sm resize-y font-mono" />
          </div>

          {/* Label produk */}
          <div className="card p-5 bg-gray-50 border-0 space-y-4">
            <h3 className="text-sm font-semibold text-gray-700">Label & Promo</h3>

            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={form.is_featured}
                onChange={e => updateField('is_featured', e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-primary-500" />
              <div>
                <p className="text-sm font-medium text-gray-800">Produk Unggulan</p>
                <p className="text-xs text-gray-500">Tampilkan di section "Produk Unggulan" di landing page</p>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={form.is_flash_sale}
                onChange={e => updateField('is_flash_sale', e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-primary-500" />
              <div>
                <p className="text-sm font-medium text-gray-800">Flash Sale</p>
                <p className="text-xs text-gray-500">Tampilkan di section "Flash Sale" dengan countdown timer</p>
              </div>
            </label>

            {form.is_flash_sale && (
              <div className="ml-7">
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Waktu Berakhir Flash Sale</label>
                <input type="datetime-local"
                  value={form.flash_sale_end}
                  onChange={e => updateField('flash_sale_end', e.target.value)}
                  className="input-field text-sm w-auto" />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Tab: Berat & Dimensi ─────────────────────────── */}
      {activeTab === 'shipping' && (
        <div className="space-y-5">
          <div className="flex items-start gap-2 p-4 bg-blue-50 rounded-xl">
            <Info size={16} className="text-blue-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-blue-700">
              Data berat dan dimensi digunakan untuk menghitung ongkos kirim via BiteShip.
              Pastikan diisi dengan benar agar estimasi ongkir akurat.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Berat <span className="text-gray-400 font-normal">(gram)</span>
              </label>
              <div className="flex items-center gap-2 max-w-xs">
                <input type="number" min="0" placeholder="500"
                  value={form.weight_gram} onChange={e => updateField('weight_gram', e.target.value)}
                  className="input-field text-sm" />
                <span className="text-sm text-gray-500 whitespace-nowrap">gram</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">Contoh: 500 = 500 gram = 0.5 kg</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Panjang <span className="text-gray-400 font-normal">(cm)</span>
              </label>
              <input type="number" min="0" step="0.1" placeholder="20"
                value={form.length_cm} onChange={e => updateField('length_cm', e.target.value)}
                className="input-field text-sm" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Lebar <span className="text-gray-400 font-normal">(cm)</span>
              </label>
              <input type="number" min="0" step="0.1" placeholder="15"
                value={form.width_cm} onChange={e => updateField('width_cm', e.target.value)}
                className="input-field text-sm" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Tinggi <span className="text-gray-400 font-normal">(cm)</span>
              </label>
              <input type="number" min="0" step="0.1" placeholder="10"
                value={form.height_cm} onChange={e => updateField('height_cm', e.target.value)}
                className="input-field text-sm" />
            </div>

            {form.length_cm && form.width_cm && form.height_cm && (
              <div className="sm:col-span-2 bg-gray-50 rounded-xl p-4 text-sm text-gray-600">
                Volume: <strong>{Number(form.length_cm) * Number(form.width_cm) * Number(form.height_cm)} cm³</strong>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Tab: Varian ──────────────────────────────────── */}
      {activeTab === 'variants' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-700">Varian Produk</p>
              <p className="text-xs text-gray-400 mt-0.5">
                Opsional. Tambahkan varian jika produk memiliki pilihan ukuran, warna, dll.
              </p>
            </div>
            <button type="button" onClick={addVariant}
              className="btn-outline text-sm flex items-center gap-1.5 py-2">
              <Plus size={14} /> Tambah Varian
            </button>
          </div>

          {variants.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
              <p className="text-gray-400 text-sm">Belum ada varian.</p>
              <button type="button" onClick={addVariant}
                className="text-primary-500 text-sm font-medium hover:underline mt-1">
                + Tambah varian pertama
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {variants.map((v, i) => (
                <div key={i} className="card p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="text-xs font-medium text-gray-500 block mb-1">Nama Varian</label>
                        <input type="text" placeholder="e.g. Merah / XL"
                          value={v.variant_name}
                          onChange={e => updateVariant(i, 'variant_name', e.target.value)}
                          className="input-field text-sm py-2" />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500 block mb-1">SKU Varian</label>
                        <input type="text" placeholder="SPH-001-M"
                          value={v.sku}
                          onChange={e => updateVariant(i, 'sku', e.target.value.toUpperCase())}
                          className="input-field text-sm py-2 font-mono" />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500 block mb-1">Harga Khusus</label>
                        <input type="number" min="0" placeholder="Kosong = pakai harga produk"
                          value={v.price}
                          onChange={e => updateVariant(i, 'price', e.target.value)}
                          className="input-field text-sm py-2" />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500 block mb-1">Stok</label>
                        <input type="number" min="0" placeholder="0"
                          value={v.stock}
                          onChange={e => updateVariant(i, 'stock', e.target.value)}
                          className="input-field text-sm py-2" />
                      </div>
                    </div>
                    <button type="button" onClick={() => removeVariant(i)}
                      className="text-red-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded-lg transition-colors mt-5 flex-shrink-0">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Submit Bar ───────────────────────────────────── */}
      <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
        <button type="button" onClick={() => router.push('/admin/products')}
          className="btn-ghost px-5 py-2.5">
          Batal
        </button>
        <div className="flex items-center gap-3">
          {mode === 'edit' && (
            <a href={`/products/${form.slug}`} target="_blank"
              className="btn-outline py-2.5 px-5 text-sm">
              Preview Produk ↗
            </a>
          )}
          <button type="submit" disabled={saving}
            className="btn-primary px-8 py-2.5 flex items-center gap-2">
            {saving && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {saving ? 'Menyimpan...' : mode === 'create' ? 'Simpan & Publish' : 'Simpan Perubahan'}
          </button>
        </div>
      </div>
    </form>
  );
}
