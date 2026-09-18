'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ShoppingBag,
  User as UserIcon,
  ShieldCheck,
  Menu,
  X,
  ChevronDown,
  Heart,
  KeyRound,
  LogOut,
  Flame,
  Users,
  UtensilsCrossed,
  Coffee,
  Sandwich,
  Phone,
  HelpCircle,
  Wallet,
  Ticket,
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { formatVND } from '@/lib/utils';

export default function Navbar() {
  const pathname = usePathname();
  const { totalItems, setIsCartOpen } = useCart();
  const { user, logout } = useAuth();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [menuDropdownOpen, setMenuDropdownOpen] = useState(false);
  const [hasUnreadSupport, setHasUnreadSupport] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number>(user?.walletBalance || 0);

  const menuDropdownRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuDropdownRef.current && !menuDropdownRef.current.contains(event.target as Node)) {
        setMenuDropdownOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Support unread notifications check (STT 4)
  useEffect(() => {
    const checkSupport = async () => {
      try {
        if (pathname === '/contact') {
          if (typeof window !== 'undefined') {
            localStorage.setItem('noonee_last_viewed_support', Date.now().toString());
          }
          setHasUnreadSupport(false);
          return;
        }

        const res = await fetch('/api/support');
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          const lastViewed = Number(localStorage.getItem('noonee_last_viewed_support') || '0');
          const hasNewAdminMsg = data.data.some(
            (m: any) => m.senderRole === 'admin' && new Date(m.createdAt).getTime() > lastViewed
          );
          setHasUnreadSupport(hasNewAdminMsg);
        }
      } catch (e) {}
    };

    checkSupport();
    const interval = setInterval(checkSupport, 6000);
    return () => clearInterval(interval);
  }, [pathname]);

  // Fetch updated wallet balance for user (STT 15)
  useEffect(() => {
    if (user?.id) {
      fetch(`/api/user/profile?userId=${user.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data?.user?.walletBalance !== undefined) {
            setWalletBalance(Number(data.data.user.walletBalance) || 0);
          } else if (user.walletBalance !== undefined) {
            setWalletBalance(Number(user.walletBalance) || 0);
          }
        })
        .catch(() => {
          if (user.walletBalance !== undefined) {
            setWalletBalance(Number(user.walletBalance) || 0);
          }
        });
    }
  }, [user, userMenuOpen]);

  // Hide on admin pages
  if (pathname.startsWith('/admin')) {
    return null;
  }

  const categories = [
    { name: 'Tất cả thực đơn', href: '/menu', icon: UtensilsCrossed, desc: 'Hơn 50+ món ngon chuẩn vị' },
    { name: 'Cơm & Món chính', href: '/menu?categoryId=1', icon: UtensilsCrossed, desc: 'Cơm rang, cơm tấm, phở bò' },
    { name: 'Đồ ăn vặt', href: '/menu?categoryId=2', icon: Sandwich, desc: 'Bánh tráng trộn, khoai chiên' },
    { name: 'Đồ uống & Tráng miệng', href: '/menu?categoryId=3', icon: Coffee, desc: 'Trà sữa, trà đào, sữa chua' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#FFFAF0]/95 backdrop-blur-md border-b border-[#ebdcd0] shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 lg:gap-4">
        {/* Left: Brand Wordmark */}
        <div className="flex items-center gap-6 shrink-0">
          <Link href="/" className="flex items-center gap-1 group py-1">
            <span className="font-friem text-3xl tracking-wide text-[#0f172a] group-hover:text-[#e31837] transition-colors">
              NooNee<span className="text-[#e31837]">.</span>
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-1.5 text-[14px]">
            {/* Thực đơn Dropdown */}
            <div
              className="relative"
              ref={menuDropdownRef}
              onMouseEnter={() => setMenuDropdownOpen(true)}
              onMouseLeave={() => setMenuDropdownOpen(false)}
            >
              <button
                type="button"
                onClick={() => setMenuDropdownOpen(!menuDropdownOpen)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium transition-all cursor-pointer ${
                  pathname.startsWith('/menu') && !pathname.includes('deal=true')
                    ? 'bg-red-50 text-[#e31837] font-bold'
                    : 'text-[#1e293b] hover:text-[#e31837] hover:bg-red-50/70 font-semibold'
                }`}
              >
                <span>Thực đơn</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    menuDropdownOpen ? 'rotate-180 text-[#e31837]' : 'text-[#64748b]'
                  }`}
                />
              </button>

              {/* Category Dropdown Menu */}
              {menuDropdownOpen && (
                <div className="absolute left-0 top-full pt-1.5 w-64 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="bg-white rounded-xl shadow-xl border border-[#e2e8f0] p-2 space-y-1 divide-y divide-gray-100">
                    <div className="space-y-1">
                      {categories.map((cat) => {
                        const Icon = cat.icon;
                        return (
                          <Link
                            key={cat.href}
                            href={cat.href}
                            onClick={() => setMenuDropdownOpen(false)}
                            className="flex items-start gap-3 p-2 rounded-lg hover:bg-[#fff1f2] transition group text-left"
                          >
                            <div className="w-8 h-8 rounded-md bg-red-50 text-[#e31837] flex items-center justify-center shrink-0 group-hover:bg-[#e31837] group-hover:text-white transition">
                              <Icon className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-[13px] font-bold text-[#0f172a] group-hover:text-[#e31837]">
                                {cat.name}
                              </p>
                              <p className="text-[11px] text-[#64748b] line-clamp-1">
                                {cat.desc}
                              </p>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Best Seller (STT 11: Links to /best-seller) */}
            <Link
              href="/best-seller"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium transition-all ${
                pathname === '/best-seller'
                  ? 'bg-red-50 text-[#e31837] font-bold'
                  : 'text-[#1e293b] hover:text-[#e31837] hover:bg-red-50/70 font-semibold'
              }`}
            >
              <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span>Bán chạy</span>
            </Link>

            {/* Đơn nhóm */}
            <Link
              href="/group"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium transition-all ${
                pathname.startsWith('/group')
                  ? 'bg-red-50 text-[#e31837] font-bold'
                  : 'text-[#1e293b] hover:text-[#e31837] hover:bg-red-50/70 font-semibold'
              }`}
            >
              <Users className="w-4 h-4 text-[#e31837]" />
              <span>Đơn nhóm</span>
              <span className="text-[10px] font-extrabold px-1.5 py-0.5 bg-gradient-to-r from-[#e31837] to-pink-500 text-white rounded-full shadow-xs animate-pulse">
                -10%
              </span>
            </Link>

            {/* Đơn hàng */}
            <Link
              href="/orders"
              className={`flex items-center gap-1 px-3 py-2 rounded-lg font-medium transition-all ${
                pathname.startsWith('/orders')
                  ? 'bg-red-50 text-[#e31837] font-bold'
                  : 'text-[#1e293b] hover:text-[#e31837] hover:bg-red-50/70 font-semibold'
              }`}
            >
              <span>Đơn hàng</span>
            </Link>

            {/* Liên hệ (STT 4: Red dot badge when staff replied) */}
            <Link
              href="/contact"
              className={`relative flex items-center gap-1 px-3 py-2 rounded-lg font-medium transition-all ${
                pathname === '/contact'
                  ? 'bg-red-50 text-[#e31837] font-bold'
                  : 'text-[#1e293b] hover:text-[#e31837] hover:bg-red-50/70 font-semibold'
              }`}
            >
              <span>Liên hệ</span>
              {hasUnreadSupport && (
                <span className="w-2.5 h-2.5 rounded-full bg-[#e31837] animate-pulse ring-2 ring-white absolute top-1 right-1" />
              )}
            </Link>
          </nav>
        </div>

        {/* Spacer to push actions to right */}
        <div className="flex-1" />

        {/* Right Action Cluster */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">

          {/* Cart Drawer Trigger */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="flex items-center gap-1.5 sm:gap-2 h-9 sm:h-10 px-2.5 sm:px-3.5 rounded-lg border border-[#dddddd] hover:border-[#e31837] bg-white text-[#181d26] hover:text-[#e31837] text-[13px] font-medium transition shadow-2xs hover:bg-red-50/30 cursor-pointer"
            aria-label="Giỏ hàng"
          >
            <ShoppingBag className="w-4 h-4 text-inherit" />
            <span className="hidden sm:inline">Giỏ hàng</span>
            {totalItems > 0 && (
              <span className="inline-flex items-center justify-center min-w-[18px] h-4.5 sm:min-w-[20px] sm:h-5 px-1 sm:px-1.5 text-[10px] sm:text-[11px] font-bold bg-[#e31837] text-white rounded-full">
                {totalItems}
              </span>
            )}
          </button>

          {/* User Account / Avatar Dropdown (STT 15: Displays Wallet Balance & Voucher Wallet link) */}
          {user ? (
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="h-9 sm:h-10 px-2 sm:px-2.5 rounded-lg border border-[#dddddd] hover:border-[#e31837] flex items-center gap-1.5 sm:gap-2 bg-white hover:bg-red-50/40 transition shadow-2xs cursor-pointer"
                aria-label="Hồ sơ tài khoản"
                title={`Tài khoản: ${user.fullName || user.username}`}
              >
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#e31837] text-white flex items-center justify-center text-[11px] sm:text-[12px] font-bold shadow-xs">
                  {user.fullName ? user.fullName.charAt(0).toUpperCase() : user.username.charAt(0).toUpperCase()}
                </div>
                <span className="hidden md:inline text-[13px] font-semibold text-[#181d26] max-w-[100px] truncate">
                  {user.fullName || user.username}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-[#9297a0] hidden sm:inline" />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-[#dddddd] py-2 z-50 text-[13px] divide-y divide-[#f0f0f0] animate-in fade-in slide-in-from-top-1 duration-150">
                  {/* User Info & Wallet Balance Header (STT 15) */}
                  <div className="px-4 py-3 bg-gradient-to-r from-red-50/80 via-white to-amber-50/50">
                    <p className="font-semibold text-[#181d26] text-[14px] truncate">{user.fullName}</p>
                    <p className="text-[12px] text-[#9297a0] truncate">@{user.username}</p>

                    <div className="mt-2.5 pt-2 border-t border-red-100 flex items-center justify-between">
                      <span className="text-[12px] text-[#555a64] flex items-center gap-1 font-medium">
                        <Wallet className="w-3.5 h-3.5 text-[#e31837]" />
                        Số dư ví:
                      </span>
                      <span className="text-[13px] font-bold text-[#e31837]">
                        {formatVND(walletBalance)}
                      </span>
                    </div>
                  </div>

                  <div className="py-1">
                    <Link
                      href="/profile"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-[#333840] hover:bg-[#fff1f2] hover:text-[#e31837] transition font-medium"
                    >
                      <UserIcon className="w-4 h-4 text-[#e31837]" />
                      <span>Hồ sơ & Hạng thành viên</span>
                    </Link>

                    {/* Kho Voucher (STT 1) */}
                    <Link
                      href="/profile?tab=vouchers"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-[#333840] hover:bg-[#fff1f2] hover:text-[#e31837] transition font-medium"
                    >
                      <Ticket className="w-4 h-4 text-[#e31837]" />
                      <div className="flex items-center justify-between w-full">
                        <span>Kho Voucher của tôi</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 bg-red-100 text-[#e31837] rounded-full">
                          Hot
                        </span>
                      </div>
                    </Link>

                    <Link
                      href="/profile?tab=favorites"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-[#333840] hover:bg-[#fff1f2] hover:text-[#e31837] transition font-medium"
                    >
                      <Heart className="w-4 h-4 text-[#e31837]" />
                      <span>Món ăn yêu thích</span>
                    </Link>

                    <Link
                      href="/profile?tab=password"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-[#333840] hover:bg-[#fff1f2] hover:text-[#e31837] transition font-medium"
                    >
                      <KeyRound className="w-4 h-4 text-[#e31837]" />
                      <span>Đổi mật khẩu</span>
                    </Link>

                    <Link
                      href="/orders"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-[#333840] hover:bg-[#fff1f2] hover:text-[#e31837] transition font-medium"
                    >
                      <ShoppingBag className="w-4 h-4 text-[#e31837]" />
                      <span>Đơn hàng của tôi</span>
                    </Link>

                    {user.role === 'admin' && (
                      <Link
                        href="/admin"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-[#e31837] hover:bg-[#fff1f2] transition font-semibold border-t border-[#f1f5f9] mt-1 pt-2"
                      >
                        <ShieldCheck className="w-4 h-4 text-[#e31837]" />
                        <span>Trang quản trị (Admin)</span>
                      </Link>
                    )}
                  </div>

                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setUserMenuOpen(false);
                        logout();
                      }}
                      className="w-full text-left flex items-center gap-2.5 px-4 py-2 text-[#e31837] hover:bg-[#fff1f2] font-medium transition cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Đăng xuất</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 h-9 sm:h-10 px-2.5 sm:px-3.5 rounded-lg text-[13px] text-[#333840] hover:text-[#e31837] hover:bg-red-50/60 font-medium transition"
            >
              <UserIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Đăng nhập</span>
            </Link>
          )}

          {/* Primary CTA - Red Button */}
          <Link
            href="/menu"
            className="hidden sm:inline-flex items-center justify-center h-10 px-4 rounded-lg bg-[#e31837] hover:bg-[#be0e27] text-white text-[13px] font-semibold shadow-xs transition hover:scale-[1.02] active:scale-95"
          >
            Đặt món ngay
          </Link>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-1.5 sm:p-2 text-[#0f172a] hover:text-[#e31837] rounded-lg hover:bg-gray-100 transition relative"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            {hasUnreadSupport && (
              <span className="w-2 h-2 rounded-full bg-[#e31837] ring-2 ring-white absolute top-1 right-1 animate-pulse" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#FFFAF0] border-t border-[#ebdcd0] px-4 py-4 space-y-3 shadow-lg animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="space-y-1 text-sm font-medium">
            <Link
              href="/menu"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between py-2.5 px-3 rounded-lg text-[#0f172a] font-semibold hover:bg-red-50 hover:text-[#e31837] transition"
            >
              <span className="flex items-center gap-2">
                <UtensilsCrossed className="w-4 h-4 text-[#e31837]" />
                Tất cả thực đơn
              </span>
            </Link>

            <div className="pl-6 space-y-1">
              <Link
                href="/menu?categoryId=1"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-1.5 text-xs text-[#334155] font-medium hover:text-[#e31837]"
              >
                • Cơm & Món chính
              </Link>
              <Link
                href="/menu?categoryId=2"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-1.5 text-xs text-[#334155] font-medium hover:text-[#e31837]"
              >
                • Đồ ăn vặt
              </Link>
              <Link
                href="/menu?categoryId=3"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-1.5 text-xs text-[#334155] font-medium hover:text-[#e31837]"
              >
                • Đồ uống & Tráng miệng
              </Link>
            </div>

            {/* STT 11: Link to /best-seller */}
            <Link
              href="/best-seller"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between py-2.5 px-3 rounded-lg text-[#0f172a] font-semibold hover:bg-red-50 hover:text-[#e31837] transition"
            >
              <span className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
                Món bán chạy
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded">
                Hot
              </span>
            </Link>

            <Link
              href="/group"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between py-2.5 px-3 rounded-lg text-[#0f172a] font-semibold hover:bg-red-50 hover:text-[#e31837] transition"
            >
              <span className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#e31837]" />
                Đặt đơn nhóm
              </span>
              <span className="text-[10px] font-extrabold px-2 py-0.5 bg-[#e31837] text-white rounded-full">
                -10%
              </span>
            </Link>

            <Link
              href="/orders"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between py-2.5 px-3 rounded-lg text-[#0f172a] font-semibold hover:bg-red-50 hover:text-[#e31837] transition"
            >
              <span className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-[#e31837]" />
                Tra cứu đơn hàng
              </span>
            </Link>

            {/* STT 4: Red dot badge */}
            <Link
              href="/contact"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between py-2.5 px-3 rounded-lg text-[#0f172a] font-semibold hover:bg-red-50 hover:text-[#e31837] transition"
            >
              <span className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#e31837]" />
                Liên hệ & CSKH
              </span>
              {hasUnreadSupport && (
                <span className="w-2.5 h-2.5 rounded-full bg-[#e31837] animate-pulse" />
              )}
            </Link>
          </div>

          {/* User Info & Wallet in Mobile (STT 15) */}
          {user ? (
            <div className="pt-3 border-t border-[#dddddd] space-y-2">
              <div className="px-2 py-2 bg-red-50/70 rounded-[8px] flex items-center justify-between text-[13px]">
                <span className="text-[#555a64] flex items-center gap-1.5">
                  <Wallet className="w-4 h-4 text-[#e31837]" />
                  Số dư ví ảo:
                </span>
                <strong className="text-[#e31837] font-bold">{formatVND(walletBalance)}</strong>
              </div>

              <Link
                href="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 py-2 px-2.5 rounded-lg text-[13px] font-medium text-[#181d26] hover:bg-red-50"
              >
                <UserIcon className="w-4 h-4 text-[#e31837]" />
                <span>Hồ sơ & Hạng thành viên</span>
              </Link>

              <Link
                href="/profile?tab=vouchers"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 py-2 px-2.5 rounded-lg text-[13px] font-medium text-[#e31837] hover:bg-red-50"
              >
                <Ticket className="w-4 h-4" />
                <span>Kho Voucher ưu đãi</span>
              </Link>

              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                }}
                className="w-full text-left flex items-center gap-2 py-2 px-2.5 rounded-lg text-[13px] text-[#e31837] font-medium hover:bg-red-50 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Đăng xuất ({user.fullName})</span>
              </button>
            </div>
          ) : (
            <div className="pt-2 border-t border-[#dddddd]">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#e31837] text-white rounded-lg text-sm font-semibold"
              >
                <UserIcon className="w-4 h-4" />
                <span>Đăng nhập tài khoản</span>
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
