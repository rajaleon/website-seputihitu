'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Plus, Trash2, ImageIcon } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface Banner { id: number; title: string; image_url: string; link_url?: string; sort_order: number; is_active: number; }

export default function AdminBannersPage() {
  const [banners,  setBanners]  = useState<Banner[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form,     setForm]     = useState({ title: '', image_url: '', link_url: '', sort_order: '0' });
  const [saving,   setSaving]   = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  function load() {
    setLoading(true);
    api.get('/banners').then(r => setBanners(r.data.data)).catch(() => {}).finally(() => setLoading(false));
  }
  useEffect(() => { load(); }, []);

  async function handleAdd() {
    if (!form.title || !form.image_url) { toast.error('Judul dan URL gambar wajib diisi'); return; }
    setSaving(true);
    try {
      await api.post('/banners', { ...form, sort_order: Number(form.sort_order) || 0 });
      toast.success('Banner ditambahkan');
      setShowForm(false);
      setForm({ title: '', image_url: '', link_url: '', sort_order: '0' });
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menambahkan banner');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Hapus banner ini?')) return;
    setDeleting(id);
    try {
      await api.delete(`/banners/${id}`);
      toast.success('Banner dihapus');
      load();
    } catch {
      toast.error('Gagal menghapus banner');
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Banner</h1>
          <p className="text-gray-500 text-sm mt-1">Banner ditampilkan di hero carousel landing page</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Tambah Banner
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="card p-5 mb-6 border-2 border-primary-200">
          <h2 className="font-semibold text-gray-900 mb-4">Banner Baru</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1.5">Judul <span className="text-red-500">*</span></label>
              <input type="text" placeholder="Promo Spesial" value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="input-field text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1.5">Urutan Tampil</label>
              <input type="number" min="0" value={form.sort_order}
                onChange={e => setForm(f => ({ ...f, sort_order: e.target.value }))} className="input-field text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1.5">URL Gambar <span className="text-red-500">*</span></label>
              <input type="url" placeholder="https://..." value={form.image_url}
                onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} className="input-field text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1.5">Link Tujuan (opsional)</label>
              <input type="text" placeholder="/catalog" value={form.link_url}
                onChange={e => setForm(f => ({ ...f, link_url: e.target.value }))} className="input-field text-sm" />
            </div>
          </div>
          {form.image_url && (
            <div className="mb-4">
              <p className="text-xs font-medium text-gray-500 mb-2">Preview:</p>
              <div className="h-32 rounded-xl overflow-hidden bg-gray-100 max-w-md relative">
                <Image src={form.image_url} alt="preview" fill className="object-cover" onError={() => {}} />
              </div>
            </div>
          )}
          <div className="flex gap-2">
            <button onClick={handleAdd} disabled={saving} className="btn-primary text-sm py-2 px-5">
              {saving ? 'Menyimpan...' : 'Simpan Banner'}
            </button>
            <button onClick={() => setShowForm(false)} className="btn-ghost text-sm py-2">Batal</button>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="skeleton aspect-video rounded-2xl" />)}
        </div>
      ) : banners.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-2xl">
          <ImageIcon size={40} className="mx-auto mb-3 text-gray-300" />
          <p className="text-gray-400">Belum ada banner. Tambahkan banner untuk landing page.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {banners.map(b => (
            <div key={b.id} className="card overflow-hidden group">
              <div className="aspect-video relative bg-gray-100">
                <Image src={b.image_url} alt={b.title} fill className="object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button onClick={() => handleDelete(b.id)} disabled={deleting === b.id}
                    className="bg-red-500 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 hover:bg-red-600">
                    <Trash2 size={14} />
                    {deleting === b.id ? 'Menghapus...' : 'Hapus'}
                  </button>
                </div>
              </div>
              <div className="p-3">
                <p className="font-semibold text-sm text-gray-800">{b.title}</p>
                {b.link_url && <p className="text-xs text-gray-400 truncate mt-0.5">{b.link_url}</p>}
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Urutan: {b.sort_order}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${b.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {b.is_active ? 'Aktif' : 'Nonaktif'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
