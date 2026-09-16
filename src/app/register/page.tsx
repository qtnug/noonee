'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      router.replace(user.role === 'admin' ? '/admin' : '/');
    } else {
      router.replace('/login?mode=register');
    }
  }, [user, router]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-3">
      <Loader2 className="w-8 h-8 animate-spin text-[#e31837]" />
      <p className="text-[14px] text-gray-600 font-medium">Đang chuyển hướng...</p>
    </div>
  );
}
