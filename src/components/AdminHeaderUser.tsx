'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  CiLogout as LogOut,
  CiExport as ExternalLink,
} from 'react-icons/ci';
import Link from 'next/link';

export default function AdminHeaderUser() {
  const { user, logout } = useAuth();

  const roleLabel =
    user?.role === 'admin'
      ? 'Tổng quản lý'
      : user?.role === 'manager'
      ? 'Quản lý'
      : 'Nhân viên';

  return (
    <div className="flex items-center gap-2 sm:gap-3 shrink-0">
      <Link
        href="/"
        className="hidden md:inline-flex items-center gap-1.5 text-[12px] text-[#41454d] hover:text-[#A30029] font-medium bg-[#f8fafc] px-3 py-1.5 rounded-[6px] border border-[#dddddd] transition"
      >
        <ExternalLink className="w-3.5 h-3.5" />
        <span>Trang bán hàng</span>
      </Link>

      <div className="flex items-center gap-1.5 text-[12px] sm:text-[13px] text-[#41454d] truncate max-w-[140px] sm:max-w-none">
        <span className="hidden sm:inline-block px-2 py-0.5 rounded-[4px] bg-[#fff1f2] text-[#A30029] border border-[#fecdd3] text-[11px] font-semibold">
          {roleLabel}
        </span>
        <strong className="text-[#181d26] font-medium truncate">
          {user?.fullName || user?.username || 'Admin'}
        </strong>
      </div>

      <button
        onClick={logout}
        title="Đăng xuất khỏi trang quản trị"
        className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-[6px] text-[11px] sm:text-[12px] font-medium text-[#A30029] hover:bg-[#fff1f2] border border-[#fecdd3] transition cursor-pointer shrink-0"
      >
        <LogOut className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Đăng xuất</span>
      </button>
    </div>
  );
}
