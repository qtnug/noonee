'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  UtensilsCrossed,
  Layers,
  ShoppingBag,
  Activity,
  ArrowLeft,
  LogOut,
  ShieldCheck,
  MessageSquare,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function AdminSidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();

  const links = [
    { name: 'Tổng quan hệ thống', href: '/admin', icon: LayoutDashboard },
    { name: 'Quản lý đơn hàng', href: '/admin/orders', icon: ShoppingBag },
    { name: 'Khiếu nại & Hỗ trợ KH', href: '/admin/support', icon: MessageSquare },
    { name: 'Thực đơn & Món ăn', href: '/admin/products', icon: UtensilsCrossed },
    { name: 'Danh mục món ăn', href: '/admin/categories', icon: Layers },
    { name: 'Chẩn đoán CSDL Cloud', href: '/admin/diagnostics', icon: Activity },
  ];

  return (
    <aside className="w-64 bg-white text-[#333840] min-h-screen flex flex-col border-r border-[#dddddd] shrink-0">
      {/* Brand Header */}
      <div className="h-16 px-6 border-b border-[#dddddd] flex items-center gap-3">
        <div className="w-8 h-8 rounded-[6px] bg-[#e31837] text-white flex items-center justify-center font-medium">
          <ShieldCheck className="w-4 h-4" />
        </div>
        <div>
          <h1 className="text-[#181d26] font-medium text-[16px] tracking-tight leading-tight">
            <span className="font-friem text-[18px]">NooNee</span> Workspace
          </h1>
          <span className="text-[11px] font-medium uppercase tracking-wider text-[#9297a0]">
            Cổng quản trị
          </span>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-[6px] text-[13px] font-medium transition ${
                isActive
                  ? 'bg-[#e31837] text-white shadow-xs'
                  : 'text-[#41454d] hover:text-[#181d26] hover:bg-[#f8fafc]'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#9297a0]'}`} />
              <span>{link.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer / Switch back to storefront */}
      <div className="p-4 border-t border-[#dddddd] space-y-1">
        <Link
          href="/"
          className="flex items-center gap-2.5 px-3 py-2 rounded-[6px] text-[13px] font-medium text-[#41454d] hover:text-[#181d26] hover:bg-[#f8fafc] transition"
        >
          <ArrowLeft className="w-4 h-4 text-[#9297a0]" />
          <span>Về trang bán hàng</span>
        </Link>
        <button
          onClick={logout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-[6px] text-[13px] font-medium text-[#e31837] hover:bg-[#fff1f2] transition text-left"
        >
          <LogOut className="w-4 h-4" />
          <span>Đăng xuất</span>
        </button>
      </div>
    </aside>
  );
}
