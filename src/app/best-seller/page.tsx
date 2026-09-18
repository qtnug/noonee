'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Flame,
  Sparkles,
  Ticket,
  Copy,
  Check,
  TrendingUp,
  Award,
  ArrowRight,
  ShieldCheck,
  UtensilsCrossed,
  Coffee,
  Sandwich,
  Loader2,
} from 'lucide-react';
import { Product } from '@/types';
import { formatVND } from '@/lib/utils';
import ProductCard from '@/components/ProductCard';

export default function BestSellerPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<number | 'all'>('all');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    const fetchHotDishes = async () => {
      try {
        const res = await fetch('/api/products?isFeatured=true');
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setProducts(data.data);
        } else {
          // Fallback to general products
          const resAll = await fetch('/api/products');
          const dataAll = await resAll.json();
          if (dataAll.success && Array.isArray(dataAll.data)) {
            const sorted = dataAll.data.filter((p: Product) => p.isFeatured || (p.rating && p.rating >= 4.5));
            setProducts(sorted);
          }
        }
      } catch (err) {
        console.error('Error fetching best seller products:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHotDishes();
  }, []);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const exclusiveCoupons = [
    {
      code: 'BEST_HOT25',
      name: 'Voucher Bán Chạy - Giảm 25.000 ₫',
      description: 'Áp dụng cho các đơn có món trong danh mục Bán Chạy đạt từ 80.000 ₫. Mỗi khách hàng sử dụng 1 lần.',
      badge: 'Độc quyền 1 lần dùng',
      discount: 'Giảm 25k',
      minOrder: 'Đơn từ 80k',
    },
    {
      code: 'BEST_HOT35',
      name: 'Siêu Deal Món Hot - Giảm 35.000 ₫',
      description: 'Áp dụng cho đơn có món Bán Chạy đạt từ 130.000 ₫. Thưởng thức trọn vẹn hương vị đỉnh cao.',
      badge: 'Hot Deal 1 lần dùng',
      discount: 'Giảm 35k',
      minOrder: 'Đơn từ 130k',
    },
    {
      code: 'GIAM_P30K9',
      name: 'Đại Tiệc Món Ngon - Giảm 30%',
      description: 'Giảm 30% tối đa 50.000 ₫ cho đơn từ 120.000 ₫. Ưu đãi nóng hổi trong ngày.',
      badge: 'Giảm 30%',
      discount: 'Giảm 30%',
      minOrder: 'Đơn từ 120k',
    },
  ];

  const filteredProducts = products.filter((p) => {
    if (selectedCategory === 'all') return true;
    return p.categoryId === selectedCategory;
  });

  return (
    <div className="bg-[#FFFAF0] min-h-screen pb-16">
      {/* 1. HERO PROMOTIONAL BANNER */}
      <div className="bg-gradient-to-r from-[#181d26] via-[#2c1418] to-[#181d26] text-white py-10 sm:py-14 border-b border-[#dddddd] relative overflow-hidden">
        {/* Subtle background flare */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="space-y-4 max-w-2xl text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/20 border border-red-500/30 text-[#fecdd3] text-[12px] font-bold">
                <Flame className="w-4 h-4 text-amber-400 fill-amber-400 animate-pulse" />
                <span>BẢNG XẾP HẠNG BEST SELLER 2026</span>
              </div>

              <h1 className="text-white text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
                <span className="text-white">Top Món Bán Chạy Nhất</span> <br className="hidden sm:inline" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-pink-400 to-amber-300">
                  Tại NooNee Food
                </span>
              </h1>

              <p className="text-[14px] sm:text-[16px] text-gray-300 leading-relaxed">
                Được tuyển chọn từ hàng chục ngàn lượt đặt hàng của thực khách. Hương vị chuẩn mực truyền thống, đậm đà, chế biến nóng hổi ngay khi có đơn.
              </p>

              <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-3 text-[12px] text-gray-300">
                <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-[6px]">
                  <Award className="w-4 h-4 text-amber-400" />
                  <span>Đánh giá trung bình 4.9+ ⭐</span>
                </div>
                <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-[6px]">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <span>Hơn 1.200+ lượt gọi/ngày</span>
                </div>
              </div>
            </div>

            {/* Banner Side Graphic Card */}
            <div className="w-full lg:w-96 bg-white/10 backdrop-blur-md rounded-[16px] border border-white/20 p-5 shadow-2xl space-y-3 shrink-0">
              <div className="flex items-center gap-2 text-amber-300 text-[13px] font-bold">
                <Sparkles className="w-4 h-4" />
                <span>ĐẶC QUYỀN TRANG BÁN CHẠY</span>
              </div>
              <p className="text-[13px] text-gray-200">
                Sử dụng ngay các mã giảm giá 1 lần duy nhất bên dưới để được giảm tới <strong>35.000 ₫</strong> khi thưởng thức các món ăn trong danh sách này!
              </p>
              <div className="pt-2 border-t border-white/15 flex items-center justify-between text-[11px] text-gray-300">
                <span>Áp dụng tự động tại bước thanh toán</span>
                <span className="text-amber-400 font-semibold">1 Lần / Khách</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {/* 2. EXCLUSIVE 1-TIME COUPONS SECTION (STT 11) */}
        <div className="bg-white rounded-[14px] border border-[#dddddd] p-5 sm:p-7 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#dddddd] pb-3">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-[#181d26] flex items-center gap-2">
                <Ticket className="w-5 h-5 text-[#e31837]" />
                Mã Giảm Giá Độc Quyền Cho Món Bán Chạy (1 Lần Dùng)
              </h2>
              <p className="text-[13px] text-[#41454d] mt-0.5">
                Sao chép mã ưu đãi độc quyền dành riêng cho thực khách trải nghiệm các món Best-seller hôm nay.
              </p>
            </div>
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-red-50 text-[#e31837] border border-[#fecdd3] self-start sm:self-auto">
              Ưu đãi giới hạn
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
            {exclusiveCoupons.map((c) => (
              <div
                key={c.code}
                className="bg-gradient-to-br from-white to-[#fff5f6] border border-[#fecdd3] rounded-[10px] p-4 flex flex-col justify-between space-y-3 relative shadow-2xs hover:shadow-md transition"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#e31837] bg-white px-2 py-0.5 rounded border border-[#fecdd3]">
                      {c.badge}
                    </span>
                    <span className="text-[11px] font-bold text-[#41454d] bg-gray-100 px-2 py-0.5 rounded">
                      {c.minOrder}
                    </span>
                  </div>
                  <h3 className="font-bold text-[14px] text-[#181d26] pt-1">{c.name}</h3>
                  <p className="text-[12px] text-[#41454d] leading-relaxed">{c.description}</p>
                </div>

                <div className="pt-2 border-t border-[#fecdd3]/60 flex items-center justify-between">
                  <span className="font-mono font-bold text-[13px] text-[#e31837] bg-white px-2.5 py-1 rounded border border-[#fecdd3]">
                    {c.code}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(c.code)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#e31837] hover:bg-[#be0e27] text-white text-[12px] font-semibold rounded-[6px] transition cursor-pointer shadow-2xs"
                  >
                    {copiedCode === c.code ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Đã lưu mã</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Sao chép</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3. CATEGORY FILTERS */}
        <div className="flex items-center justify-between gap-3 overflow-x-auto pb-1">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-[8px] text-[13px] font-semibold transition cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-[#e31837] text-white shadow-xs'
                  : 'bg-white border border-[#dddddd] text-[#41454d] hover:bg-red-50 hover:text-[#e31837]'
              }`}
            >
              🔥 Tất cả món Hot ({products.length})
            </button>
            <button
              onClick={() => setSelectedCategory(1)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-[8px] text-[13px] font-semibold transition cursor-pointer ${
                selectedCategory === 1
                  ? 'bg-[#e31837] text-white shadow-xs'
                  : 'bg-white border border-[#dddddd] text-[#41454d] hover:bg-red-50 hover:text-[#e31837]'
              }`}
            >
              <UtensilsCrossed className="w-3.5 h-3.5" />
              <span>Cơm & Món chính Hot</span>
            </button>
            <button
              onClick={() => setSelectedCategory(2)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-[8px] text-[13px] font-semibold transition cursor-pointer ${
                selectedCategory === 2
                  ? 'bg-[#e31837] text-white shadow-xs'
                  : 'bg-white border border-[#dddddd] text-[#41454d] hover:bg-red-50 hover:text-[#e31837]'
              }`}
            >
              <Sandwich className="w-3.5 h-3.5" />
              <span>Ăn vặt Hot</span>
            </button>
            <button
              onClick={() => setSelectedCategory(3)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-[8px] text-[13px] font-semibold transition cursor-pointer ${
                selectedCategory === 3
                  ? 'bg-[#e31837] text-white shadow-xs'
                  : 'bg-white border border-[#dddddd] text-[#41454d] hover:bg-red-50 hover:text-[#e31837]'
              }`}
            >
              <Coffee className="w-3.5 h-3.5" />
              <span>Đồ uống Hot</span>
            </button>
          </div>

          <Link
            href="/menu"
            className="text-[13px] font-semibold text-[#e31837] hover:underline flex items-center gap-1 whitespace-nowrap"
          >
            <span>Xem toàn bộ thực đơn</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* 4. DISHES GRID WITH RANKING BADGES */}
        {loading ? (
          <div className="py-24 text-center text-gray-400 space-y-2">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#e31837]" />
            <p className="text-[14px]">Đang tải danh sách món ăn bán chạy nhất...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-white rounded-[10px] border border-[#dddddd] p-12 text-center text-[#9297a0] space-y-3">
            <Flame className="w-10 h-10 text-gray-300 mx-auto" />
            <p className="text-[14px] text-[#41454d] font-medium">Không có món ăn nào trong danh mục này</p>
            <Link
              href="/menu"
              className="inline-block px-4 py-2 bg-[#e31837] text-white text-[13px] font-semibold rounded-[6px]"
            >
              Quay lại thực đơn
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {filteredProducts.map((product, index) => {
              const rank = index + 1;
              const badge =
                rank === 1
                  ? '👑 #1 Bán Chạy Nhất'
                  : rank === 2
                  ? '🥈 #2 Siêu Hot'
                  : rank === 3
                  ? '🥉 #3 Được Yêu Thích'
                  : '🔥 Top Seller';

              return (
                <div key={product.id} className="relative">
                  <ProductCard product={product} badgeText={badge} />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
