'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CiBowlNoodles as Flame,
  CiStar as Sparkles,
  CiDiscount1 as Ticket,
  CiCircleCheck as Check,
  CiCircleChevRight as ArrowRight,
  CiForkAndKnife as UtensilsCrossed,
  CiCoffeeCup as Coffee,
  CiBurger as Sandwich,
  CiRedo as Loader2,
  CiCircleInfo as Info,
  CiCircleRemove as X,
} from 'react-icons/ci';
import { Product } from '@/types';
import { formatVND } from '@/lib/utils';
import ProductCard from '@/components/ProductCard';

export default function BestSellerPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<number | 'all'>('all');
  const [savedCodes, setSavedCodes] = useState<string[]>([]);
  const [conditionModalCoupon, setConditionModalCoupon] = useState<any | null>(null);

  useEffect(() => {
    const fetchHotDishes = async () => {
      try {
        const res = await fetch('/api/products?featured=true', { cache: 'no-store' });
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          // Chỉ hiển thị các sản phẩm có lượt mua thực tế > 0, xếp giảm dần theo soldCount
          const realBestSellers = data.data
            .filter((p: Product) => (p.soldCount || 0) > 0)
            .sort((a: Product, b: Product) => (b.soldCount || 0) - (a.soldCount || 0));
          setProducts(realBestSellers);
        }
      } catch (err) {
        console.error('Error fetching best seller products:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHotDishes();
  }, []);

  const handleSaveCoupon = (code: string) => {
    setSavedCodes((prev) => {
      if (prev.includes(code)) return prev;
      const next = [...prev, code];
      if (typeof window !== 'undefined') {
        localStorage.setItem('noonee_saved_vouchers', JSON.stringify(next));
      }
      return next;
    });
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = JSON.parse(localStorage.getItem('noonee_saved_vouchers') || '[]');
        if (Array.isArray(saved)) setSavedCodes(saved);
      } catch {}
    }
  }, []);

  const exclusiveCoupons = [
    {
      code: 'BEST_HOT25',
      name: 'Voucher Bán Chạy',
      description: 'Áp dụng cho các đơn có món trong danh mục Bán Chạy đạt từ 80.000 ₫.',
      badge: 'Độc quyền',
      discount: 'Giảm 25.000 ₫',
      minOrder: 'Đơn từ 80.000 ₫',
      condition: 'Áp dụng cho đơn hàng có món trong danh mục Bán Chạy từ 80.000 ₫ trở lên. Tự động áp dụng tại trang thanh toán.',
    },
    {
      code: 'BEST_HOT35',
      name: 'Siêu Deal Món Hot',
      description: 'Áp dụng cho đơn có món Bán Chạy đạt từ 130.000 ₫. Thưởng thức trọn vẹn hương vị đỉnh cao.',
      badge: 'Hot Deal',
      discount: 'Giảm 35.000 ₫',
      minOrder: 'Đơn từ 130.000 ₫',
      condition: 'Áp dụng cho đơn hàng có món trong danh mục Bán Chạy đạt từ 130.000 ₫ trở lên.',
    },
    {
      code: 'GIAM_P30K9',
      name: 'Đại Tiệc Món Ngon',
      description: 'Giảm 30% tối đa 50.000 ₫ cho đơn từ 120.000 ₫.',
      badge: 'Giảm 30%',
      discount: 'Giảm 30% (tối đa 50k)',
      minOrder: 'Đơn từ 120.000 ₫',
      condition: 'Giảm 30% tổng giá trị món ăn (tối đa 50.000 ₫) cho đơn từ 120.000 ₫ trở lên.',
    },
  ];

  const filteredProducts = products.filter((p) => {
    if (selectedCategory === 'all') return true;
    if (selectedCategory === 1) return p.categoryId === 1 || p.categoryId === 4 || p.categoryId === 5;
    return p.categoryId === selectedCategory;
  });

  return (
    <div className="bg-[#FFFAF0] min-h-screen pb-16">
      {/* 1. HERO BANNER (Minimalist & Punchy) */}
      <div className="bg-gradient-to-r from-[#181d26] via-[#2c1418] to-[#181d26] text-white py-10 sm:py-12 border-b border-[#dddddd] relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-2xl text-center lg:text-left space-y-3">
            <h1 className="text-white text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
              Top Món Bán Chạy Nhất <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-pink-400 to-amber-300">
                Tại NooNee Food
              </span>
            </h1>

            <p className="text-[14px] sm:text-[15px] text-gray-300 leading-relaxed">
              Tuyển chọn các món ăn được thực khách gọi nhiều nhất. Hương vị chuẩn truyền thống, chế biến nóng hổi ngay khi có đơn.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {/* 2. EXCLUSIVE VOUCHERS SECTION */}
        <div className="bg-white rounded-[14px] border border-[#dddddd] p-5 sm:p-7 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#dddddd] pb-3">
            <h2 className="text-lg sm:text-xl font-bold text-[#181d26] flex items-center gap-2">
              <Ticket className="w-5 h-5 text-[#A30029]" />
              Voucher độc quyền
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
            {exclusiveCoupons.map((c) => {
              const isSaved = savedCodes.includes(c.code);
              return (
                <div
                  key={c.code}
                  className="bg-gradient-to-br from-white to-[#fff5f6] border border-[#fecdd3] rounded-[10px] p-4 flex flex-col justify-between space-y-3 relative shadow-2xs hover:shadow-md transition"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#A30029] bg-white px-2 py-0.5 rounded border border-[#fecdd3]">
                        {c.badge}
                      </span>
                      <span className="text-[11px] font-bold text-[#41454d] bg-gray-100 px-2 py-0.5 rounded">
                        {c.minOrder}
                      </span>
                    </div>
                    <h3 className="font-bold text-[16px] text-[#A30029] pt-1">{c.discount}</h3>
                    <p className="text-[12px] text-[#41454d] leading-relaxed">{c.minOrder}</p>
                  </div>

                  <div className="pt-2 border-t border-[#fecdd3]/60 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setConditionModalCoupon(c)}
                      className="text-[12px] text-[#555a64] hover:text-[#A30029] font-medium flex items-center gap-1 cursor-pointer transition underline"
                    >
                      <Info className="w-3.5 h-3.5" />
                      <span>Điều kiện</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSaveCoupon(c.code)}
                      className={`flex items-center gap-1 px-4 py-1.5 text-[12px] font-semibold rounded-[6px] transition cursor-pointer shadow-2xs ${
                        isSaved
                          ? 'bg-[#16a34a] text-white'
                          : 'bg-[#A30029] hover:bg-[#850021] text-white'
                      }`}
                    >
                      {isSaved ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Đã lưu</span>
                        </>
                      ) : (
                        <span>Lưu</span>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. CATEGORY FILTERS */}
        <div className="flex items-center justify-between gap-3 overflow-x-auto pb-1">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-[8px] text-[13px] font-semibold transition cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-[#A30029] text-white shadow-xs'
                  : 'bg-white border border-[#dddddd] text-[#41454d] hover:bg-red-50 hover:text-[#A30029]'
              }`}
            >
              🔥 Tất cả món Hot ({products.length})
            </button>
            <button
              onClick={() => setSelectedCategory(1)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-[8px] text-[13px] font-semibold transition cursor-pointer ${
                selectedCategory === 1
                  ? 'bg-[#A30029] text-white shadow-xs'
                  : 'bg-white border border-[#dddddd] text-[#41454d] hover:bg-red-50 hover:text-[#A30029]'
              }`}
            >
              <UtensilsCrossed className="w-3.5 h-3.5" />
              <span>Cơm & Món chính Hot</span>
            </button>
            <button
              onClick={() => setSelectedCategory(2)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-[8px] text-[13px] font-semibold transition cursor-pointer ${
                selectedCategory === 2
                  ? 'bg-[#A30029] text-white shadow-xs'
                  : 'bg-white border border-[#dddddd] text-[#41454d] hover:bg-red-50 hover:text-[#A30029]'
              }`}
            >
              <Sandwich className="w-3.5 h-3.5" />
              <span>Ăn vặt Hot</span>
            </button>
            <button
              onClick={() => setSelectedCategory(3)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-[8px] text-[13px] font-semibold transition cursor-pointer ${
                selectedCategory === 3
                  ? 'bg-[#A30029] text-white shadow-xs'
                  : 'bg-white border border-[#dddddd] text-[#41454d] hover:bg-red-50 hover:text-[#A30029]'
              }`}
            >
              <Coffee className="w-3.5 h-3.5" />
              <span>Đồ uống Hot</span>
            </button>
          </div>

          <Link
            href="/menu"
            className="text-[13px] font-semibold text-[#A30029] hover:underline flex items-center gap-1 whitespace-nowrap"
          >
            <span>Xem toàn bộ thực đơn</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* 4. DISHES GRID WITH RANKING BADGES */}
        {loading ? (
          <div className="py-24 text-center text-gray-400 space-y-2">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#A30029]" />
            <p className="text-[14px]">Đang tải danh sách món ăn bán chạy nhất...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-white rounded-[10px] border border-[#dddddd] p-12 text-center text-[#9297a0] space-y-3">
            <Flame className="w-10 h-10 text-gray-300 mx-auto" />
            <p className="text-[14px] text-[#41454d] font-medium">Không có món ăn nào trong danh mục này</p>
            <Link
              href="/menu"
              className="inline-block px-4 py-2 bg-[#A30029] text-white text-[13px] font-semibold rounded-[6px]"
            >
              Quay lại thực đơn
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
            {filteredProducts.slice(0, 9).map((product, index) => {
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

      {/* Condition Modal Dialog */}
      {conditionModalCoupon && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-[12px] border border-[#dddddd] shadow-2xl max-w-md w-full overflow-hidden flex flex-col animate-in zoom-in-95">
            <div className="p-4 bg-gradient-to-r from-[#181d26] to-[#2c3440] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Ticket className="w-4 h-4 text-[#A30029]" />
                <h3 className="font-bold text-[15px] text-white">Chi tiết điều kiện voucher</h3>
              </div>
              <button
                type="button"
                onClick={() => setConditionModalCoupon(null)}
                className="p-1 text-gray-300 hover:text-white rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3.5 text-[13px]">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#A30029] bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                  {conditionModalCoupon.badge}
                </span>
                <h4 className="text-[17px] font-bold text-[#181d26] mt-1.5">{conditionModalCoupon.discount}</h4>
                <p className="text-[13px] text-[#41454d] font-medium mt-0.5">{conditionModalCoupon.minOrder}</p>
              </div>

              <div className="p-3 bg-[#f8fafc] rounded-[8px] border border-[#dddddd] space-y-1.5">
                <span className="font-semibold text-[#181d26] block">Quy định áp dụng:</span>
                <p className="text-[#41454d] leading-relaxed text-[12px]">
                  {conditionModalCoupon.condition}
                </p>
              </div>
            </div>

            <div className="p-3 bg-[#f8fafc] border-t border-[#dddddd] flex justify-end">
              <button
                type="button"
                onClick={() => setConditionModalCoupon(null)}
                className="px-4 py-2 bg-[#A30029] text-white text-[13px] font-semibold rounded-[6px] transition cursor-pointer hover:bg-[#850021]"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
