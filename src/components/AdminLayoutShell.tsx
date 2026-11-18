'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  CiMenuBurger as Menu,
  CiCircleRemove as X,
  CiCircleCheck as ShieldCheck,
  CiGrid42 as LayoutDashboard,
  CiShoppingBasket as ShoppingBag,
  CiChat1 as MessageSquare,
  CiForkAndKnife as UtensilsCrossed,
  CiGrid31 as Layers,
  CiWavePulse1 as Activity,
  CiDiscount1 as Ticket,
  CiCircleChevLeft as ArrowLeft,
  CiLogout as LogOut,
  CiCircleChevDown as ChevronDown,
} from 'react-icons/ci';
import { useAuth } from '@/context/AuthContext';
import { useAdminBranch } from '@/context/AdminBranchContext';
import AdminHeaderUser from '@/components/AdminHeaderUser';

export default function AdminLayoutShell({ children }: { children: React.ReactNode }) {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [hasUnreadComplaint, setHasUnreadComplaint] = useState(false);
  const pathname = usePathname();
  const { logout } = useAuth();
  const { adminBranch, setAdminBranch } = useAdminBranch();

  React.useEffect(() => {
    const checkSupport = async () => {
      try {
        const res = await fetch('/api/support');
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          const hasOpenComplaint = data.data.some((m: any) => m.senderRole === 'customer' && m.isComplaint);
          setHasUnreadComplaint(hasOpenComplaint);
        }
      } catch (e) {}
    };
    checkSupport();
    const interval = setInterval(checkSupport, 6000);
    return () => clearInterval(interval);
  }, []);

  const links = [
    { name: 'Tổng quan hệ thống', href: '/admin', icon: LayoutDashboard },
    { name: 'Quản lý đơn hàng', href: '/admin/orders', icon: ShoppingBag },
    { name: 'Khiếu nại & Hỗ trợ KH', href: '/admin/support', icon: MessageSquare },
    { name: 'Thực đơn & Món ăn', href: '/admin/products', icon: UtensilsCrossed },
    { name: 'Danh mục món ăn', href: '/admin/categories', icon: Layers },
    { name: 'Kho Voucher ưu đãi', href: '/admin/coupons', icon: Ticket },
    { name: 'Chẩn đoán CSDL Cloud', href: '/admin/diagnostics', icon: Activity },
  ];

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      {/* 1. Desktop Sidebar (Permanent on lg screens) */}
      <aside className="hidden lg:flex w-64 bg-white text-[#333840] sticky top-0 h-screen flex-col border-r border-[#dddddd] shrink-0 z-30 overflow-hidden">
        {/* Brand Header */}
        <div className="h-16 px-6 border-b border-[#dddddd] flex items-center gap-3">
          <div className="w-8 h-8 rounded-[6px] bg-[#A30029] text-white flex items-center justify-center font-medium shadow-xs">
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

        {/* Desktop Nav Links */}
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
                    ? 'bg-[#A30029] text-white shadow-xs'
                    : 'text-[#41454d] hover:text-[#181d26] hover:bg-[#f8fafc]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#9297a0]'}`} />
                <span className="flex-1 truncate">{link.name}</span>
                {link.href === '/admin/support' && hasUnreadComplaint && (
                  <span className="w-2.5 h-2.5 rounded-full bg-[#A30029] ring-2 ring-white animate-pulse shrink-0" title="Có tin nhắn khiếu nại chưa xử lý" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Desktop Footer */}
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
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-[6px] text-[13px] font-medium text-[#A30029] hover:bg-[#fff1f2] transition text-left cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* 2. Mobile Drawer & Backdrop */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileDrawerOpen(false)}
          />

          {/* Drawer Sidebar */}
          <div className="relative w-72 max-w-[80vw] bg-white h-full flex flex-col shadow-2xl border-r border-[#dddddd] z-10 animate-in slide-in-from-left duration-200">
            {/* Drawer Header */}
            <div className="h-16 px-5 border-b border-[#dddddd] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-[6px] bg-[#A30029] text-white flex items-center justify-center font-medium shadow-xs">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-[#181d26] font-medium text-[15px] leading-tight">
                    <span className="font-friem text-[17px]">NooNee</span> Workspace
                  </h2>
                  <span className="text-[10px] font-medium uppercase tracking-wider text-[#9297a0]">
                    Cổng quản trị
                  </span>
                </div>
              </div>
              <button
                onClick={() => setMobileDrawerOpen(false)}
                className="p-1.5 text-gray-500 hover:text-[#181d26] rounded-lg hover:bg-gray-100 transition"
                aria-label="Đóng menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Nav Links */}
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
              {links.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileDrawerOpen(false)}
                    className={`flex items-center gap-3 px-3.5 py-3 rounded-lg text-[14px] font-medium transition ${
                      isActive
                        ? 'bg-[#A30029] text-white shadow-xs'
                        : 'text-[#41454d] hover:text-[#181d26] hover:bg-[#f8fafc]'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#9297a0]'}`} />
                    <span className="flex-1 truncate">{link.name}</span>
                    {link.href === '/admin/support' && hasUnreadComplaint && (
                      <span className="w-2.5 h-2.5 rounded-full bg-[#A30029] ring-2 ring-white animate-pulse shrink-0" />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Mobile Footer */}
            <div className="p-4 border-t border-[#dddddd] space-y-2 bg-[#f8fafc]">
              <Link
                href="/"
                onClick={() => setMobileDrawerOpen(false)}
                className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-[13px] font-medium text-[#41454d] hover:text-[#181d26] bg-white border border-[#dddddd] transition"
              >
                <ArrowLeft className="w-4 h-4 text-[#9297a0]" />
                <span>Về trang bán hàng</span>
              </Link>
              <button
                onClick={() => {
                  setMobileDrawerOpen(false);
                  logout();
                }}
                className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-lg text-[13px] font-medium text-[#A30029] hover:bg-[#fff1f2] border border-[#fecdd3] bg-white transition cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Đăng xuất tài khoản</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Main Workspace Container */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header with Chrome-Style Tabs */}
        <header className="h-16 bg-[#f8fafc] border-b border-[#dddddd] px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-4 sticky top-0 z-20">
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setMobileDrawerOpen(true)}
              className="lg:hidden p-2 text-[#333840] hover:text-[#A30029] hover:bg-gray-100 rounded-lg transition"
              aria-label="Mở menu quản trị"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-[#006400] animate-pulse shrink-0" />
              <span className="text-[12px] sm:text-[13px] font-medium text-[#181d26] whitespace-nowrap">
                Hệ thống trực tuyến
              </span>
              <span className="text-[12px] text-[#9297a0] hidden 2xl:inline whitespace-nowrap">
                • CSDL Cloud & Cổng thanh toán ổn định
              </span>
            </div>
          </div>

          {/* Top Single Branch Selector Dropdown */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="hidden sm:flex items-center gap-1.5 text-[12px] font-bold text-gray-700 whitespace-nowrap">
              <span className="w-2 h-2 rounded-full bg-[#A30029] animate-pulse" />
              <span>Cơ sở làm việc:</span>
            </div>
            <div className="relative">
              <select
                value={adminBranch}
                onChange={(e) => setAdminBranch(e.target.value as any)}
                aria-label="Chọn cơ sở làm việc"
                className="h-10 pl-3 pr-8 bg-white border-2 border-[#A30029]/30 hover:border-[#A30029] focus:border-[#A30029] focus:ring-2 focus:ring-[#A30029]/20 rounded-lg text-[13px] font-bold text-gray-900 cursor-pointer shadow-xs transition appearance-none"
              >
                <option value="all">🏢 Tất cả cơ sở (Toàn chuỗi)</option>
                <option value="1">📍 Cơ sở 1: 120 Yên Lãng</option>
                <option value="2">📍 Cơ sở 2: 269 Cầu Giấy</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#A30029]">
                <ChevronDown className="w-4 h-4 stroke-2" />
              </div>
            </div>
          </div>

          <div className="shrink-0">
            <AdminHeaderUser />
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
