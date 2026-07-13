'use client';

import { useState, useRef } from 'react';
import { Upload, X, ImageIcon, Loader2 } from 'lucide-react';
import Image from 'next/image';
import toast from 'react-hot-toast';

interface Props {
  value: string;
  onChange: (url: string) => void;
  folder?: string;
  label?: string;
  className?: string;
}

export default function ImageUpload({ value, onChange, folder = 'images', label = 'Upload Gambar', className = '' }: Props) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      toast.error('Format harus JPG, PNG, WebP, atau GIF');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 5MB');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folder);

      const token = localStorage.getItem('token');
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        onChange(data.data.url);
        toast.success('Gambar berhasil diupload');
      } else {
        toast.error(data.message || 'Gagal upload');
      }
    } catch {
      toast.error('Gagal upload gambar');
    } finally {
      setUploading(false);
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  return (
    <div className={className}>
      <label className="text-sm font-semibold text-gray-700 block mb-2">{label}</label>

      {value ? (
        <div className="relative inline-block">
          <div className="relative w-full max-w-xs h-40 rounded-xl overflow-hidden border border-gray-200">
            <Image src={value} alt="Preview" fill className="object-cover" />
          </div>
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow hover:bg-red-600"
          >
            <X size={12} />
          </button>
          <p className="text-xs text-gray-400 mt-2 truncate max-w-xs">{value}</p>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors
            ${dragOver ? 'border-primary-400 bg-primary-50' : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'}
            ${uploading ? 'pointer-events-none opacity-60' : ''}`}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 size={24} className="text-primary-500 animate-spin" />
              <p className="text-sm text-gray-500">Mengupload...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                <ImageIcon size={22} className="text-gray-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">
                  Klik atau drag & drop gambar
                </p>
                <p className="text-xs text-gray-400 mt-0.5">JPG, PNG, WebP, GIF (maks. 5MB)</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Manual URL input as fallback */}
      <div className="mt-3">
        <div className="flex items-center gap-2 text-xs text-gray-400 mb-1.5">
          <div className="flex-1 h-px bg-gray-200" />
          <span>atau masukkan URL</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>
        <input
          type="url"
          placeholder="https://example.com/gambar.jpg"
          value={value}
          onChange={e => onChange(e.target.value)}
          className="input-field text-sm py-2"
        />
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleInputChange}
        className="hidden"
      />
    </div>
  );
}
