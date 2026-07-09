'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Mail, Phone, Shield, Calendar, Pencil, Check, X, Key } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

interface Profile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  role: string;
  created_at: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, loadFromStorage } = useAuthStore();

  const [profile, setProfile]     = useState<Profile | null>(null);
  const [loading, setLoading]     = useState(true);
  const [editing, setEditing]     = useState(false);
  const [saving,  setSaving]      = useState(false);
  const [showPwd, setShowPwd]     = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);

  // Edit form
  const [editName,  setEditName]  = useState('');
  const [editPhone, setEditPhone] = useState('');

  // Password form
  const [oldPwd, setOldPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    fetchProfile();
  }, [user, router]);

  async function fetchProfile() {
    try {
      const { data } = await api.get('/auth/me');
      setProfile(data.user);
      setEditName(data.user.name);
      setEditPhone(data.user.phone || '');
    } catch {
      toast.error('Gagal memuat profil');
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveProfile() {
    if (!editName.trim()) { toast.error('Nama tidak boleh kosong'); return; }
    setSaving(true);
    try {
      await api.patch('/auth/me', { name: editName, phone: editPhone });
      toast.success('Profil berhasil diperbarui');
      // Update localStorage
      const stored = localStorage.getItem('user');
      if (stored) {
        const u = JSON.parse(stored);
        u.name = editName;
        u.phone = editPhone;
        localStorage.setItem('user', JSON.stringify(u));
      }
      setProfile(p => p ? { ...p, name: editName, phone: editPhone } : p);
      setEditing(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menyimpan');
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword() {
    if (!oldPwd || !newPwd) { toast.error('Semua field password wajib diisi'); return; }
    if (newPwd.length < 8) { toast.error('Password baru minimal 8 karakter'); return; }
    if (newPwd !== confirmPwd) { toast.error('Konfirmasi password tidak cocok'); return; }
    setSavingPwd(true);
    try {
      await api.post('/auth/change-password', { old_password: oldPwd, new_password: newPwd });
      toast.success('Password berhasil diubah');
      setOldPwd(''); setNewPwd(''); setConfirmPwd('');
      setShowPwd(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal mengubah password');
    } finally {
      setSavingPwd(false);
    }
  }

  if (!user) return null;

  if (loading) return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="card p-8 space-y-6">
        <div className="flex items-center gap-4">
          <div className="skeleton w-20 h-20 rounded-full" />
          <div className="space-y-2 flex-1">
            <div className="skeleton h-6 w-48 rounded" />
            <div className="skeleton h-4 w-32 rounded" />
          </div>
        </div>
        {[1,2,3].map(i => <div key={i} className="skeleton h-12 rounded-xl" />)}
      </div>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Profil Saya</h1>

      {/* ── Profile Card ─────────────────────────────── */}
      <div className="card p-6 mb-6">
        <div className="flex items-center gap-4 mb-6">
          {/* Avatar */}
          <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.name} className="w-full h-full rounded-full object-cover" />
            ) : (
              <span className="text-primary-600 font-black text-2xl">
                {profile?.name?.[0]?.toUpperCase() || 'U'}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-gray-900 truncate">{profile?.name}</h2>
            <p className="text-sm text-gray-500">{profile?.email}</p>
            <span className={`inline-block mt-1 text-xs px-2.5 py-0.5 rounded-full font-semibold
              ${profile?.role === 'admin' ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-600'}`}>
              {profile?.role === 'admin' ? 'Admin' : 'Customer'}
            </span>
          </div>
          {!editing && (
            <button onClick={() => setEditing(true)}
              className="btn-outline py-2 px-4 text-sm flex items-center gap-1.5">
              <Pencil size={14} /> Edit
            </button>
          )}
        </div>

        {/* ── Info / Edit Mode ────────────────────────── */}
        {editing ? (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1.5">Nama</label>
              <input type="text" value={editName} onChange={e => setEditName(e.target.value)}
                className="input-field" placeholder="Nama lengkap" />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1.5">No. Telepon</label>
              <input type="tel" value={editPhone} onChange={e => setEditPhone(e.target.value)}
                className="input-field" placeholder="08xxxxxxxxxx" />
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={handleSaveProfile} disabled={saving}
                className="btn-primary flex items-center gap-1.5 text-sm">
                <Check size={14} /> {saving ? 'Menyimpan...' : 'Simpan'}
              </button>
              <button onClick={() => { setEditing(false); setEditName(profile?.name || ''); setEditPhone(profile?.phone || ''); }}
                className="btn-ghost flex items-center gap-1.5 text-sm">
                <X size={14} /> Batal
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center shadow-sm">
                <User size={16} className="text-gray-500" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Nama</p>
                <p className="text-sm font-medium text-gray-800">{profile?.name || '—'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center shadow-sm">
                <Mail size={16} className="text-gray-500" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Email</p>
                <p className="text-sm font-medium text-gray-800">{profile?.email || '—'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center shadow-sm">
                <Phone size={16} className="text-gray-500" />
              </div>
              <div>
                <p className="text-xs text-gray-400">No. Telepon</p>
                <p className="text-sm font-medium text-gray-800">{profile?.phone || 'Belum diisi'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center shadow-sm">
                <Calendar size={16} className="text-gray-500" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Bergabung Sejak</p>
                <p className="text-sm font-medium text-gray-800">
                  {profile?.created_at ? formatDate(profile.created_at) : '—'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Ganti Password ───────────────────────────── */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Key size={18} className="text-primary-500" /> Keamanan
          </h3>
          {!showPwd && (
            <button onClick={() => setShowPwd(true)}
              className="text-primary-500 text-sm font-medium hover:underline">
              Ganti Password
            </button>
          )}
        </div>

        {showPwd ? (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1.5">Password Lama</label>
              <input type="password" value={oldPwd} onChange={e => setOldPwd(e.target.value)}
                className="input-field" placeholder="Masukkan password lama" />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1.5">Password Baru</label>
              <input type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)}
                className="input-field" placeholder="Min. 8 karakter" />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1.5">Konfirmasi Password Baru</label>
              <input type="password" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)}
                className="input-field" placeholder="Ulangi password baru" />
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={handleChangePassword} disabled={savingPwd}
                className="btn-primary text-sm flex items-center gap-1.5">
                <Shield size={14} /> {savingPwd ? 'Menyimpan...' : 'Ubah Password'}
              </button>
              <button onClick={() => { setShowPwd(false); setOldPwd(''); setNewPwd(''); setConfirmPwd(''); }}
                className="btn-ghost text-sm">
                Batal
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500">
            Terakhir diubah: tidak diketahui. Disarankan ganti password secara berkala.
          </p>
        )}
      </div>
    </div>
  );
}
