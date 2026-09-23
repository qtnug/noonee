import React from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Truck,
  ShieldCheck,
  Clock,
  Utensils,
  ChevronRight,
  Star,
} from 'lucide-react';
import { getProducts } from '@/lib/db';
import ScrollFoodVideo from '@/components/ScrollFoodVideo';
import ProductCard from '@/components/ProductCard';
import PromoBanner from '@/components/PromoBanner';
import GroupOrderBanner from '@/components/GroupOrderBanner';
import FloatingFoodDecor from '@/components/FloatingFoodDecor';

export const revalidate = 0; // Dynamic

export default async function HomePage() {
  let featuredProducts: any[] = [];
  try {
    featuredProducts = await getProducts({ isFeatured: true });
  } catch (e) {
    console.error('Error loading featured products:', e);
  }

  const bestSellers = featuredProducts;

  return (
    <div className="bg-[#FFFAF0] min-h-screen relative overflow-x-hidden">
      {/* 2-Side Floating Food Elements Distributed Down the Page (Desktop only) */}
      <FloatingFoodDecor />

      {/* 1. HERO BAND (Minimalist & Punchy Editorial Theme) */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#fff1f2]/60 via-[#FFFAF0] to-[#FFFAF0] border-b border-[#f0e3d6]">
        {/* Subtle noise overlay */}
        <div
          className="absolute inset-0 opacity-[0.025] pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat',
            backgroundSize: '128px 128px',
          }}
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 lg:py-20 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Content Column */}
            <div className="lg:col-span-6 space-y-4 sm:space-y-6">
              <h1 className="text-3xl sm:text-5xl lg:text-[46px] font-extrabold tracking-tight text-[#0f172a] leading-[1.15]">
                Thưởng thức món ngon, <br className="hidden sm:inline" />
                <span className="text-[#e31837]">chuẩn vị</span> &amp; giao tận nơi
              </h1>

              <p className="text-[15px] sm:text-[17px] text-[#475569] font-medium leading-relaxed max-w-lg">
                Bún phở, cơm tấm và đồ uống thanh mát chế biến trong ngày. Đặt món dễ dàng, luôn nóng hổi.
              </p>

              {/* Red & White CTA Button Pair */}
              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 relative z-20">
                <Link
                  href="/menu"
                  className="inline-flex items-center justify-center bg-[#e31837] hover:bg-[#be0e27] active:bg-[#a50b20] text-white font-bold text-[15px] sm:text-[16px] leading-[1.4] px-7 py-3.5 rounded-[8px] shadow-md shadow-red-500/20 transition"
                >
                  Khám phá thực đơn
                </Link>
                <Link
                  href="/orders"
                  className="inline-flex items-center justify-center bg-white hover:bg-rose-50/60 text-[#0f172a] hover:text-[#e31837] font-bold text-[15px] sm:text-[16px] leading-[1.4] px-7 py-3.5 rounded-[8px] border border-[#dddddd] hover:border-[#e31837] transition"
                >
                  Tra cứu đơn hàng
                </Link>
              </div>
            </div>

            {/* Right Visual Fragment: Scroll-driven 360 Food Video */}
            <div className="lg:col-span-6 flex items-center justify-center relative z-20">
              <ScrollFoodVideo totalFrames={100} />
            </div>
          </div>
        </div>
      </section>

      {/* 2. COMPACT TRUST BAR (Minimalist, Zero Fluff) */}
      <section className="border-b border-[#f0e3d6] bg-[#fdf5ec]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-rose-100 text-[#e31837] flex items-center justify-center shrink-0">
                <Truck className="w-4 h-4" />
              </div>
              <span className="text-[13px] sm:text-[14px] font-bold text-[#0f172a]">Giao nóng 30 phút</span>
            </div>

            <div className="flex items-center justify-center md:justify-start gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-rose-100 text-[#e31837] flex items-center justify-center shrink-0">
                <Utensils className="w-4 h-4" />
              </div>
              <span className="text-[13px] sm:text-[14px] font-bold text-[#0f172a]">Chế biến chuẩn vị</span>
            </div>

            <div className="flex items-center justify-center md:justify-start gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-rose-100 text-[#e31837] flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <span className="text-[13px] sm:text-[14px] font-bold text-[#0f172a]">Nguyên liệu tươi sạch</span>
            </div>

            <div className="flex items-center justify-center md:justify-start gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-rose-100 text-[#e31837] flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <span className="text-[13px] sm:text-[14px] font-bold text-[#0f172a]">Mở cửa 06:00 - 24:00</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. SIGNATURE VIETQR PROMO BANNER (full-width, self-contained) */}
      <PromoBanner />

      {/* 4. BEST SELLER STRIP */}
      {bestSellers.length > 0 && (
        <section className="bg-[#FFFAF0] py-10 border-b border-[#f0e3d6]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Section header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0f172a]">
                  🔥 Bán Chạy Nhất
                </h2>
                <span className="px-2.5 py-1 rounded-[8px] bg-amber-400 text-[#0f0f0f] text-[12px] font-black shadow-sm">
                  −20% VietQR
                </span>
              </div>
              <Link
                href="/menu"
                className="text-[14px] font-bold text-[#e31837] hover:underline flex items-center gap-1 transition"
              >
                <span>Xem tất cả</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Horizontal scrollable snap strip */}
            <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 scrollbar-none"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {bestSellers.slice(0, 10).map((product) => (
                <Link
                  key={product.id}
                  href={`/menu/${product.id}`}
                  className="group snap-start shrink-0 w-48 bg-white rounded-[14px] border border-[#f0e3d6] shadow-sm hover:shadow-md hover:border-[#e31837]/30 transition-all overflow-hidden"
                >
                  {/* Product image */}
                  <div className="relative w-full h-32 bg-[#fdf5ec] overflow-hidden">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl">🍜</div>
                    )}
                    {/* HOT badge */}
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded-[6px] bg-[#e31837] text-white text-[10px] font-black shadow-sm">
                      HOT 🔥
                    </div>
                  </div>
                  {/* Product info */}
                  <div className="p-3 space-y-1">
                    <p className="text-[13px] font-bold text-[#0f172a] leading-tight line-clamp-2">
                      {product.name}
                    </p>
                    <p className="text-[13px] font-extrabold text-[#e31837]">
                      {typeof product.price === 'number'
                        ? product.price.toLocaleString('vi-VN') + 'đ'
                        : product.price}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 5. GROUP ORDER BANNER */}
      <GroupOrderBanner />

      {/* 6. FEATURED PRODUCTS (2 Rows = 8 Items) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-16">
        <div className="flex items-center justify-between mb-8 pb-3 border-b border-[#dddddd]">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0f172a]">
            Món ăn nổi bật
          </h2>
          <Link
            href="/menu"
            className="text-[14px] font-bold text-[#e31837] hover:underline flex items-center gap-1 transition"
          >
            <span>Xem tất cả</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
          {featuredProducts.slice(0, 8).map((product) => (
            <ProductCard key={product.id} product={product} badgeText="Nổi bật" />
          ))}
        </div>
      </section>
    </div>
  );
}
