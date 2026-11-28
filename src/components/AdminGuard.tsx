'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  CiCircleCheck as ShieldCheck,
  CiLock as Lock,
  CiUser as UserIcon,
  CiCircleAlert as AlertCircle,
  CiCircleChevLeft as ArrowLeft,
  CiRedo as Loader2,
} from 'react-icons/ci';
import { useAuth } from '@/context/AuthContext';
import HypotrochoidLoader from '@/components/HypotrochoidLoader';

const MANAGER_ALLOWED_PATHS = [
  '/admin',
  '/admin/orders',
  '/admin/kitchen',
  '/admin/pos',
  '/admin/tables',
  '/admin/logs',
  '/admin/products',
];
const STAFF_ALLOWED_PATHS = ['/admin/orders', '/admin/kitchen', '/admin/pos'];

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, login, logout, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isPortalUser =
    Boolean(user) && (user?.role === 'admin' || user?.role === 'manager' || user?.role === 'staff');

  const isRouteAllowed = React.useMemo(() => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    if (user.role === 'manager') return MANAGER_ALLOWED_PATHS.includes(pathname);
    if (user.role === 'staff') return STAFF_ALLOWED_PATHS.includes(pathname);
    return false;
  }, [user, pathname]);

  useEffect(() => {
    if (isLoading || !user || !isPortalUser) return;
    if (!isRouteAllowed) {
      if (user.role === 'staff') {
        router.replace('/admin/orders');
      } else if (user.role === 'manager') {
        router.replace('/admin');
      }
    }
  }, [isLoading, user, isPortalUser, isRouteAllowed, router]);

  // 1. Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-4">
        <HypotrochoidLoader
          size={110}
          label="Đang kiểm tra quyền quản trị..."
        />
      </div>
    );
  }

  // 2. User is logged in with portal role -> Render Admin UI (or redirect if route restricted)
  if (user && isPortalUser) {
    if (!isRouteAllowed) {
      return (
        <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-4">
          <HypotrochoidLoader
            size={90}
            label="Đang chuyển về khu vực được phân quyền..."
          />
        </div>
      );
    }
    return <>{children}</>;
  }

  // 3. User is NOT logged in or is customer -> Show Admin Login Form
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!username.trim() || !password) {
      setErrorMsg('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          password,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || 'Đăng nhập không thành công');
      }

      const role = data.user?.role;
      if (role !== 'admin' && role !== 'manager' && role !== 'staff') {
        throw new Error('Tài khoản khách hàng không có quyền truy cập trang quản trị');
      }

      login(data.user);
      if (role === 'staff') {
        router.replace('/admin/orders');
      } else {
        router.replace('/admin');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Có lỗi xảy ra khi xác thực');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-14 h-14 rounded-[12px] bg-[#A30029] text-white flex items-center justify-center mx-auto shadow-md">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h2 className="mt-4 text-2xl font-bold tracking-tight text-[#181d26]">
          Cổng Quản Trị Hệ Thống
        </h2>
        <p className="mt-1 text-[13px] text-[#9297a0]">
          Vui lòng đăng nhập tài khoản Quản trị viên để truy cập hệ thống
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 sm:px-8 shadow-sm rounded-[12px] border border-[#dddddd] space-y-6">
          {/* Notification if current user is customer */}
          {user && user.role !== 'admin' && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-[8px] text-[13px] text-amber-800 space-y-2">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  Bạn đang đăng nhập với tài khoản <strong>{user.username}</strong> (Khách hàng). Tài khoản này không có quyền truy cập trang quản trị.
                </span>
              </div>
              <button
                type="button"
                onClick={logout}
                className="text-[12px] font-semibold text-[#A30029] hover:underline block"
              >
                Đăng xuất tài khoản này để đăng nhập Admin
              </button>
            </div>
          )}

          {errorMsg && (
            <div className="p-3.5 bg-[#fff1f2] border border-[#fecdd3] text-[#A30029] rounded-[8px] text-[13px] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-[#181d26] block">
                Tài khoản Quản trị (Username)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#9297a0]">
                  <UserIcon className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  className="w-full h-11 pl-10 pr-3.5 text-[14px] text-[#181d26] bg-white border border-[#dddddd] rounded-[8px] focus:outline-none focus:border-[#A30029] focus:ring-1 focus:ring-[#A30029] transition"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-[#181d26] block">
                Mật khẩu Quản trị
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#9297a0]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-11 pl-10 pr-3.5 text-[14px] text-[#181d26] bg-white border border-[#dddddd] rounded-[8px] focus:outline-none focus:border-[#A30029] focus:ring-1 focus:ring-[#A30029] transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 bg-[#A30029] hover:bg-[#850021] active:bg-[#6e001b] text-white font-medium text-[14px] rounded-[8px] flex items-center justify-center gap-2 transition disabled:opacity-50 shadow-xs mt-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang xác thực...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Đăng nhập quyền Admin</span>
                </>
              )}
            </button>
          </form>

          <div className="pt-4 border-t border-[#dddddd] text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-[13px] text-[#41454d] hover:text-[#A30029] transition font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Quay về trang mua sắm</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
