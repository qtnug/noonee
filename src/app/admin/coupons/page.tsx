'use client';

import React, { useState, useEffect } from 'react';
import {
  CiDiscount1 as Ticket,
  CiCirclePlus as Plus,
  CiTrash as Trash2,
  CiReceipt as Copy,
  CiCircleCheck as Check,
  CiRedo as RefreshCw,
  CiSearch as Search,
  CiStar as Sparkles,
  CiRedo as Loader2,
  CiCircleRemove as X,
  CiShuffle as Shuffle,
  CiCircleAlert as AlertCircle,
} from 'react-icons/ci';
import { Coupon } from '@/types';
import { formatVND } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

export default function AdminCouponsPage() {
  const { getAuthHeader } = useAuth();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Form Fields
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [discountType, setDiscountType] = useState<'fixed' | 'percentage'>('fixed');
  const [discountValue, setDiscountValue] = useState<number>(20000);
  const [maxDiscountAmount, setMaxDiscountAmount] = useState<number>(50000);
  const [minOrderAmount, setMinOrderAmount] = useState<number>(80000);
  const [expiryDate, setExpiryDate] = useState('2026-12-31');
  const [usageLimit, setUsageLimit] = useState<number>(100);
  const [categoryExclusive, setCategoryExclusive] = useState<'all' | 'rice' | 'drinks' | 'best_seller'>('all');
  const [minTier, setMinTier] = useState<string>('');
  const [isOneTimeUse, setIsOneTimeUse] = useState(false);
  const [couponType, setCouponType] = useState<'food_discount' | 'freeship'>('food_discount');

  const [loadError, setLoadError] = useState<string | null>(null);

  const fetchCoupons = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch('/api/coupons');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setCoupons(data.data);
      } else {
        setLoadError(data.message || 'Không thể tải danh sách mã ưu đãi từ CSDL');
      }
    } catch (e: any) {
      console.error(e);
      setLoadError(e.message || 'Lỗi kết nối máy chủ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleCopy = (codeToCopy: string) => {
    navigator.clipboard.writeText(codeToCopy);
    setCopiedCode(codeToCopy);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleGenerateRandomCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let rand = '';
    for (let i = 0; i < 5; i++) {
      rand += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    let prefix = 'NOONEE';
    if (categoryExclusive === 'rice') prefix = 'COM';
    else if (categoryExclusive === 'drinks') prefix = 'NUOC';
    else if (categoryExclusive === 'best_seller') prefix = 'HOT';
    else if (couponType === 'freeship' && discountValue <= 0) prefix = 'FREESHIP';
    else if (discountType === 'percentage') prefix = `P${discountValue}`;
    else prefix = `${Math.round(discountValue / 1000)}K`;

    setCode(`${prefix}_${rand}`);
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    const isFullFreeship = couponType === 'freeship' && Number(discountValue) === 0;
    if (!name.trim() || Number(discountValue) < 0 || (!isFullFreeship && !Number(discountValue))) {
      setFormError('Vui lòng điền đầy đủ tên và giá trị ưu đãi');
      return;
    }

    setIsSubmitting(true);
    setFormError('');
    try {
      const finalCode = code.trim() ? code.trim().toUpperCase() : undefined;
      const res = await fetch('/api/coupons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify({
          code: finalCode,
          name: name.trim(),
          description: description.trim(),
          discountType,
          discountValue: Number(discountValue),
          maxDiscountAmount: discountType === 'percentage' ? Number(maxDiscountAmount) : undefined,
          minOrderAmount: Number(minOrderAmount),
          expiryDate,
          usageLimit: Number(usageLimit),
          categoryExclusive,
          minTier: minTier || undefined,
          isOneTimeUse,
          couponType,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || 'Lỗi tạo mã giảm giá');
      }

      setToastMessage(`Đã tạo thành công mã giảm giá ${data.data.code}!`);
      setTimeout(() => setToastMessage(null), 3500);
      setIsCreateModalOpen(false);
      resetForm();
      fetchCoupons();
    } catch (err: any) {
      setFormError(err.message || 'Có lỗi xảy ra');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCoupon = async (targetCode: string) => {
    if (!confirm(`Bạn có chắc muốn xóa hoặc vô hiệu hóa mã "${targetCode}"?`)) return;

    try {
      const res = await fetch(`/api/coupons?code=${encodeURIComponent(targetCode)}`, {
        method: 'DELETE',
        headers: getAuthHeader(),
      });
      const data = await res.json();
      if (data.success) {
        setToastMessage(`Đã xóa mã ${targetCode}`);
        setTimeout(() => setToastMessage(null), 3000);
        fetchCoupons();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const resetForm = () => {
    setCode('');
    setName('');
    setDescription('');
    setDiscountType('fixed');
    setDiscountValue(20000);
    setMaxDiscountAmount(50000);
    setMinOrderAmount(80000);
    setExpiryDate('2026-12-31');
    setUsageLimit(100);
    setCategoryExclusive('all');
    setMinTier('');
    setIsOneTimeUse(false);
    setCouponType('food_discount');
    setFormError('');
  };

  const filteredCoupons = coupons.filter(
    (c) =>
      c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.badge && c.badge.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-[#181d26] text-white px-4 py-3 rounded-[8px] shadow-xl text-[13px] font-medium flex items-center gap-2 border border-white/20 animate-in fade-in slide-in-from-top-2">
          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#181d26] flex items-center gap-2.5">
            <Ticket className="w-6 h-6 text-[#A30029]" />
            Quản lý Kho Voucher & Mã Khuyến Mãi
          </h1>
          <p className="text-[13px] text-[#41454d] mt-1">
            Tạo và quản lý các loại mã giảm giá toàn sàn, mã ngẫu nhiên độc quyền theo danh mục, giới hạn lượt dùng và hạn sử dụng.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchCoupons}
            className="h-10 px-3.5 bg-white border border-[#dddddd] hover:bg-[#f8fafc] text-[#181d26] text-[13px] font-medium rounded-[6px] flex items-center gap-2 transition cursor-pointer"
            title="Làm mới danh sách"
          >
            <RefreshCw className={`w-4 h-4 text-[#9297a0] ${loading ? 'animate-spin' : ''}`} />
            <span>Tải lại</span>
          </button>

          <button
            onClick={() => {
              resetForm();
              handleGenerateRandomCode();
              setIsCreateModalOpen(true);
            }}
            className="h-10 px-4 bg-[#A30029] hover:bg-[#850021] text-white text-[13px] font-semibold rounded-[6px] flex items-center gap-2 transition cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo Voucher Mới</span>
          </button>
        </div>
      </div>

      {loadError && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-[8px] text-[13px] flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            <div>
              <p className="font-bold">Lỗi kết nối cơ sở dữ liệu:</p>
              <p className="text-[12px]">{loadError}</p>
            </div>
          </div>
          <button
            onClick={fetchCoupons}
            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-semibold text-[12px] rounded-[4px] shrink-0 transition cursor-pointer"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Stats Summary Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-[10px] p-4 border border-[#dddddd] shadow-2xs space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#9297a0]">
            Tổng số voucher
          </span>
          <div className="text-xl font-bold text-[#181d26]">{coupons.length}</div>
          <p className="text-[11px] text-[#16a34a]">Đang lưu hành trong hệ thống</p>
        </div>

        <div className="bg-white rounded-[10px] p-4 border border-[#dddddd] shadow-2xs space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#9297a0]">
            Mã Giảm Đồ Ăn
          </span>
          <div className="text-xl font-bold text-[#A30029]">
            {coupons.filter((c) => c.couponType === 'food_discount' || !c.couponType).length}
          </div>
          <p className="text-[11px] text-[#555a64]">Giảm giá trực tiếp món ăn</p>
        </div>

        <div className="bg-white rounded-[10px] p-4 border border-[#2563eb]/20 shadow-2xs space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#9297a0]">
            Mã Freeship
          </span>
          <div className="text-xl font-bold text-[#2563eb]">
            {coupons.filter((c) => c.couponType === 'freeship').length}
          </div>
          <p className="text-[11px] text-[#2563eb]">Miễn/Giảm phí giao hàng</p>
        </div>

        <div className="bg-white rounded-[10px] p-4 border border-[#dddddd] shadow-2xs space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#9297a0]">
            Mã Hạng Thành Viên
          </span>
          <div className="text-xl font-bold text-[#A30029]">
            {coupons.filter((c) => Boolean(c.minTier)).length}
          </div>
          <p className="text-[11px] text-[#555a64]">Đặc quyền Bạc, Vàng, VIP</p>
        </div>
      </div>


      {/* Filter / Search Bar */}
      <div className="bg-white p-3.5 rounded-[10px] border border-[#dddddd] flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo mã voucher (VD: COM_R9X4A), tên hoặc điều kiện..."
            className="w-full h-9 pl-9 pr-3 text-[13px] bg-[#f8fafc] border border-[#dddddd] rounded-[6px] focus:outline-none focus:border-[#A30029]"
          />
          <Search className="w-4 h-4 text-[#9297a0] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
        <span className="text-[12px] text-[#9297a0]">
          Đang hiển thị {filteredCoupons.length} / {coupons.length} mã
        </span>
      </div>

      {/* Table of Coupons */}
      <div className="bg-white border border-[#dddddd] rounded-[10px] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px] border-collapse">
            <thead>
              <tr className="border-b border-[#dddddd] bg-[#f8fafc] text-[#555a64] font-semibold">
                <th className="py-3 px-4">Mã Voucher</th>
                <th className="py-3 px-4">Thông tin ưu đãi</th>
                <th className="py-3 px-4">Giá trị giảm</th>
                <th className="py-3 px-4">Đơn tối thiểu</th>
                <th className="py-3 px-4">Áp dụng cho</th>
                <th className="py-3 px-4">Lượt sử dụng</th>
                <th className="py-3 px-4">Hạn dùng</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f0f0]">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#A30029] mb-2" />
                    Đang tải danh sách voucher...
                  </td>
                </tr>
              ) : filteredCoupons.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400">
                    Không tìm thấy mã ưu đãi nào phù hợp
                  </td>
                </tr>
              ) : (
                  filteredCoupons.map((c) => {
                  const used = c.usedCount || 0;
                  const limit = c.usageLimit || 100;
                  const percentUsed = Math.min(100, Math.round((used / limit) * 100));
                  const isFreeship = c.couponType === 'freeship';

                  return (
                    <tr key={c.code} className={`hover:bg-[#f8fafc]/80 transition ${isFreeship ? 'hover:bg-blue-50/30' : 'hover:bg-[#fff9f9]/50'}`}>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className={`font-mono font-bold text-[13px] px-2 py-0.5 rounded border ${
                            isFreeship
                              ? 'text-blue-700 bg-blue-50 border-blue-200'
                              : 'text-[#A30029] bg-red-50 border-[#fecdd3]'
                          }`}>
                            {c.code}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(c.code)}
                            className="p-1 text-gray-400 hover:text-[#A30029] transition cursor-pointer"
                            title="Sao chép mã"
                          >
                            {copiedCode === c.code ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          {isFreeship ? (
                            <span className="inline-block text-[10px] font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                              🚚 Freeship
                            </span>
                          ) : (
                            <span className="inline-block text-[10px] font-semibold text-[#A30029] bg-red-50 px-1.5 py-0.5 rounded border border-[#fecdd3]">
                              🍱 Giảm đồ ăn
                            </span>
                          )}
                          {c.badge && (
                            <span className="inline-block text-[10px] font-semibold text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded">
                              {c.badge}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4 max-w-[220px]">
                        <p className="font-semibold text-[#181d26] truncate" title={c.name}>
                          {c.name}
                        </p>
                        <p className="text-[11px] text-[#9297a0] line-clamp-1" title={c.description}>
                          {c.description}
                        </p>
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-bold text-[#A30029]">
                          {isFreeship && c.discountValue <= 0
                            ? 'Freeship 100%'
                            : c.discountType === 'percentage'
                              ? `-${c.discountValue}%`
                              : `-${formatVND(c.discountValue)}`}
                        </span>
                        {c.maxDiscountAmount && (
                          <span className="block text-[10px] text-gray-400">
                            Tối đa {formatVND(c.maxDiscountAmount)}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 font-medium text-[#181d26]">
                        {formatVND(c.minOrderAmount)}
                      </td>

                      <td className="py-3 px-4">
                        {c.categoryExclusive === 'rice' && (
                          <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-semibold">
                            Cơm & Món chính
                          </span>
                        )}
                        {c.categoryExclusive === 'drinks' && (
                          <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 text-[11px] font-semibold">
                            Đồ uống
                          </span>
                        )}
                        {c.categoryExclusive === 'best_seller' && (
                          <span className="px-2 py-0.5 rounded bg-red-50 text-red-800 border border-red-200 text-[11px] font-semibold">
                            Món Bán chạy (1 lần)
                          </span>
                        )}
                        {(!c.categoryExclusive || c.categoryExclusive === 'all') && (
                          <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-[11px] font-medium">
                            Toàn bộ thực đơn
                          </span>
                        )}
                        {c.minTier && (
                          <span className="block mt-1 text-[10px] text-purple-700 font-semibold">
                            Từ Hạng {c.minTier}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px] text-[#555a64]">
                            <span>{used} đã dùng</span>
                            <span className="text-[10px] text-gray-400">/ {limit}</span>
                          </div>
                          <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#A30029] rounded-full"
                              style={{ width: `${percentUsed}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-[12px] text-[#555a64]">
                        {c.expiryDate || 'Vô thời hạn'}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteCoupon(c.code)}
                          className="p-1.5 text-gray-400 hover:text-[#A30029] hover:bg-red-50 rounded-[4px] transition cursor-pointer"
                          title="Xóa voucher này"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE COUPON MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-[12px] border border-[#dddddd] shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-4 bg-gradient-to-r from-[#181d26] to-[#2b3340] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Ticket className="w-5 h-5 text-[#A30029]" />
                <h3 className="font-bold text-[16px] text-white">Tạo Mã Giảm Giá Mới</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 text-gray-300 hover:text-white rounded cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateCoupon} className="p-5 overflow-y-auto space-y-4 text-[13px]">
              {formError && (
                <div className="p-3 bg-[#fff1f2] border border-[#fecdd3] text-[#A30029] rounded-[6px] text-[12px] flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Loại Voucher */}
              <div className="space-y-1">
                <label className="font-semibold text-[#181d26]">Loại voucher:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCouponType('food_discount')}
                    className={`h-10 px-3 rounded-[6px] border text-[12px] font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      couponType === 'food_discount'
                        ? 'bg-[#fff1f2] border-[#A30029] text-[#A30029]'
                        : 'bg-white border-[#dddddd] text-[#555a64] hover:border-[#A30029]'
                    }`}
                  >
                    🍱 Giảm đồ ăn
                  </button>
                  <button
                    type="button"
                    onClick={() => setCouponType('freeship')}
                    className={`h-10 px-3 rounded-[6px] border text-[12px] font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      couponType === 'freeship'
                        ? 'bg-blue-50 border-blue-500 text-blue-700'
                        : 'bg-white border-[#dddddd] text-[#555a64] hover:border-blue-400'
                    }`}
                  >
                    🚚 Freeship
                  </button>
                </div>
              </div>

              {/* Code Bar with Random Generator */}
              <div className="space-y-1">
                <label className="font-semibold text-[#181d26] flex items-center justify-between">
                  <span>Mã ưu đãi (Coupon Code):</span>
                  <button
                    type="button"
                    onClick={handleGenerateRandomCode}
                    className="text-[11px] text-[#A30029] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Shuffle className="w-3.5 h-3.5" />
                    <span>Tạo mã ngẫu nhiên khó đoán</span>
                  </button>
                </label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="Ví dụ: COM_R9X4A hoặc DISC20"
                  className="w-full h-10 px-3 font-mono font-bold bg-[#f8fafc] border border-[#dddddd] rounded-[6px] text-[#A30029] focus:outline-none focus:border-[#A30029]"
                />
              </div>

              {/* Name */}
              <div className="space-y-1">
                <label className="font-semibold text-[#181d26]">Tên hiển thị:</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ví dụ: Độc quyền Cơm trưa NooNee - Giảm 20k"
                  className="w-full h-10 px-3 bg-white border border-[#dddddd] rounded-[6px] text-[#181d26] focus:outline-none focus:border-[#A30029]"
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="font-semibold text-[#181d26]">Mô tả chi tiết:</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ví dụ: Áp dụng cho các món Cơm & Món chính đạt từ 70.000 ₫"
                  className="w-full h-10 px-3 bg-white border border-[#dddddd] rounded-[6px] text-[#181d26] focus:outline-none focus:border-[#A30029]"
                />
              </div>

              {/* Discount Type & Value */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-[#181d26]">Hình thức giảm:</label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as any)}
                    className="w-full h-10 px-3 bg-white border border-[#dddddd] rounded-[6px] text-[#181d26] focus:outline-none focus:border-[#A30029] cursor-pointer"
                  >
                    <option value="fixed">Số tiền cố định (VNĐ)</option>
                    <option value="percentage">Phần trăm (%)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-[#181d26]">
                    {discountType === 'percentage'
                      ? 'Số % giảm:'
                      : couponType === 'freeship'
                        ? 'Số tiền giảm ship (0 = miễn 100%):'
                        : 'Số tiền giảm (VNĐ):'}
                  </label>
                  <input
                    type="number"
                    required
                    min={couponType === 'freeship' ? 0 : 1}
                    value={discountValue}
                    onChange={(e) => setDiscountValue(Number(e.target.value))}
                    placeholder={discountType === 'percentage' ? '20' : couponType === 'freeship' ? '0' : '20000'}
                    className="w-full h-10 px-3 bg-white border border-[#dddddd] rounded-[6px] text-[#181d26] focus:outline-none focus:border-[#A30029]"
                  />
                </div>
              </div>

              {/* Min Order & Max Discount */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-[#181d26]">Đơn hàng tối thiểu (VNĐ):</label>
                  <input
                    type="number"
                    min={0}
                    value={minOrderAmount}
                    onChange={(e) => setMinOrderAmount(Number(e.target.value))}
                    className="w-full h-10 px-3 bg-white border border-[#dddddd] rounded-[6px] text-[#181d26] focus:outline-none focus:border-[#A30029]"
                  />
                </div>

                {discountType === 'percentage' && (
                  <div className="space-y-1">
                    <label className="font-semibold text-[#181d26]">Giảm tối đa (VNĐ):</label>
                    <input
                      type="number"
                      min={0}
                      value={maxDiscountAmount}
                      onChange={(e) => setMaxDiscountAmount(Number(e.target.value))}
                      placeholder="50000"
                      className="w-full h-10 px-3 bg-white border border-[#dddddd] rounded-[6px] text-[#181d26] focus:outline-none focus:border-[#A30029]"
                    />
                  </div>
                )}
              </div>

              {/* Category Exclusivity */}
              <div className="space-y-1">
                <label className="font-semibold text-[#181d26]">Độc quyền theo ngành hàng (STT 3):</label>
                <select
                  value={categoryExclusive}
                  onChange={(e) => setCategoryExclusive(e.target.value as any)}
                  className="w-full h-10 px-3 bg-white border border-[#dddddd] rounded-[6px] text-[#181d26] focus:outline-none focus:border-[#A30029] cursor-pointer"
                >
                  <option value="all">Toàn bộ món trong thực đơn</option>
                  <option value="rice">Độc quyền Cơm & Món chính</option>
                  <option value="drinks">Độc quyền Đồ uống & Tráng miệng</option>
                  <option value="best_seller">Độc quyền Món Bán chạy (Hot Deal)</option>
                </select>
              </div>

              {/* Expiry Date & Usage Limit */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-[#181d26]">Hạn sử dụng (STT 2):</label>
                  <input
                    type="date"
                    required
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full h-10 px-3 bg-white border border-[#dddddd] rounded-[6px] text-[#181d26] focus:outline-none focus:border-[#A30029]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-[#181d26]">Giới hạn số lượt dùng (STT 2):</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={usageLimit}
                    onChange={(e) => setUsageLimit(Number(e.target.value))}
                    className="w-full h-10 px-3 bg-white border border-[#dddddd] rounded-[6px] text-[#181d26] focus:outline-none focus:border-[#A30029]"
                  />
                </div>
              </div>

              {/* One-time use checkbox */}
              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-[#181d26]">
                  <input
                    type="checkbox"
                    checked={isOneTimeUse}
                    onChange={(e) => setIsOneTimeUse(e.target.checked)}
                    className="accent-[#A30029] rounded"
                  />
                  <span>Mỗi khách hàng chỉ được sử dụng 1 lần duy nhất</span>
                </label>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#dddddd]">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-[#41454d] hover:bg-[#f8fafc] border border-[#dddddd] rounded-[6px] transition cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-[#A30029] hover:bg-[#850021] text-white font-semibold rounded-[6px] transition flex items-center gap-2 disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang tạo...</span>
                    </>
                  ) : (
                    <span>Tạo Voucher Ngay</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
