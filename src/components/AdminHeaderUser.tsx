'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { LogOut, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export default function AdminHeaderUser() {
  const { user, logout } = useAuth();

  return (
    <div className="flex items-center gap-2 sm:gap-4 shrink-0">
      <Link
        href="/"
        className="hidden md:inline-flex items-center gap-1.5 text-[12px] text-[#41454d] hover:text-[#e31837] font-medium bg-[#f8fafc] px-3 py-1.5 rounded-[6px] border border-[#dddddd] transition"
      >
        <ExternalLink className="w-3.5 h-3.5" />
        <span>Trang bán hàng</span>
      </Link>

      <span className="text-[12px] sm:text-[13px] text-[#41454d] truncate max-w-[100px] sm:max-w-none">
        <span className="hidden sm:inline">Quản trị viên: </span>
        <strong className="text-[#181d26] font-medium">{user?.fullName || user?.username || 'Admin'}</strong>
      </span>

      <button
        onClick={logout}
        title="Đăng xuất khỏi trang quản trị"
        className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-[6px] text-[11px] sm:text-[12px] font-medium text-[#e31837] hover:bg-[#fff1f2] border border-[#fecdd3] transition cursor-pointer shrink-0"
      >
        <LogOut className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Đăng xuất</span>
      </button>
    </div>
  );
}
