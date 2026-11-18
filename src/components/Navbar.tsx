'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  CiShoppingBasket,
  CiUser,
  CiCircleCheck,
  CiMenuBurger,
  CiCircleRemove,
  CiCircleChevDown,
  CiHeart,
  CiLock,
  CiLogout,
  CiBowlNoodles,
  CiForkAndKnife,
  CiCoffeeCup,
  CiBurger,
  CiPhone,
  CiCircleQuestion,
  CiWallet,
  CiDiscount1,
} from 'react-icons/ci';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { formatVND } from '@/lib/utils';
import BranchSelector from '@/components/BranchSelector';

export default function Navbar() {
  const pathname = usePathname();
  const { totalItems, setIsCartOpen } = useCart();
  const { user, logout } = useAuth();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [menuDropdownOpen, setMenuDropdownOpen] = useState(false);
  const [hasUnreadSupport, setHasUnreadSupport] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number>(user?.walletBalance || 0);
  const [isCartBumping, setIsCartBumping] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (totalItems > 0) {
      setIsCartBumping(true);
      const timer = setTimeout(() => setIsCartBumping(false), 500);
      return () => clearTimeout(timer);
    }
  }, [totalItems]);

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
    { name: 'Tất cả thực đơn', href: '/menu', icon: CiForkAndKnife, desc: 'Hơn 50+ món ngon chuẩn vị' },
    { name: 'Cơm', href: '/menu?categoryId=1', icon: CiForkAndKnife, desc: 'Cơm rang, cơm tấm sườn' },
    { name: 'Bún mì', href: '/menu?categoryId=4', icon: CiBowlNoodles, desc: 'Bún bò Huế, bún trộn, mì xào' },
    { name: 'Phở', href: '/menu?categoryId=5', icon: CiBowlNoodles, desc: 'Phở bò tái nạm gia truyền' },
    { name: 'Đồ ăn vặt', href: '/menu?categoryId=2', icon: CiBurger, desc: 'Bánh tráng trộn, khoai chiên' },
    { name: 'Đồ uống & Tráng miệng', href: '/menu?categoryId=3', icon: CiCoffeeCup, desc: 'Trà sữa, trà đào, sữa chua' },
  ];

  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-300 border-b ${
        isScrolled
          ? 'bg-white/90 backdrop-blur-xl border-[#e6d6c8] shadow-[0_6px_24px_-6px_rgba(15,23,42,0.08)]'
          : 'bg-[#FFFAF0]/90 backdrop-blur-md border-[#ebdcd0]/80'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 lg:gap-4">
        {/* Left: Brand Wordmark */}
        <div className="flex items-center gap-6 shrink-0">
          <Link href="/" className="flex items-center gap-1 group py-1">
            <span className="font-friem text-3xl tracking-wide text-[#0f172a] group-hover:text-[#A30029] transition-colors">
              NooNee<span className="text-[#A30029]">.</span>
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-1.5 text-[14px]">
            {/* Thực đơn Dropdown - Clickable Link to /menu */}
            <div
              className="relative"
              ref={menuDropdownRef}
              onMouseEnter={() => setMenuDropdownOpen(true)}
              onMouseLeave={() => setMenuDropdownOpen(false)}
            >
              <Link
                href="/menu"
                onClick={() => setMenuDropdownOpen(false)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium transition-all cursor-pointer ${
                  pathname.startsWith('/menu') && !pathname.includes('deal=true')
                    ? 'bg-red-50 text-[#A30029] font-bold'
                    : 'text-[#1e293b] hover:text-[#A30029] hover:bg-red-50/70 font-semibold'
                }`}
              >
                <span>Thực đơn</span>
                <CiCircleChevDown
                  className={`w-4 h-4 transition-transform duration-200 stroke-1 ${
                    menuDropdownOpen ? 'rotate-180 text-[#A30029]' : 'text-[#64748b]'
                  }`}
                />
              </Link>

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
                            <div className="w-8 h-8 rounded-md bg-red-50 text-[#A30029] flex items-center justify-center shrink-0 group-hover:bg-[#A30029] group-hover:text-white transition">
                              <Icon className="w-5 h-5 stroke-1" />
                            </div>
                            <div>
                              <p className="text-[13px] font-bold text-[#0f172a] group-hover:text-[#A30029]">
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
                  ? 'bg-red-50 text-[#A30029] font-bold'
                  : 'text-[#1e293b] hover:text-[#A30029] hover:bg-red-50/70 font-semibold'
              }`}
            >
              <CiBowlNoodles className="w-5 h-5 text-amber-500 stroke-1" />
              <span>Bán chạy</span>
            </Link>

            {/* Đơn nhóm */}
            <Link
              href="/group"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium transition-all ${
                pathname.startsWith('/group')
                  ? 'bg-red-50 text-[#A30029] font-bold'
                  : 'text-[#1e293b] hover:text-[#A30029] hover:bg-red-50/70 font-semibold'
              }`}
            >
              <CiUser className="w-5 h-5 text-[#A30029] stroke-1" />
              <span>Đơn nhóm</span>
              <span className="text-[10px] font-extrabold px-1.5 py-0.5 bg-gradient-to-r from-[#A30029] to-pink-500 text-white rounded-full shadow-xs animate-pulse">
                -10%
              </span>
            </Link>

            {/* Đơn hàng */}
            <Link
              href="/orders"
              className={`flex items-center gap-1 px-3 py-2 rounded-lg font-medium transition-all ${
                pathname.startsWith('/orders')
                  ? 'bg-red-50 text-[#A30029] font-bold'
                  : 'text-[#1e293b] hover:text-[#A30029] hover:bg-red-50/70 font-semibold'
              }`}
            >
              <span>Đơn hàng</span>
            </Link>

            {/* Liên hệ (STT 4: Red dot badge when staff replied) */}
            <Link
              href="/contact"
              className={`relative flex items-center gap-1 px-3 py-2 rounded-lg font-medium transition-all ${
                pathname === '/contact'
                  ? 'bg-red-50 text-[#A30029] font-bold'
                  : 'text-[#1e293b] hover:text-[#A30029] hover:bg-red-50/70 font-semibold'
              }`}
            >
              <span>Liên hệ</span>
              {hasUnreadSupport && (
                <span className="w-2.5 h-2.5 rounded-full bg-[#A30029] animate-pulse ring-2 ring-white absolute top-1 right-1" />
              )}
            </Link>
          </nav>
        </div>

        {/* Spacer to push actions to right */}
        <div className="flex-1" />

        {/* Right Action Cluster */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {/* Branch Selector */}
          <BranchSelector />

          {/* Cart Drawer Trigger */}
          <button
            onClick={() => setIsCartOpen(true)}
            className={`flex items-center gap-1.5 sm:gap-2 h-9 sm:h-10 px-2.5 sm:px-3.5 rounded-lg border transition shadow-2xs cursor-pointer ${
              isCartBumping
                ? 'border-[#A30029] bg-rose-50 text-[#A30029] scale-105 shadow-md shadow-red-500/15'
                : 'border-[#dddddd] hover:border-[#A30029] bg-white text-[#181d26] hover:text-[#A30029] hover:bg-red-50/30'
            } text-[13px] font-medium duration-200`}
            aria-label="Giỏ hàng"
          >
            <CiShoppingBasket className={`w-5 h-5 text-inherit stroke-1 ${isCartBumping ? 'animate-bounce' : ''}`} />
            <span className="hidden sm:inline">Giỏ hàng</span>
            {totalItems > 0 && (
              <span className={`inline-flex items-center justify-center min-w-[18px] h-4.5 sm:min-w-[20px] sm:h-5 px-1 sm:px-1.5 text-[10px] sm:text-[11px] font-bold bg-[#A30029] text-white rounded-full transition-transform ${isCartBumping ? 'scale-125' : ''}`}>
                {totalItems}
              </span>
            )}
          </button>

          {/* User Account / Avatar Dropdown */}
          {user ? (
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="h-9 sm:h-10 px-2 sm:px-2.5 rounded-lg border border-[#dddddd] hover:border-[#A30029] flex items-center gap-1.5 sm:gap-2 bg-white hover:bg-red-50/40 transition shadow-2xs cursor-pointer"
                aria-label="Hồ sơ tài khoản"
                title={`Tài khoản: ${user.fullName || user.username}`}
              >
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#A30029] text-white flex items-center justify-center text-[11px] sm:text-[12px] font-bold shadow-xs">
                  {user.fullName ? user.fullName.charAt(0).toUpperCase() : user.username.charAt(0).toUpperCase()}
                </div>
                <span className="hidden md:inline text-[13px] font-semibold text-[#181d26] max-w-[100px] truncate">
                  {user.fullName || user.username}
                </span>
                <CiCircleChevDown className="w-4 h-4 text-[#9297a0] hidden sm:inline stroke-1" />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-[#dddddd] py-2 z-50 text-[13px] divide-y divide-[#f0f0f0] animate-in fade-in slide-in-from-top-1 duration-150">
                  {/* User Info & Wallet Balance Header */}
                  <div className="px-4 py-3 bg-gradient-to-r from-red-50/80 via-white to-amber-50/50">
                    <p className="font-semibold text-[#181d26] text-[14px] truncate">{user.fullName}</p>
                    <p className="text-[12px] text-[#9297a0] truncate">@{user.username}</p>

                    <div className="mt-2.5 pt-2 border-t border-red-100 flex items-center justify-between">
                      <span className="text-[12px] text-[#555a64] flex items-center gap-1 font-medium">
                        <CiWallet className="w-4 h-4 text-[#A30029] stroke-1" />
                        Số dư ví:
                      </span>
                      <span className="text-[13px] font-bold text-[#A30029]">
                        {formatVND(walletBalance)}
                      </span>
                    </div>
                  </div>

                  <div className="py-1">
                    <Link
                      href="/profile"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-[#333840] hover:bg-[#fff1f2] hover:text-[#A30029] transition font-medium"
                    >
                      <CiUser className="w-4 h-4 text-[#A30029] stroke-1" />
                      <span>Hồ sơ & Hạng thành viên</span>
                    </Link>

                    {/* Kho Voucher */}
                    <Link
                      href="/profile?tab=vouchers"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-[#333840] hover:bg-[#fff1f2] hover:text-[#A30029] transition font-medium"
                    >
                      <CiDiscount1 className="w-4 h-4 text-[#A30029] stroke-1" />
                      <div className="flex items-center justify-between w-full">
                        <span>Kho Voucher của tôi</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 bg-red-100 text-[#A30029] rounded-full">
                          Hot
                        </span>
                      </div>
                    </Link>

                    <Link
                      href="/profile?tab=favorites"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-[#333840] hover:bg-[#fff1f2] hover:text-[#A30029] transition font-medium"
                    >
                      <CiHeart className="w-4 h-4 text-[#A30029] stroke-1" />
                      <span>Món ăn yêu thích</span>
                    </Link>

                    <Link
                      href="/profile?tab=password"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-[#333840] hover:bg-[#fff1f2] hover:text-[#A30029] transition font-medium"
                    >
                      <CiLock className="w-4 h-4 text-[#A30029] stroke-1" />
                      <span>Đổi mật khẩu</span>
                    </Link>

                    <Link
                      href="/orders"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-[#333840] hover:bg-[#fff1f2] hover:text-[#A30029] transition font-medium"
                    >
                      <CiShoppingBasket className="w-4 h-4 text-[#A30029] stroke-1" />
                      <span>Đơn hàng của tôi</span>
                    </Link>

                    {(user.role === 'admin' || user.role === 'manager' || user.role === 'staff') && (
                      <Link
                        href={user.role === 'staff' ? '/admin/orders' : '/admin'}
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-[#A30029] hover:bg-[#fff1f2] transition font-semibold border-t border-[#f1f5f9] mt-1 pt-2"
                      >
                        <CiCircleCheck className="w-4 h-4 text-[#A30029] stroke-1" />
                        <span>Trang quản trị</span>
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
                      className="w-full text-left flex items-center gap-2.5 px-4 py-2 text-[#A30029] hover:bg-[#fff1f2] font-medium transition cursor-pointer"
                    >
                      <CiLogout className="w-4 h-4 stroke-1" />
                      <span>Đăng xuất</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 h-9 sm:h-10 px-2.5 sm:px-3.5 rounded-lg text-[13px] text-[#333840] hover:text-[#A30029] hover:bg-red-50/60 font-medium transition"
            >
              <CiUser className="w-4 h-4 stroke-1" />
              <span className="hidden sm:inline">Đăng nhập</span>
            </Link>
          )}

          {/* Primary CTA - Red Button */}
          <Link
            href="/menu"
            className="hidden sm:inline-flex items-center justify-center h-10 px-4 rounded-lg bg-[#A30029] hover:bg-[#850021] text-white text-[13px] font-semibold shadow-xs transition hover:scale-[1.02] active:scale-95"
          >
            Đặt món ngay
          </Link>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-1.5 sm:p-2 text-[#0f172a] hover:text-[#A30029] rounded-lg hover:bg-gray-100 transition relative"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <CiCircleRemove className="w-6 h-6 stroke-1" /> : <CiMenuBurger className="w-5 h-5 stroke-1" />}
            {hasUnreadSupport && (
              <span className="w-2 h-2 rounded-full bg-[#A30029] ring-2 ring-white absolute top-1 right-1 animate-pulse" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#FFFAF0] border-t border-[#ebdcd0] px-4 py-4 space-y-3 shadow-lg animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="pb-2 border-b border-[#ebdcd0]">
            <BranchSelector />
          </div>
          <div className="space-y-1 text-sm font-medium">
            <Link
              href="/menu"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between py-2.5 px-3 rounded-lg text-[#0f172a] font-semibold hover:bg-red-50 hover:text-[#A30029] transition"
            >
              <span className="flex items-center gap-2">
                <CiForkAndKnife className="w-5 h-5 text-[#A30029] stroke-1" />
                Tất cả thực đơn
              </span>
            </Link>

            <div className="pl-6 space-y-1">
              <Link
                href="/menu?categoryId=1"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-1.5 text-xs text-[#334155] font-medium hover:text-[#A30029]"
              >
                • Cơm
              </Link>
              <Link
                href="/menu?categoryId=4"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-1.5 text-xs text-[#334155] font-medium hover:text-[#A30029]"
              >
                • Bún mì
              </Link>
              <Link
                href="/menu?categoryId=5"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-1.5 text-xs text-[#334155] font-medium hover:text-[#A30029]"
              >
                • Phở
              </Link>
              <Link
                href="/menu?categoryId=2"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-1.5 text-xs text-[#334155] font-medium hover:text-[#A30029]"
              >
                • Đồ ăn vặt
              </Link>
              <Link
                href="/menu?categoryId=3"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-1.5 text-xs text-[#334155] font-medium hover:text-[#A30029]"
              >
                • Đồ uống & Tráng miệng
              </Link>
            </div>

            {/* STT 11: Link to /best-seller */}
            <Link
              href="/best-seller"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between py-2.5 px-3 rounded-lg text-[#0f172a] font-semibold hover:bg-red-50 hover:text-[#A30029] transition"
            >
              <span className="flex items-center gap-2">
                <CiBowlNoodles className="w-5 h-5 text-amber-500 stroke-1" />
                Món bán chạy
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded">
                Hot
              </span>
            </Link>

            <Link
              href="/group"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between py-2.5 px-3 rounded-lg text-[#0f172a] font-semibold hover:bg-red-50 hover:text-[#A30029] transition"
            >
              <span className="flex items-center gap-2">
                <CiUser className="w-5 h-5 text-[#A30029] stroke-1" />
                Đặt đơn nhóm
              </span>
              <span className="text-[10px] font-extrabold px-2 py-0.5 bg-[#A30029] text-white rounded-full">
                -10%
              </span>
            </Link>

            <Link
              href="/orders"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between py-2.5 px-3 rounded-lg text-[#0f172a] font-semibold hover:bg-red-50 hover:text-[#A30029] transition"
            >
              <span className="flex items-center gap-2">
                <CiShoppingBasket className="w-5 h-5 text-[#A30029] stroke-1" />
                Tra cứu đơn hàng
              </span>
            </Link>

            {/* STT 4: Red dot badge */}
            <Link
              href="/contact"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between py-2.5 px-3 rounded-lg text-[#0f172a] font-semibold hover:bg-red-50 hover:text-[#A30029] transition"
            >
              <span className="flex items-center gap-2">
                <CiPhone className="w-5 h-5 text-[#A30029] stroke-1" />
                Liên hệ & CSKH
              </span>
              {hasUnreadSupport && (
                <span className="w-2.5 h-2.5 rounded-full bg-[#A30029] animate-pulse" />
              )}
            </Link>
          </div>

          {/* User Info & Wallet in Mobile */}
          {user ? (
            <div className="pt-3 border-t border-[#dddddd] space-y-2">
              <div className="px-2 py-2 bg-red-50/70 rounded-[8px] flex items-center justify-between text-[13px]">
                <span className="text-[#555a64] flex items-center gap-1.5">
                  <CiWallet className="w-4 h-4 text-[#A30029] stroke-1" />
                  Số dư ví:
                </span>
                <strong className="text-[#A30029] font-bold">{formatVND(walletBalance)}</strong>
              </div>

              <Link
                href="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 py-2 px-2.5 rounded-lg text-[13px] font-medium text-[#181d26] hover:bg-red-50"
              >
                <CiUser className="w-4 h-4 text-[#A30029] stroke-1" />
                <span>Hồ sơ & Hạng thành viên</span>
              </Link>

              <Link
                href="/profile?tab=vouchers"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 py-2 px-2.5 rounded-lg text-[13px] font-medium text-[#A30029] hover:bg-red-50"
              >
                <CiDiscount1 className="w-4 h-4 stroke-1" />
                <span>Kho Voucher ưu đãi</span>
              </Link>

              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                }}
                className="w-full text-left flex items-center gap-2 py-2 px-2.5 rounded-lg text-[13px] text-[#A30029] font-medium hover:bg-red-50 cursor-pointer"
              >
                <CiLogout className="w-4 h-4 stroke-1" />
                <span>Đăng xuất ({user.fullName})</span>
              </button>
            </div>
          ) : (
            <div className="pt-2 border-t border-[#dddddd]">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#A30029] text-white rounded-lg text-sm font-semibold"
              >
                <CiUser className="w-5 h-5 stroke-1" />
                <span>Đăng nhập tài khoản</span>
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
