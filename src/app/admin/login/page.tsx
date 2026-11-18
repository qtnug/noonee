'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function AdminLoginPage() {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    if (user.role === 'staff') {
      router.replace('/admin/orders');
    } else if (user.role === 'admin' || user.role === 'manager') {
      router.replace('/admin');
    }
  }, [user, router]);

  return null;
}
