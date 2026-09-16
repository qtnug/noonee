'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function AdminLoginPage() {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (user && user.role === 'admin') {
      router.replace('/admin');
    }
  }, [user, router]);

  return null;
}
