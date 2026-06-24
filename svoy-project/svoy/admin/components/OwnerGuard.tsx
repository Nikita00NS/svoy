'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function OwnerGuard({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
          credentials: 'include',
        });
        if (!res.ok) throw new Error();
        const user = await res.json();
        if (user.role !== 'OWNER') {
          router.replace('/login');
        } else {
          setLoading(false);
        }
      } catch {
        router.replace('/login');
      }
    };
    checkAuth();
  }, [router]);

  if (loading) return <div className="flex h-screen items-center justify-center">Загрузка...</div>;
  return <>{children}</>;
}
