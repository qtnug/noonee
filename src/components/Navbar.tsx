'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Search,
  ShoppingBag,
  User as UserIcon,
  ShieldCheck,
  Menu,
  X,
  ChevronDown,
  Heart,
  KeyRound,
  LogOut,
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { totalItems, setIsCartOpen } = useCart();
  const { user, logout } = useAuth();
  const [searchInput, setSearchInput] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Hide on admin pages
  if (pathname.startsWith('/admin')) {
    return null;
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      router.push(`/menu?search=${encodeURIComponent(searchInput.trim())}`);
    } else {
      router.push('/menu');
    }
  };

  const navLinks = [
    { name: 'Thực đơn', href: '/menu' },
    { name: 'Cơm & Món chính', href: '/menu?categoryId=1' },
    { name: 'Đồ ăn vặt', href: '/menu?categoryId=2' },
    { name: 'Đồ uống', href: '/menu?categoryId=3' },
    { name: 'Đơn hàng', href: '/orders' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-[#dddddd]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand Wordmark + Primary Nav */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="font-bold text-2xl tracking-tight text-[#181d26]">
              NooNee<span className="text-[#e31837]">.</span>
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-6 text-[14px] text-[#333840]">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`transition-colors py-1 hover:text-[#e31837] ${
                    isActive ? 'text-[#e31837] font-semibold border-b-2 border-[#e31837]' : 'text-[#41454d]'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Center: Search Box */}
        <form
          onSubmit={handleSearch}
          className="hidden md:flex flex-1 max-w-md mx-4 relative items-center"
        >
          <div className="relative w-full">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Tìm kiếm món ăn, ví dụ: Phở bò, Cơm tấm..."
              className="w-full h-10 pl-9 pr-4 text-[13px] text-[#181d26] bg-white border border-[#dddddd] rounded-[6px] focus:outline-none focus:border-[#e31837] focus:ring-1 focus:ring-[#e31837] transition-colors placeholder:text-[#9297a0]"
            />
            <Search className="w-4 h-4 text-[#9297a0] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </form>

        {/* Right Action Cluster */}
        <div className="flex items-center gap-3">
          {/* Mobile search button */}
          <Link
            href="/menu"
            className="md:hidden p-2 text-[#333840] hover:text-[#e31837]"
            aria-label="Tìm kiếm"
          >
            <Search className="w-5 h-5" />
          </Link>

          {/* Cart Drawer Trigger */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="flex items-center gap-2 h-10 px-3.5 rounded-[6px] border border-[#dddddd] hover:border-[#e31837] bg-white text-[#181d26] hover:text-[#e31837] text-[13px] font-medium transition"
            aria-label="Giỏ hàng"
          >
            <ShoppingBag className="w-4 h-4 text-inherit" />
            <span className="hidden sm:inline">Giỏ hàng</span>
            {totalItems > 0 && (
              <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[11px] font-bold bg-[#e31837] text-white rounded-full">
                {totalItems}
              </span>
            )}
          </button>

          {/* User Account / Avatar Dropdown (Icon Only, No Name) */}
          {user ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="w-10 h-10 rounded-full border border-[#dddddd] hover:border-[#e31837] flex items-center justify-center bg-white hover:bg-[#fff1f2] transition shadow-2xs cursor-pointer p-0.5"
                aria-label="Hồ sơ tài khoản"
                title={`Tài khoản: ${user.fullName || user.username}`}
              >
                <div className="w-8 h-8 rounded-full bg-[#e31837] text-white flex items-center justify-center text-[13px] font-bold shadow-xs">
                  {user.fullName ? user.fullName.charAt(0).toUpperCase() : user.username.charAt(0).toUpperCase()}
                </div>
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-60 bg-white rounded-[12px] shadow-xl border border-[#dddddd] py-2 z-50 text-[13px] divide-y divide-[#f0f0f0]">
                  <div className="px-4 py-3">
                    <p className="font-semibold text-[#181d26] text-[14px] truncate">{user.fullName}</p>
                    <p className="text-[12px] text-[#9297a0] truncate">@{user.username}</p>
                  </div>
                  <div className="py-1">
                    <Link
                      href="/profile"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-[#333840] hover:bg-[#fff1f2] hover:text-[#e31837] transition font-medium"
                    >
                      <UserIcon className="w-4 h-4 text-[#e31837]" />
                      <span>Hồ sơ & Hạng thành viên</span>
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
                      className="flex items-center gap-2.5 px-4 py-2 text-[#333840] hover:bg-[#f8fafc] transition"
                    >
                      <ShoppingBag className="w-4 h-4 text-[#9297a0]" />
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
              className="inline-flex items-center gap-1.5 h-10 px-3.5 rounded-[6px] text-[13px] text-[#333840] hover:text-[#e31837] font-medium transition"
            >
              <UserIcon className="w-4 h-4" />
              <span>Đăng nhập</span>
            </Link>
          )}

          {/* Primary CTA - Red Button */}
          <Link
            href="/menu"
            className="inline-flex items-center justify-center h-10 px-4 rounded-[6px] bg-[#e31837] hover:bg-[#be0e27] text-white text-[13px] font-medium shadow-xs transition"
          >
            Đặt món ngay
          </Link>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-[#333840] hover:text-[#e31837]"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-t border-[#dddddd] px-4 py-4 space-y-3">
          <form onSubmit={handleSearch} className="mb-4">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Tìm kiếm món ăn..."
              className="w-full h-10 px-3 text-[13px] text-[#181d26] bg-white border border-[#dddddd] rounded-[6px] focus:outline-none focus:border-[#e31837]"
            />
          </form>
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-[14px] text-[#333840] hover:text-[#e31837] border-b border-[#f1f5f9]"
            >
              {link.name}
            </Link>
          ))}

          {user && (
            <div className="pt-2 space-y-1">
              <Link
                href="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 py-2 text-[14px] font-medium text-[#e31837] border-b border-[#f1f5f9]"
              >
                <UserIcon className="w-4 h-4" />
                <span>Hồ sơ & Hạng thành viên</span>
              </Link>
              <Link
                href="/profile?tab=favorites"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 py-2 text-[14px] text-[#333840] hover:text-[#e31837] border-b border-[#f1f5f9]"
              >
                <Heart className="w-4 h-4" />
                <span>Món ăn yêu thích</span>
              </Link>
              <Link
                href="/profile?tab=password"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 py-2 text-[14px] text-[#333840] hover:text-[#e31837] border-b border-[#f1f5f9]"
              >
                <KeyRound className="w-4 h-4" />
                <span>Đổi mật khẩu</span>
              </Link>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                }}
                className="w-full text-left flex items-center gap-2 py-2 text-[14px] text-[#e31837] font-medium"
              >
                <LogOut className="w-4 h-4" />
                <span>Đăng xuất ({user.fullName})</span>
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
