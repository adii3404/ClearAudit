'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function HomePage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user && profile) {
        router.replace(profile.role === 'admin' ? '/admin' : '/dashboard');
      } else {
        router.replace('/login');
      }
    }
  }, [user, profile, loading, router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-black">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-2 border-neutral-700 border-t-neutral-200 rounded-full animate-spin" />
        <p className="text-sm text-neutral-500 tracking-wide">Initializing ClearAudit…</p>
      </div>
    </div>
  );
}
