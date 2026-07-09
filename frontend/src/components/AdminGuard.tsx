'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { loadFromStorage } = useAuthStore();
  const [status, setStatus] = useState<'loading' | 'authorized' | 'denied'>('loading');

  useEffect(() => {
    loadFromStorage();

    const stored = localStorage.getItem('user');
    if (!stored) {
      router.replace('/login');
      return;
    }

    try {
      const u = JSON.parse(stored);
      if (u.role === 'admin') {
        setStatus('authorized');
      } else {
        setStatus('denied');
        router.replace('/');
      }
    } catch {
      router.replace('/login');
    }
  }, [loadFromStorage, router]);

  if (status === 'loading' || status === 'denied') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 text-sm">
            {status === 'loading' ? 'Memeriksa akses...' : 'Mengalihkan...'}
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
