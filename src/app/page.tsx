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

export const revalidate = 0; // Dynamic

export default async function HomePage() {
  let featuredProducts: any[] = [];
  try {
    featuredProducts = await getProducts({ isFeatured: true });
  } catch (e) {
    console.error('Error loading featured products:', e);
  }

  return (
    <div className="bg-white min-h-screen">
      {/* 1. HERO BAND (Minimalist & Punchy Editorial Theme) */}
      <section className="bg-gradient-to-b from-[#fff1f2]/50 via-white to-white border-b border-[#f1f5f9]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Content Column */}
            <div className="lg:col-span-6 space-y-4 sm:space-y-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-[#e31837] text-[12px] font-bold border border-rose-200 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-[#e31837] animate-pulse" />
                <span>Món ngon nóng hổi • Giao nhanh 30 phút</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-[46px] font-extrabold tracking-tight text-[#0f172a] leading-[1.15]">
                Thưởng thức món ngon, <br className="hidden sm:inline" />
                <span className="text-[#e31837]">chuẩn vị</span> & giao tận nơi
              </h1>

              <p className="text-[15px] sm:text-[17px] text-[#475569] font-medium leading-relaxed max-w-lg">
                Bún phở, cơm tấm và đồ uống thanh mát chế biến trong ngày. Đặt món dễ dàng, luôn nóng hổi.
              </p>

              {/* Red & White CTA Button Pair */}
              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
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
            <div className="lg:col-span-6 flex items-center justify-center">
              <ScrollFoodVideo totalFrames={100} />
            </div>
          </div>
        </div>
      </section>

      {/* 2. COMPACT TRUST BAR (Minimalist, Zero Fluff) */}
      <section className="border-b border-[#f1f5f9] bg-[#f8fafc]">
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
              <span className="text-[13px] sm:text-[14px] font-bold text-[#0f172a]">Mở cửa 07:00 - 22:00</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. SIGNATURE RED BANNER (PromoBanner with auto-hide after first paid VietQR order) */}
      <PromoBanner />

      {/* 4. FEATURED PRODUCTS (Clean Header, No Fluff Text) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
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
          {featuredProducts.slice(0, 16).map((product) => (
            <ProductCard key={product.id} product={product} badgeText="Nổi bật" />
          ))}
        </div>
      </section>

      {/* 5. GROUP ORDER BANNER */}
      <GroupOrderBanner />

      {/* 6. CLEAN CATEGORY CARDS (Minimalist, Crisp) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <Link
            href="/menu?categoryId=1"
            className="bg-white border border-[#dddddd] hover:border-[#e31837] rounded-[12px] p-6 flex flex-col justify-between h-48 transition-all hover:-translate-y-1 hover:shadow-md group"
          >
            <div>
              <span className="text-[11px] font-bold text-[#e31837] uppercase tracking-wider bg-rose-50 px-2 py-0.5 rounded">
                Cơm & Món chính
              </span>
              <h3 className="text-xl font-bold text-[#0f172a] mt-3 group-hover:text-[#e31837] transition-colors">
                Cơm rang & Bún phở gia truyền
              </h3>
            </div>
            <div className="inline-flex items-center gap-1.5 text-[13px] font-bold text-[#e31837] pt-3 border-t border-[#f1f5f9]">
              <span>Khám phá ngay</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Card 2 */}
          <Link
            href="/menu?categoryId=2"
            className="bg-white border border-[#dddddd] hover:border-[#e31837] rounded-[12px] p-6 flex flex-col justify-between h-48 transition-all hover:-translate-y-1 hover:shadow-md group"
          >
            <div>
              <span className="text-[11px] font-bold text-[#e31837] uppercase tracking-wider bg-rose-50 px-2 py-0.5 rounded">
                Đồ ăn vặt
              </span>
              <h3 className="text-xl font-bold text-[#0f172a] mt-3 group-hover:text-[#e31837] transition-colors">
                Bánh tráng & Ăn vặt nóng giòn
              </h3>
            </div>
            <div className="inline-flex items-center gap-1.5 text-[13px] font-bold text-[#e31837] pt-3 border-t border-[#f1f5f9]">
              <span>Khám phá ngay</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Card 3 */}
          <Link
            href="/menu?categoryId=3"
            className="bg-white border border-[#dddddd] hover:border-[#e31837] rounded-[12px] p-6 flex flex-col justify-between h-48 transition-all hover:-translate-y-1 hover:shadow-md group"
          >
            <div>
              <span className="text-[11px] font-bold text-[#e31837] uppercase tracking-wider bg-rose-50 px-2 py-0.5 rounded">
                Đồ uống & Tráng miệng
              </span>
              <h3 className="text-xl font-bold text-[#0f172a] mt-3 group-hover:text-[#e31837] transition-colors">
                Trà sữa, Cà phê & Nước ép
              </h3>
            </div>
            <div className="inline-flex items-center gap-1.5 text-[13px] font-bold text-[#e31837] pt-3 border-t border-[#f1f5f9]">
              <span>Khám phá ngay</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
      </section>
    </div>
  );
}
