'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  CiUser as UserIcon,
  CiCircleCheck as ShieldCheck,
  CiCreditCard2 as CreditCard,
  CiHeart as Heart,
  CiLock as KeyRound,
  CiShoppingBasket as ShoppingBag,
  CiMedal as Award,
  CiDeliveryTruck as Truck,
  CiStar as Sparkles,
  CiCircleChevRight as ChevronRight,
  CiReceipt as Copy,
  CiCircleCheck as Check,
  CiCircleAlert as AlertCircle,
  CiRedo as Loader2,
  CiRead as Eye,
  CiImageOff as EyeOff,
  CiClock2 as Clock,
  CiCircleChevRight as ArrowRight,
  CiWallet as Wallet,
  CiDiscount1 as Ticket,
} from 'react-icons/ci';
import { useAuth } from '@/context/AuthContext';
import { useFavorites } from '@/context/FavoritesContext';
import { formatVND } from '@/lib/utils';
import { getMembershipTier, MembershipTierInfo } from '@/lib/membership';
import { Product, Coupon } from '@/types';
import ProductCard from '@/components/ProductCard';
import AddressAutocompleteInput from '@/components/AddressAutocompleteInput';

function ProfileContent() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') || 'tier';

  const { user, login, getAuthHeader } = useAuth();
  const { favorites } = useFavorites();

  const [activeTab, setActiveTab] = useState<'tier' | 'vouchers' | 'favorites' | 'password' | 'info'>('tier');
  const [profileData, setProfileData] = useState<{
    stats: { totalSpent: number; orderCount: number; completedCount: number };
    tier: MembershipTierInfo;
  } | null>(null);
  const [walletBalance, setWalletBalance] = useState<number>(user?.walletBalance || 0);

  // Vouchers for vouchers tab (STT 1)
  const [allCoupons, setAllCoupons] = useState<Coupon[]>([]);
  const [voucherFilter, setVoucherFilter] = useState<string>('all');
  const [isLoadingCoupons, setIsLoadingCoupons] = useState(false);

  // Products for favorites tab
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);

  // Form states
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Password change form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passError, setPassError] = useState('');
  const [passSuccess, setPassSuccess] = useState('');
  const [isChangingPass, setIsChangingPass] = useState(false);

  // Info form
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [infoError, setInfoError] = useState('');
  const [infoSuccess, setInfoSuccess] = useState('');
  const [isSavingInfo, setIsSavingInfo] = useState(false);

  useEffect(() => {
    if (initialTab === 'vouchers' || initialTab === 'favorites' || initialTab === 'password' || initialTab === 'info') {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Fetch all coupons when entering vouchers tab
  useEffect(() => {
    if (activeTab === 'vouchers' && allCoupons.length === 0) {
      setIsLoadingCoupons(true);
      fetch('/api/coupons')
        .then((r) => r.json())
        .then((d) => {
          if (d.success && Array.isArray(d.data)) setAllCoupons(d.data);
        })
        .catch(() => {})
        .finally(() => setIsLoadingCoupons(false));
    }
  }, [activeTab, allCoupons.length]);

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '');
      setPhone(user.phone || '');
      setAddress(user.address || '');

      const fetchProfileStats = async () => {
        try {
          const res = await fetch(`/api/user/profile?userId=${user?.id}`, { headers: getAuthHeader() });
          const data = await res.json();
          if (data.success && data.data) {
            setProfileData({
              stats: data.data.stats,
              tier: data.data.tier,
            });
            if (data.data.user?.walletBalance !== undefined) {
              setWalletBalance(Number(data.data.user.walletBalance) || 0);
            }
          }
        } catch (err) {
          console.error('Lỗi tải thông tin chi tiêu:', err);
        }
      };
      fetchProfileStats();
    }
  }, [user]);

  // Load products when favorites tab is clicked
  useEffect(() => {
    if (activeTab === 'favorites' && allProducts.length === 0) {
      setIsLoadingProducts(true);
      fetch('/api/products')
        .then((r) => r.json())
        .then((d) => {
          if (d.success) setAllProducts(d.data || []);
        })
        .catch(() => {})
        .finally(() => setIsLoadingProducts(false));
    }
  }, [activeTab, allProducts.length]);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError('');
    setPassSuccess('');

    if (!currentPassword || !newPassword) {
      setPassError('Vui lòng điền mật khẩu hiện tại và mật khẩu mới');
      return;
    }

    if (newPassword.length < 6) {
      setPassError('Mật khẩu mới phải có độ dài từ 6 ký tự trở lên');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPassError('Mật khẩu xác nhận không khớp');
      return;
    }

    setIsChangingPass(true);
    try {
      const res = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || 'Đổi mật khẩu thất bại');
      }

      setPassSuccess('Đổi mật khẩu thành công!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPassError(err.message || 'Có lỗi xảy ra khi đổi mật khẩu');
    } finally {
      setIsChangingPass(false);
    }
  };

  const handleSaveInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setInfoError('');
    setInfoSuccess('');

    if (!fullName.trim()) {
      setInfoError('Họ và tên không được để trống');
      return;
    }

    setIsSavingInfo(true);
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          fullName: fullName.trim(),
          phone: phone.trim(),
          address: address.trim(),
        }),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || 'Cập nhật thất bại');
      }

      // Update auth context
      login(data.user);
      setInfoSuccess('Đã lưu thông tin cá nhân thành công!');
      setTimeout(() => setInfoSuccess(''), 3000);
    } catch (err: any) {
      setInfoError(err.message || 'Lỗi lưu thông tin');
    } finally {
      setIsSavingInfo(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center space-y-5">
        <div className="w-16 h-16 rounded-full bg-[#fff1f2] text-[#A30029] flex items-center justify-center mx-auto border border-[#fecdd3]">
          <UserIcon className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-normal text-[#181d26]">Vui lòng đăng nhập</h1>
        <p className="text-[14px] text-[#41454d]">
          Đăng nhập tài khoản để xem hạng thành viên, chi tiêu tích lũy, kho voucher và danh sách món ăn yêu thích của bạn.
        </p>
        <div className="pt-2 flex gap-3 justify-center">
          <Link
            href="/login"
            className="px-6 py-3 bg-[#A30029] hover:bg-[#850021] text-white font-medium text-[14px] rounded-[6px] shadow-xs transition"
          >
            Đăng nhập ngay
          </Link>
          <Link
            href="/menu"
            className="px-6 py-3 bg-white border border-[#dddddd] text-[#181d26] font-medium text-[14px] rounded-[6px] hover:bg-[#f8fafc] transition"
          >
            Xem thực đơn
          </Link>
        </div>
      </div>
    );
  }

  const tier = profileData?.tier || getMembershipTier(0);
  const stats = profileData?.stats || { totalSpent: 0, orderCount: 0, completedCount: 0 };
  const favoriteProductsList = allProducts.filter((p) => favorites.includes(p.id));

  return (
    <div className="bg-[#f8fafc] min-h-screen py-8 sm:py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Profile Card Header */}
        <div className="bg-white rounded-[16px] border border-[#dddddd] p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              {/* Circular Avatar Logo */}
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#A30029] text-white flex items-center justify-center text-2xl sm:text-3xl font-bold shadow-md shrink-0 border-2 border-white ring-2 ring-[#fecdd3]">
                {user.fullName ? user.fullName.charAt(0).toUpperCase() : user.username.charAt(0).toUpperCase()}
              </div>

              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-xl sm:text-2xl font-bold text-[#181d26]">
                    {user.fullName}
                  </h1>
                  <span
                    className={`inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-[12px] font-bold border shadow-2xs ${tier.bgBadge}`}
                  >
                    {tier.badge}
                  </span>
                </div>
                <p className="text-[13px] text-[#41454d]">
                  Tên đăng nhập: <strong className="text-[#181d26]">@{user.username}</strong>
                  {user.phone && <span className="ml-2">• SĐT: {user.phone}</span>}
                </p>
                <p className="text-[12px] text-[#9297a0]">
                  Thành viên NooNee từ: {user.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : '2026'}
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
              <div className="flex items-center gap-1.5 h-10 px-3.5 rounded-[8px] bg-[#eff6ff] text-[#2563eb] border border-[#bfdbfe] text-[13px] font-semibold shadow-2xs">
                <Wallet className="w-4 h-4 text-[#2563eb]" />
                <span>Ví: {formatVND(walletBalance)}</span>
              </div>
              <Link
                href="/orders"
                className="inline-flex items-center gap-1.5 h-10 px-4 rounded-[8px] bg-[#fff1f2] hover:bg-[#ffe4e6] text-[#A30029] border border-[#fecdd3] text-[13px] font-medium transition"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Đơn hàng của tôi</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-[#dddddd] bg-white rounded-t-[12px] px-2 sm:px-6 overflow-x-auto gap-2">
          <button
            onClick={() => setActiveTab('tier')}
            className={`flex items-center gap-2 py-4 px-3 sm:px-4 text-[14px] font-semibold border-b-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'tier'
                ? 'border-[#A30029] text-[#A30029]'
                : 'border-transparent text-[#41454d] hover:text-[#181d26]'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Hạng thành viên & Chi tiêu</span>
          </button>

          {/* Kho Voucher (STT 1) */}
          <button
            onClick={() => setActiveTab('vouchers')}
            className={`flex items-center gap-2 py-4 px-3 sm:px-4 text-[14px] font-semibold border-b-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'vouchers'
                ? 'border-[#A30029] text-[#A30029]'
                : 'border-transparent text-[#41454d] hover:text-[#181d26]'
            }`}
          >
            <Ticket className="w-4 h-4" />
            <span>Kho Voucher ưu đãi</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 bg-red-100 text-[#A30029] rounded-full">
              Mới
            </span>
          </button>

          <button
            onClick={() => setActiveTab('favorites')}
            className={`flex items-center gap-2 py-4 px-3 sm:px-4 text-[14px] font-semibold border-b-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'favorites'
                ? 'border-[#A30029] text-[#A30029]'
                : 'border-transparent text-[#41454d] hover:text-[#181d26]'
            }`}
          >
            <Heart className="w-4 h-4" />
            <span>Món ăn yêu thích ({favorites.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('password')}
            className={`flex items-center gap-2 py-4 px-3 sm:px-4 text-[14px] font-semibold border-b-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'password'
                ? 'border-[#A30029] text-[#A30029]'
                : 'border-transparent text-[#41454d] hover:text-[#181d26]'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>Đổi mật khẩu</span>
          </button>

          <button
            onClick={() => setActiveTab('info')}
            className={`flex items-center gap-2 py-4 px-3 sm:px-4 text-[14px] font-semibold border-b-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'info'
                ? 'border-[#A30029] text-[#A30029]'
                : 'border-transparent text-[#41454d] hover:text-[#181d26]'
            }`}
          >
            <UserIcon className="w-4 h-4" />
            <span>Thông tin cá nhân</span>
          </button>
        </div>

        {/* TAB 1: MEMBERSHIP TIER & SPENDING STATS (STT 7) */}
        {activeTab === 'tier' && (
          <div className="space-y-8">
            {/* Compact Stat Cards Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {/* Card 1: Total Spent */}
              <div className="bg-white rounded-[10px] p-3.5 sm:p-4 border border-[#dddddd] shadow-2xs space-y-1">
                <div className="flex items-center justify-between text-[#9297a0]">
                  <span className="text-[11px] font-semibold uppercase tracking-wider">Tổng tiền</span>
                  <CreditCard className="w-3.5 h-3.5 text-[#A30029]" />
                </div>
                <div className="text-lg sm:text-xl font-bold text-[#A30029] truncate">
                  {formatVND(stats.totalSpent)}
                </div>
                <p className="text-[11px] text-[#41454d] truncate">
                  {stats.completedCount} đơn thành công
                </p>
              </div>

              {/* Card 2: Current Tier */}
              <div className="bg-white rounded-[10px] p-3.5 sm:p-4 border border-[#dddddd] shadow-2xs space-y-1">
                <div className="flex items-center justify-between text-[#9297a0]">
                  <span className="text-[11px] font-semibold uppercase tracking-wider">Hạng thành viên</span>
                  <Award className="w-3.5 h-3.5 text-[#A30029]" />
                </div>
                <div className="text-lg sm:text-xl font-bold text-[#181d26] truncate">
                  {tier.name}
                </div>
                <p className="text-[11px] text-[#41454d] truncate">
                  {tier.nextTier ? `Cần thêm ${formatVND(tier.amountNeeded)}` : 'Hạng cao nhất'}
                </p>
              </div>

              {/* Card 3: Orders Count */}
              <div className="bg-white rounded-[10px] p-3.5 sm:p-4 border border-[#dddddd] shadow-2xs space-y-1">
                <div className="flex items-center justify-between text-[#9297a0]">
                  <span className="text-[11px] font-semibold uppercase tracking-wider">Đơn hàng</span>
                  <ShoppingBag className="w-3.5 h-3.5 text-[#16a34a]" />
                </div>
                <div className="text-lg sm:text-xl font-bold text-[#16a34a] truncate">
                  {stats.completedCount} đơn
                </div>
                <p className="text-[11px] text-[#41454d] truncate">
                  {stats.orderCount || stats.completedCount} đơn đã đặt
                </p>
              </div>

              {/* Card 4: Virtual Wallet */}
              <div className="bg-gradient-to-br from-white to-[#eff6ff] rounded-[10px] p-3.5 sm:p-4 border border-[#bfdbfe] shadow-2xs space-y-1">
                <div className="flex items-center justify-between text-[#2563eb]">
                  <span className="text-[11px] font-semibold uppercase tracking-wider">Số dư ví</span>
                  <Wallet className="w-3.5 h-3.5 text-[#2563eb]" />
                </div>
                <div className="text-lg sm:text-xl font-bold text-[#2563eb] truncate">
                  {formatVND(walletBalance)}
                </div>
                <p className="text-[11px] text-[#41454d] truncate">
                  {walletBalance > 0 ? 'Khả dụng trừ đơn' : 'Số dư hoàn tiền'}
                </p>
              </div>
            </div>

            {/* Tier Progress Bar Card */}
            <div className={`bg-gradient-to-r ${tier.bgGradient} bg-white rounded-[16px] p-6 sm:p-8 border shadow-xs space-y-6`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[12px] font-bold uppercase tracking-wider text-[#A30029]">
                    Hành trình thăng hạng của bạn
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold text-[#181d26] mt-1">
                    Tiến trình hạng {tier.name} ({tier.progress}%)
                  </h2>
                </div>
                {tier.nextTier && (
                  <div className="text-left sm:text-right">
                    <span className="text-[12px] text-[#41454d] block">Mục tiêu tiếp theo:</span>
                    <strong className="text-[15px] font-bold text-[#A30029]">
                      {tier.nextTier === 'Silver' && '🥈 Hạng Bạc (500k)'}
                      {tier.nextTier === 'Gold' && '🥇 Hạng Vàng (1.500k)'}
                      {tier.nextTier === 'Diamond' && '💎 Hạng Kim Cương (3.500k)'}
                    </strong>
                  </div>
                )}
              </div>

              {/* Progress Bar Visual */}
              <div className="space-y-2">
                <div className="w-full h-3.5 bg-gray-200 rounded-full overflow-hidden p-0.5">
                  <div
                    className="h-full bg-[#A30029] rounded-full transition-all duration-500 shadow-xs"
                    style={{ width: `${Math.max(5, tier.progress)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[12px] text-[#41454d] font-medium">
                  <span>{formatVND(stats.totalSpent)}</span>
                  <span>
                    {tier.nextTier ? formatVND(tier.nextSpent) : 'Cực đại (VIP Kim Cương)'}
                  </span>
                </div>
              </div>

              {/* LỢI ÍCH TO NỔI BẬT (STT 7) */}
              <div className="pt-4 border-t border-[#dddddd]/70 space-y-4">
                <h3 className="text-[15px] font-bold text-[#181d26] flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#A30029]" />
                  <span>ĐẶC QUYỀN NỔI BẬT CỦA HẠNG {tier.name.toUpperCase()}:</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                  {/* Highlight 1: Shipping Discount */}
                  <div className="bg-white/90 rounded-[12px] p-4 border border-[#dddddd] shadow-2xs space-y-1.5">
                    <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                      <Truck className="w-5 h-5" />
                    </div>
                    <h4 className="text-[13px] font-bold text-[#181d26]">Giảm Phí Giao Hàng</h4>
                    <p className="text-[18px] font-extrabold text-emerald-600">
                      {tier.shippingDiscount > 0 ? `-${formatVND(tier.shippingDiscount)}` : '0 ₫ / đơn'}
                    </p>
                    <p className="text-[11px] text-[#41454d]">
                      {tier.shippingDiscount > 0 ? 'Tự động trừ vào mọi đơn đặt hàng' : 'Lên Hạng Bạc để nhận giảm 5k ship'}
                    </p>
                  </div>

                  {/* Highlight 2: Exclusive Vouchers */}
                  <div className="bg-white/90 rounded-[12px] p-4 border border-[#dddddd] shadow-2xs space-y-1.5">
                    <div className="w-9 h-9 rounded-full bg-red-50 text-[#A30029] flex items-center justify-center font-bold">
                      <Ticket className="w-5 h-5" />
                    </div>
                    <h4 className="text-[13px] font-bold text-[#181d26]">Kho Voucher Độc Quyền</h4>
                    <p className="text-[18px] font-extrabold text-[#A30029]">
                      {tier.vouchers.length} Mã Giảm Giá
                    </p>
                    <p className="text-[11px] text-[#41454d]">
                      Được hưởng trọn bộ mã giảm giá của hạng hiện tại & các hạng trước
                    </p>
                  </div>

                  {/* Highlight 3: Priority Service */}
                  <div className="bg-white/90 rounded-[12px] p-4 border border-[#dddddd] shadow-2xs space-y-1.5">
                    <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <h4 className="text-[13px] font-bold text-[#181d26]">Dịch Vụ Ưu Tiên</h4>
                    <p className="text-[18px] font-extrabold text-blue-600">
                      {tier.tier === 'Diamond' ? 'Ưu tiên VIP 1:1' : tier.tier === 'Gold' ? 'Ưu tiên bếp nấu' : 'Ưu tiên giờ cao điểm'}
                    </p>
                    <p className="text-[11px] text-[#41454d]">
                      Chế biến siêu tốc & hỗ trợ tiếp nhận đơn nhanh chóng
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* PREVIEW NEXT TIER (STT 7: Hiện rõ số lượng tiền được giảm và mã giảm giá nhận được khi lên hạng) */}
            {tier.nextTier && (
              <div className="bg-gradient-to-br from-[#fff1f2] via-white to-[#fff9f9] rounded-[16px] p-6 sm:p-8 border-2 border-[#fecdd3] shadow-md space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#fecdd3] pb-4">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#A30029] bg-white px-2.5 py-0.5 rounded border border-[#fecdd3]">
                      Đặc quyền mở khóa kế tiếp
                    </span>
                    <h3 className="text-xl font-bold text-[#181d26] mt-1.5">
                      KHI LÊN {tier.nextTier === 'Silver' ? 'HẠNG BẠC (🥈)' : tier.nextTier === 'Gold' ? 'HẠNG VÀNG (🥇)' : 'VIP KIM CƯƠNG (💎)'} BẠN SẼ NHẬN ĐƯỢC:
                    </h3>
                  </div>
                  <div className="text-left sm:text-right shrink-0">
                    <span className="text-[12px] text-[#41454d] block">Chỉ cần chi tiêu thêm:</span>
                    <strong className="text-xl font-extrabold text-[#A30029]">
                      {formatVND(tier.amountNeeded)}
                    </strong>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Số tiền được giảm khi lên hạng */}
                  <div className="bg-white p-4 rounded-[12px] border border-[#fecdd3] space-y-2">
                    <span className="text-[11px] font-bold text-[#A30029] uppercase tracking-wider block">
                      💰 Số tiền được giảm tự động:
                    </span>
                    <div className="text-[16px] font-bold text-[#181d26]">
                      {tier.nextTier === 'Silver' && 'Giảm 5.000 ₫ phí giao hàng cho MỌI đơn'}
                      {tier.nextTier === 'Gold' && 'Giảm 10.000 ₫ phí giao hàng cho MỌI đơn'}
                      {tier.nextTier === 'Diamond' && 'Giảm cực lớn 25.000 ₫ phí giao hàng cho MỌI đơn'}
                    </div>
                    <p className="text-[12px] text-[#41454d]">
                      Không giới hạn số lần đặt món trong ngày, tự động trừ tại bước thanh toán.
                    </p>
                  </div>

                  {/* Mã giảm giá nhận được khi lên hạng */}
                  <div className="bg-white p-4 rounded-[12px] border border-[#fecdd3] space-y-2">
                    <span className="text-[11px] font-bold text-[#A30029] uppercase tracking-wider block">
                      🎟️ Mã giảm giá mới được mở khóa:
                    </span>
                    {tier.nextTier === 'Silver' && (
                      <div>
                        <div className="inline-block font-mono font-bold text-[#A30029] bg-red-50 px-2 py-0.5 rounded border border-[#fecdd3] text-[13px]">
                          SILVER10
                        </div>
                        <span className="ml-2 font-bold text-[14px] text-[#181d26]">Giảm ngay 10.000 ₫</span>
                        <p className="text-[12px] text-[#41454d] mt-1">Đơn từ 80.000 ₫ trở lên</p>
                      </div>
                    )}
                    {tier.nextTier === 'Gold' && (
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-[#A30029] bg-red-50 px-2 py-0.5 rounded border border-[#fecdd3] text-[12px]">
                            GOLD25
                          </span>
                          <span className="font-bold text-[13px] text-[#181d26]">Giảm ngay 25.000 ₫</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-[#A30029] bg-red-50 px-2 py-0.5 rounded border border-[#fecdd3] text-[12px]">
                            GOLDVIP
                          </span>
                          <span className="font-bold text-[13px] text-[#181d26]">Giảm sâu 15% tổng tiền</span>
                        </div>
                      </div>
                    )}
                    {tier.nextTier === 'Diamond' && (
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-[#A30029] bg-red-50 px-2 py-0.5 rounded border border-[#fecdd3] text-[12px]">
                            DIAMOND50
                          </span>
                          <span className="font-bold text-[13px] text-[#181d26]">Giảm ngay 50.000 ₫</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-[#A30029] bg-red-50 px-2 py-0.5 rounded border border-[#fecdd3] text-[12px]">
                            DIAMONDVIP
                          </span>
                          <span className="font-bold text-[13px] text-[#181d26]">Giảm cực lớn 20% đơn</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                  <span className="text-[12px] text-[#41454d]">
                    Đặt thêm các bữa ăn ngon tại NooNee để tích lũy chi tiêu và thăng hạng ngay hôm nay!
                  </span>
                  <Link
                    href="/menu"
                    className="h-10 px-5 bg-[#A30029] hover:bg-[#850021] text-white font-semibold text-[13px] rounded-[8px] transition flex items-center gap-2 shadow-xs shrink-0"
                  >
                    <span>Đặt món tích lũy</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            )}

            {/* Exclusive Tier Vouchers Box */}
            <div className="bg-white rounded-[16px] p-6 sm:p-8 border border-[#dddddd] shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#dddddd] pb-4">
                <div>
                  <h2 className="text-xl font-bold text-[#181d26]">
                    Voucher độc quyền theo hạng hiện tại ({tier.vouchers.length})
                  </h2>
                  <p className="text-[13px] text-[#41454d] mt-1">
                    Các mã giảm giá đã mở khóa theo chi tiêu của bạn. Sao chép và dùng tại trang thanh toán.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('vouchers')}
                  className="text-[13px] font-bold text-[#A30029] hover:underline flex items-center gap-1 cursor-pointer self-start sm:self-auto"
                >
                  <span>Mở toàn bộ Kho Voucher</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tier.vouchers.map((v) => (
                  <div
                    key={v.code}
                    className="border border-[#fecdd3] bg-[#fff1f2]/30 rounded-[12px] p-4 flex flex-col justify-between space-y-3 relative overflow-hidden"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#A30029] bg-white px-2 py-0.5 rounded border border-[#fecdd3]">
                          {v.badge || 'Đặc quyền'}
                        </span>
                        <h4 className="text-[15px] font-bold text-[#181d26] mt-2">
                          {v.name}
                        </h4>
                        <p className="text-[12px] text-[#41454d] mt-0.5">
                          {v.description}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[16px] font-bold text-[#A30029]">
                          {v.discountType === 'percentage'
                            ? `-${v.discountValue}%`
                            : `-${formatVND(v.discountValue)}`}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[#fecdd3] flex items-center justify-between gap-2">
                      <span className="text-[13px] font-mono font-bold bg-white px-3 py-1 rounded-[6px] border border-[#dddddd] text-[#181d26]">
                        {v.code}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyCode(v.code)}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#A30029] hover:bg-[#850021] text-white text-[12px] font-medium rounded-[6px] transition cursor-pointer"
                      >
                        {copiedCode === v.code ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Đã sao chép</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Sao chép mã</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: KHO VOUCHER ƯU ĐÃI (STT 1 & 2 & 3) */}
        {activeTab === 'vouchers' && (
          <div className="bg-white rounded-[16px] p-6 sm:p-8 border border-[#dddddd] shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#dddddd] pb-4">
              <div>
                <h2 className="text-xl font-bold text-[#181d26] flex items-center gap-2">
                  <Ticket className="w-6 h-6 text-[#A30029]" />
                  <span>Kho Mã Voucher & Ưu Đãi Của Bạn</span>
                </h2>
                <p className="text-[13px] text-[#41454d] mt-1">
                  Tổng hợp tất cả mã khuyến mãi cơm, nước, đơn đầu tiên, mã giảm 20/30/50% và đặc quyền thành viên.
                </p>
              </div>

              <Link
                href="/menu"
                className="h-9 px-4 bg-[#A30029] hover:bg-[#850021] text-white text-[13px] font-semibold rounded-[6px] transition flex items-center gap-1.5 self-start sm:self-auto cursor-pointer shadow-xs"
              >
                <span>Dùng mã đặt món</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Voucher Category Filter Chips */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {[
                { id: 'all', label: 'Tất cả voucher' },
                { id: 'rice', label: 'Đơn Cơm & Món chính' },
                { id: 'drinks', label: 'Đồ uống' },
                { id: 'best_seller', label: 'Món Bán chạy (1 lần)' },
                { id: 'percentage', label: 'Giảm % (20/30/50%)' },
                { id: 'fixed', label: 'Giảm tiền mặt (10k-50k)' },
                { id: 'tier', label: 'Đặc quyền thành viên' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setVoucherFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-[6px] text-[12px] font-semibold transition whitespace-nowrap cursor-pointer ${
                    voucherFilter === tab.id
                      ? 'bg-[#A30029] text-white shadow-2xs'
                      : 'bg-[#f8fafc] text-[#41454d] border border-[#dddddd] hover:bg-red-50 hover:text-[#A30029]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Coupons List */}
            {isLoadingCoupons ? (
              <div className="py-16 text-center text-gray-400 space-y-2">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#A30029]" />
                <p className="text-[13px]">Đang tải kho mã ưu đãi...</p>
              </div>
            ) : (
              (() => {
                const filtered = allCoupons.filter((c) => {
                  if (voucherFilter === 'all') return true;
                  if (voucherFilter === 'rice') return c.categoryExclusive === 'rice';
                  if (voucherFilter === 'drinks') return c.categoryExclusive === 'drinks';
                  if (voucherFilter === 'best_seller') return c.categoryExclusive === 'best_seller' || c.isOneTimeUse;
                  if (voucherFilter === 'percentage') return c.discountType === 'percentage';
                  if (voucherFilter === 'fixed') return c.discountType === 'fixed';
                  if (voucherFilter === 'tier') return Boolean(c.minTier);
                  return true;
                });

                if (filtered.length === 0) {
                  return (
                    <div className="py-12 text-center text-gray-400 space-y-2">
                      <Ticket className="w-8 h-8 mx-auto text-gray-300" />
                      <p className="text-[13px] text-[#555a64]">Không có voucher nào trong mục này</p>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map((c) => {
                      const used = c.usedCount || 0;
                      const limit = c.usageLimit || 100;
                      const percent = Math.min(100, Math.round((used / limit) * 100));

                      return (
                        <div
                          key={c.code}
                          className="border border-[#dddddd] hover:border-[#fecdd3] bg-white rounded-[12px] p-4 flex flex-col justify-between space-y-3.5 shadow-2xs hover:shadow-md transition relative group"
                        >
                          <div className="space-y-2">
                            {/* Badges */}
                            <div className="flex items-center justify-between gap-1.5 flex-wrap">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-[#A30029] bg-red-50 px-2 py-0.5 rounded border border-[#fecdd3]">
                                {c.badge || 'Ưu đãi'}
                              </span>
                              {c.isOneTimeUse && (
                                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                  1 Lần dùng
                                </span>
                              )}
                              {c.categoryExclusive === 'rice' && (
                                <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded">
                                  Cơm & Món chính
                                </span>
                              )}
                              {c.categoryExclusive === 'drinks' && (
                                <span className="text-[10px] font-semibold text-blue-800 bg-blue-50 px-1.5 py-0.5 rounded">
                                  Đồ uống
                                </span>
                              )}
                            </div>

                            {/* Title & Description */}
                            <div>
                              <h4 className="font-bold text-[14px] text-[#181d26] group-hover:text-[#A30029] transition">
                                {c.name}
                              </h4>
                              <p className="text-[12px] text-[#41454d] line-clamp-2 mt-1 leading-relaxed">
                                {c.description}
                              </p>
                            </div>

                            {/* Discount Value */}
                            <div className="pt-1 flex items-baseline gap-2">
                              <span className="text-xl font-extrabold text-[#A30029]">
                                {c.discountType === 'percentage'
                                  ? `-${c.discountValue}%`
                                  : `-${formatVND(c.discountValue)}`}
                              </span>
                              <span className="text-[11px] text-[#9297a0]">
                                {c.minOrderAmount > 0 ? `Đơn từ ${formatVND(c.minOrderAmount)}` : 'Mọi giá trị đơn'}
                              </span>
                            </div>

                            {/* Expiry & Usage Limit (STT 2) */}
                            <div className="pt-2 border-t border-[#f0f0f0] space-y-1.5 text-[11px] text-[#555a64]">
                              <div className="flex items-center justify-between">
                                <span className="flex items-center gap-1 text-gray-500">
                                  <Clock className="w-3 h-3 text-gray-400" />
                                  Hạn dùng:
                                </span>
                                <strong className="text-[#181d26]">{c.expiryDate || '31/12/2026'}</strong>
                              </div>

                              <div className="space-y-1">
                                <div className="flex items-center justify-between text-[10px] text-gray-400">
                                  <span>Đã dùng: {used}/{limit}</span>
                                  <span>{percent}%</span>
                                </div>
                                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-[#A30029] rounded-full"
                                    style={{ width: `${percent}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Code Bar & Action Buttons */}
                          <div className="pt-2 border-t border-[#f0f0f0] flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1">
                              <span className="font-mono font-bold text-[12px] bg-[#f8fafc] text-[#181d26] px-2.5 py-1 rounded border border-[#dddddd]">
                                {c.code}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopyCode(c.code)}
                                className="p-1 text-gray-400 hover:text-[#A30029] rounded transition cursor-pointer"
                                title="Sao chép mã"
                              >
                                {copiedCode === c.code ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>

                            <Link
                              href={`/menu?coupon=${c.code}`}
                              onClick={() => handleCopyCode(c.code)}
                              className="px-3 py-1 bg-[#A30029] hover:bg-[#850021] text-white text-[11px] font-semibold rounded-[4px] transition cursor-pointer"
                            >
                              Dùng ngay
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()
            )}
          </div>
        )}

        {/* TAB 3: FAVORITE DISHES */}
        {activeTab === 'favorites' && (
          <div className="bg-white rounded-[16px] p-6 sm:p-8 border border-[#dddddd] shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#dddddd]">
              <div>
                <h2 className="text-xl font-bold text-[#181d26]">
                  Món ăn yêu thích của bạn ({favorites.length})
                </h2>
                <p className="text-[13px] text-[#41454d] mt-1">
                  Danh sách những món ăn bạn đã thả tim để dễ dàng đặt lại bất cứ lúc nào
                </p>
              </div>
              <Link
                href="/menu"
                className="text-[13px] font-semibold text-[#A30029] hover:underline flex items-center gap-1"
              >
                <span>Xem thực đơn</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {isLoadingProducts ? (
              <div className="py-16 text-center space-y-3">
                <Loader2 className="w-8 h-8 animate-spin text-[#A30029] mx-auto" />
                <p className="text-[13px] text-[#41454d]">Đang tải danh sách món yêu thích...</p>
              </div>
            ) : favoriteProductsList.length === 0 ? (
              <div className="py-16 text-center space-y-4 max-w-sm mx-auto">
                <div className="w-14 h-14 rounded-full bg-[#fff1f2] text-[#A30029] flex items-center justify-center mx-auto border border-[#fecdd3]">
                  <Heart className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-medium text-[#181d26]">
                  Chưa có món ăn yêu thích nào
                </h3>
                <p className="text-[13px] text-[#41454d]">
                  Bấm vào biểu tượng trái tim trên thẻ món ăn tại thực đơn để lưu món vào danh sách này nhé!
                </p>
                <Link
                  href="/menu"
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#A30029] hover:bg-[#850021] text-white rounded-[8px] text-[13px] font-semibold transition"
                >
                  Khám phá món ngon
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {favoriteProductsList.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: CHANGE PASSWORD */}
        {activeTab === 'password' && (
          <div className="bg-white rounded-[16px] p-6 sm:p-8 border border-[#dddddd] shadow-xs max-w-xl mx-auto space-y-6">
            <div className="border-b border-[#dddddd] pb-4">
              <h2 className="text-xl font-bold text-[#181d26] flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-[#A30029]" />
                <span>Đổi mật khẩu tài khoản</span>
              </h2>
              <p className="text-[13px] text-[#41454d] mt-1">
                Để bảo vệ an toàn cho tài khoản của bạn, vui lòng không chia sẻ mật khẩu cho người khác.
              </p>
            </div>

            {passError && (
              <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-[13px] rounded-[8px] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{passError}</span>
              </div>
            )}

            {passSuccess && (
              <div className="p-3.5 bg-green-50 border border-green-200 text-green-700 text-[13px] rounded-[8px] flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0" />
                <span>{passSuccess}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-[13px] font-semibold text-[#181d26] mb-1.5">
                  Mật khẩu hiện tại
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Nhập mật khẩu bạn đang dùng"
                    className="w-full h-11 px-3.5 bg-white border border-[#dddddd] rounded-[8px] text-[13px] text-[#181d26] focus:outline-none focus:border-[#A30029] focus:ring-1 focus:ring-[#A30029] transition"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9297a0] hover:text-[#181d26]"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-[#181d26] mb-1.5">
                  Mật khẩu mới
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Tối thiểu 6 ký tự"
                  className="w-full h-11 px-3.5 bg-white border border-[#dddddd] rounded-[8px] text-[13px] text-[#181d26] focus:outline-none focus:border-[#A30029] focus:ring-1 focus:ring-[#A30029] transition"
                  required
                />
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-[#181d26] mb-1.5">
                  Xác nhận mật khẩu mới
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu mới"
                  className="w-full h-11 px-3.5 bg-white border border-[#dddddd] rounded-[8px] text-[13px] text-[#181d26] focus:outline-none focus:border-[#A30029] focus:ring-1 focus:ring-[#A30029] transition"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isChangingPass}
                className="w-full h-11 bg-[#A30029] hover:bg-[#850021] active:bg-[#6e001b] text-white font-semibold text-[14px] rounded-[8px] shadow-xs transition flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                {isChangingPass ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang cập nhật...</span>
                  </>
                ) : (
                  <span>Lưu mật khẩu mới</span>
                )}
              </button>
            </form>
          </div>
        )}

        {/* TAB 4: PERSONAL INFORMATION */}
        {activeTab === 'info' && (
          <div className="bg-white rounded-[16px] p-6 sm:p-8 border border-[#dddddd] shadow-xs max-w-xl mx-auto space-y-6">
            <div className="border-b border-[#dddddd] pb-4">
              <h2 className="text-xl font-bold text-[#181d26] flex items-center gap-2">
                <UserIcon className="w-5 h-5 text-[#A30029]" />
                <span>Thông tin cá nhân & Giao hàng</span>
              </h2>
              <p className="text-[13px] text-[#41454d] mt-1">
                Cập nhật thông tin giao hàng mặc định để đặt món nhanh hơn vào lần sau
              </p>
            </div>

            {infoError && (
              <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-[13px] rounded-[8px] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{infoError}</span>
              </div>
            )}

            {infoSuccess && (
              <div className="p-3.5 bg-green-50 border border-green-200 text-green-700 text-[13px] rounded-[8px] flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0" />
                <span>{infoSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSaveInfo} className="space-y-4">
              <div>
                <label className="block text-[13px] font-semibold text-[#181d26] mb-1.5">
                  Tên đăng nhập
                </label>
                <input
                  type="text"
                  value={user.username}
                  disabled
                  className="w-full h-11 px-3.5 bg-gray-100 border border-[#dddddd] rounded-[8px] text-[13px] text-gray-500 cursor-not-allowed"
                />
                <span className="text-[11px] text-[#9297a0] mt-1 block">Tên đăng nhập không thể thay đổi</span>
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-[#181d26] mb-1.5">
                  Họ và tên
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ví dụ: Nguyễn Văn An"
                  className="w-full h-11 px-3.5 bg-white border border-[#dddddd] rounded-[8px] text-[13px] text-[#181d26] focus:outline-none focus:border-[#A30029] focus:ring-1 focus:ring-[#A30029] transition"
                  required
                />
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-[#181d26] mb-1.5">
                  Số điện thoại nhận hàng
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Ví dụ: 0912345678"
                  className="w-full h-11 px-3.5 bg-white border border-[#dddddd] rounded-[8px] text-[13px] text-[#181d26] focus:outline-none focus:border-[#A30029] focus:ring-1 focus:ring-[#A30029] transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[13px] font-semibold text-[#181d26]">
                  Địa chỉ giao hàng mặc định
                </label>
                <AddressAutocompleteInput
                  value={address}
                  onChange={(addr) => setAddress(addr)}
                  placeholder="Nhập địa chỉ nhận hàng để tự động gợi ý..."
                />
              </div>

              <button
                type="submit"
                disabled={isSavingInfo}
                className="w-full h-11 bg-[#A30029] hover:bg-[#850021] active:bg-[#6e001b] text-white font-semibold text-[14px] rounded-[8px] shadow-xs transition flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                {isSavingInfo ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang lưu...</span>
                  </>
                ) : (
                  <span>Lưu thay đổi</span>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="py-24 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#A30029] mx-auto" />
        </div>
      }
    >
      <ProfileContent />
    </Suspense>
  );
}
