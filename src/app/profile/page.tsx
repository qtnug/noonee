'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  User as UserIcon,
  ShieldCheck,
  CreditCard,
  Heart,
  KeyRound,
  ShoppingBag,
  Award,
  Truck,
  Sparkles,
  ChevronRight,
  Copy,
  Check,
  AlertCircle,
  Loader2,
  Lock,
  Eye,
  EyeOff,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useFavorites } from '@/context/FavoritesContext';
import { formatVND } from '@/lib/utils';
import { getMembershipTier, MembershipTierInfo } from '@/lib/membership';
import { Product } from '@/types';
import ProductCard from '@/components/ProductCard';

function ProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') || 'tier';

  const { user, login } = useAuth();
  const { favorites } = useFavorites();

  const [activeTab, setActiveTab] = useState<'tier' | 'favorites' | 'password' | 'info'>('tier');
  const [profileData, setProfileData] = useState<{
    stats: { totalSpent: number; orderCount: number; completedCount: number };
    tier: MembershipTierInfo;
  } | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

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
    if (initialTab === 'favorites' || initialTab === 'password' || initialTab === 'info') {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '');
      setPhone(user.phone || '');
      setAddress(user.address || '');

      const fetchProfileStats = async () => {
        try {
          const res = await fetch(`/api/user/profile?userId=${user?.id}`);
          const data = await res.json();
          if (data.success && data.data) {
            setProfileData({
              stats: data.data.stats,
              tier: data.data.tier,
            });
          }
        } catch (err) {
          console.error('Lỗi tải thông tin chi tiêu:', err);
        } finally {
          setIsLoadingStats(false);
        }
      };
      fetchProfileStats();
    } else {
      setIsLoadingStats(false);
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
        <div className="w-16 h-16 rounded-full bg-[#fff1f2] text-[#e31837] flex items-center justify-center mx-auto border border-[#fecdd3]">
          <UserIcon className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-normal text-[#181d26]">Vui lòng đăng nhập</h1>
        <p className="text-[14px] text-[#41454d]">
          Đăng nhập tài khoản để xem hạng thành viên, chi tiêu tích lũy, kho voucher và danh sách món ăn yêu thích của bạn.
        </p>
        <div className="pt-2 flex gap-3 justify-center">
          <Link
            href="/login"
            className="px-6 py-3 bg-[#e31837] hover:bg-[#be0e27] text-white font-medium text-[14px] rounded-[12px] shadow-xs transition"
          >
            Đăng nhập ngay
          </Link>
          <Link
            href="/menu"
            className="px-6 py-3 bg-white border border-[#dddddd] text-[#181d26] font-medium text-[14px] rounded-[12px] hover:bg-[#f8fafc] transition"
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
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#e31837] text-white flex items-center justify-center text-2xl sm:text-3xl font-bold shadow-md shrink-0 border-2 border-white ring-2 ring-[#fecdd3]">
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
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <Link
                href="/orders"
                className="inline-flex items-center gap-1.5 h-10 px-4 rounded-[8px] bg-[#fff1f2] hover:bg-[#ffe4e6] text-[#e31837] border border-[#fecdd3] text-[13px] font-medium transition"
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
                ? 'border-[#e31837] text-[#e31837]'
                : 'border-transparent text-[#41454d] hover:text-[#181d26]'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Hạng thành viên & Chi tiêu</span>
          </button>

          <button
            onClick={() => setActiveTab('favorites')}
            className={`flex items-center gap-2 py-4 px-3 sm:px-4 text-[14px] font-semibold border-b-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'favorites'
                ? 'border-[#e31837] text-[#e31837]'
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
                ? 'border-[#e31837] text-[#e31837]'
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
                ? 'border-[#e31837] text-[#e31837]'
                : 'border-transparent text-[#41454d] hover:text-[#181d26]'
            }`}
          >
            <UserIcon className="w-4 h-4" />
            <span>Thông tin cá nhân</span>
          </button>
        </div>

        {/* TAB 1: MEMBERSHIP TIER & SPENDING STATS */}
        {activeTab === 'tier' && (
          <div className="space-y-8">
            {/* Stat Cards Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {/* Card 1: Total Spent */}
              <div className="bg-white rounded-[12px] p-5 border border-[#dddddd] shadow-xs space-y-2">
                <div className="flex items-center justify-between text-[#9297a0]">
                  <span className="text-[12px] font-semibold uppercase tracking-wider">Tổng tiền đã tiêu</span>
                  <CreditCard className="w-4 h-4 text-[#e31837]" />
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-[#e31837]">
                  {formatVND(stats.totalSpent)}
                </div>
                <p className="text-[12px] text-[#41454d]">
                  Tích lũy từ {stats.completedCount} đơn hàng thành công
                </p>
              </div>

              {/* Card 2: Current Tier */}
              <div className="bg-white rounded-[12px] p-5 border border-[#dddddd] shadow-xs space-y-2">
                <div className="flex items-center justify-between text-[#9297a0]">
                  <span className="text-[12px] font-semibold uppercase tracking-wider">Hạng hiện tại</span>
                  <Award className="w-4 h-4 text-[#e31837]" />
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-[#181d26]">
                  {tier.name}
                </div>
                <p className="text-[12px] text-[#41454d]">
                  {tier.nextTier
                    ? `Cần tiêu thêm ${formatVND(tier.amountNeeded)} để thăng hạng`
                    : 'Đã đạt thứ hạng cao nhất!'}
                </p>
              </div>

              {/* Card 3: Shipping Discount */}
              <div className="bg-white rounded-[12px] p-5 border border-[#dddddd] shadow-xs space-y-2">
                <div className="flex items-center justify-between text-[#9297a0]">
                  <span className="text-[12px] font-semibold uppercase tracking-wider">Ưu đãi phí giao hàng</span>
                  <Truck className="w-4 h-4 text-[#e31837]" />
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-[#16a34a]">
                  {tier.shippingDiscount > 0 ? `-${formatVND(tier.shippingDiscount)} / đơn` : 'Chuẩn giá gốc'}
                </div>
                <p className="text-[12px] text-[#41454d]">
                  {tier.shippingDiscount > 0 ? 'Tự động trừ trực tiếp khi đặt món' : 'Chưa có ưu đãi vận chuyển'}
                </p>
              </div>
            </div>

            {/* Tier Progress Bar Card */}
            <div className={`bg-gradient-to-r ${tier.bgGradient} bg-white rounded-[16px] p-6 sm:p-8 border shadow-xs space-y-6`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[12px] font-bold uppercase tracking-wider text-[#e31837]">
                    Hành trình thăng hạng của bạn
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold text-[#181d26] mt-1">
                    Tiến trình hạng {tier.name} ({tier.progress}%)
                  </h2>
                </div>
                {tier.nextTier && (
                  <div className="text-right sm:text-right">
                    <span className="text-[12px] text-[#41454d] block">Mục tiêu tiếp theo:</span>
                    <strong className="text-[15px] font-bold text-[#e31837]">
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
                    className="h-full bg-[#e31837] rounded-full transition-all duration-500 shadow-xs"
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

              {/* Tier Benefits */}
              <div className="pt-4 border-t border-[#dddddd]/70">
                <h3 className="text-[14px] font-bold text-[#181d26] mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#e31837]" />
                  <span>Đặc quyền của hạng {tier.name}:</span>
                </h3>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[13px] text-[#41454d]">
                  {tier.benefits.map((b, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-[#16a34a] shrink-0" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Exclusive Vouchers Section */}
            <div className="bg-white rounded-[16px] p-6 sm:p-8 border border-[#dddddd] shadow-xs space-y-6">
              <div>
                <h2 className="text-xl font-bold text-[#181d26]">
                  Kho Voucher đặc quyền của bạn ({tier.vouchers.length})
                </h2>
                <p className="text-[13px] text-[#41454d] mt-1">
                  Mã giảm giá được trao tặng theo thứ hạng chi tiêu của bạn tại NooNee. Sao chép và nhập tại bước thanh toán!
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tier.vouchers.map((v) => (
                  <div
                    key={v.code}
                    className="border border-[#fecdd3] bg-[#fff1f2]/30 rounded-[12px] p-4 flex flex-col justify-between space-y-3 relative overflow-hidden"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#e31837] bg-white px-2 py-0.5 rounded border border-[#fecdd3]">
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
                        <span className="text-[16px] font-bold text-[#e31837]">
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
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#e31837] hover:bg-[#be0e27] text-white text-[12px] font-medium rounded-[6px] transition cursor-pointer"
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

        {/* TAB 2: FAVORITE DISHES */}
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
                className="text-[13px] font-semibold text-[#e31837] hover:underline flex items-center gap-1"
              >
                <span>Xem thực đơn</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {isLoadingProducts ? (
              <div className="py-16 text-center space-y-3">
                <Loader2 className="w-8 h-8 animate-spin text-[#e31837] mx-auto" />
                <p className="text-[13px] text-[#41454d]">Đang tải danh sách món yêu thích...</p>
              </div>
            ) : favoriteProductsList.length === 0 ? (
              <div className="py-16 text-center space-y-4 max-w-sm mx-auto">
                <div className="w-14 h-14 rounded-full bg-[#fff1f2] text-[#e31837] flex items-center justify-center mx-auto border border-[#fecdd3]">
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
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#e31837] hover:bg-[#be0e27] text-white rounded-[8px] text-[13px] font-semibold transition"
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
                <KeyRound className="w-5 h-5 text-[#e31837]" />
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
                    className="w-full h-11 px-3.5 bg-white border border-[#dddddd] rounded-[8px] text-[13px] text-[#181d26] focus:outline-none focus:border-[#e31837] focus:ring-1 focus:ring-[#e31837] transition"
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
                  className="w-full h-11 px-3.5 bg-white border border-[#dddddd] rounded-[8px] text-[13px] text-[#181d26] focus:outline-none focus:border-[#e31837] focus:ring-1 focus:ring-[#e31837] transition"
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
                  className="w-full h-11 px-3.5 bg-white border border-[#dddddd] rounded-[8px] text-[13px] text-[#181d26] focus:outline-none focus:border-[#e31837] focus:ring-1 focus:ring-[#e31837] transition"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isChangingPass}
                className="w-full h-11 bg-[#e31837] hover:bg-[#be0e27] active:bg-[#a50b20] text-white font-semibold text-[14px] rounded-[8px] shadow-xs transition flex items-center justify-center gap-2 cursor-pointer mt-2"
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
                <UserIcon className="w-5 h-5 text-[#e31837]" />
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
                  className="w-full h-11 px-3.5 bg-white border border-[#dddddd] rounded-[8px] text-[13px] text-[#181d26] focus:outline-none focus:border-[#e31837] focus:ring-1 focus:ring-[#e31837] transition"
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
                  className="w-full h-11 px-3.5 bg-white border border-[#dddddd] rounded-[8px] text-[13px] text-[#181d26] focus:outline-none focus:border-[#e31837] focus:ring-1 focus:ring-[#e31837] transition"
                />
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-[#181d26] mb-1.5">
                  Địa chỉ giao hàng mặc định
                </label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Số nhà, tên đường, phường/xã, quận/huyện..."
                  rows={3}
                  className="w-full p-3.5 bg-white border border-[#dddddd] rounded-[8px] text-[13px] text-[#181d26] focus:outline-none focus:border-[#e31837] focus:ring-1 focus:ring-[#e31837] transition"
                />
              </div>

              <button
                type="submit"
                disabled={isSavingInfo}
                className="w-full h-11 bg-[#e31837] hover:bg-[#be0e27] active:bg-[#a50b20] text-white font-semibold text-[14px] rounded-[8px] shadow-xs transition flex items-center justify-center gap-2 cursor-pointer mt-2"
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
          <Loader2 className="w-8 h-8 animate-spin text-[#e31837] mx-auto" />
        </div>
      }
    >
      <ProfileContent />
    </Suspense>
  );
}
