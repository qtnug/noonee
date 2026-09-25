import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  CiDeliveryTruck,
  CiCircleCheck,
  CiClock2,
  CiForkAndKnife,
  CiCircleChevRight,
} from 'react-icons/ci';
import { getProducts } from '@/lib/db';
import ProductCard from '@/components/ProductCard';
import BannerSlider from '@/components/BannerSlider';
import HeroFoodCollage from '@/components/HeroFoodCollage';

export const revalidate = 0; // Dynamic

export default async function HomePage() {
  let featuredProducts: any[] = [];
  try {
    featuredProducts = await getProducts({ isFeatured: true });
  } catch (e) {
    console.error('Error loading featured products:', e);
  }

  return (
    <div className="bg-[#FFFAF0] min-h-screen relative overflow-x-hidden">
      {/* 1. HERO SECTION (100% Faithful to landingpage.png) */}
      <section className="relative overflow-hidden bg-[#FFFAF0] lg:h-[calc(100vh-64px)] min-h-[680px] flex items-center">
        {/* The 6 Food Dishes Collage (Desktop presentation) */}
        <div className="hidden lg:block absolute inset-0 pointer-events-none">
          <HeroFoodCollage />
        </div>

        {/* Hero Left Content Column (Left margin aligned to x=126px on 1800px viewport) */}
        <div className="max-w-[1680px] mx-auto px-6 sm:px-10 lg:px-14 xl:px-16 w-full relative z-20 py-12 lg:py-0">
          <div className="max-w-xl lg:max-w-2xl">
            <h1 className="text-4xl sm:text-5xl lg:text-[54px] xl:text-[62px] 2xl:text-[68px] font-extrabold tracking-tight text-[#0f172a] leading-[1.12]">
              <span className="block whitespace-nowrap">Thưởng thức món ngon</span>
              <span className="block whitespace-nowrap mt-1 sm:mt-2">
                <span className="text-[#e31837]">chuẩn vị</span> &amp; giao tận nơi
              </span>
            </h1>

            <div className="mt-4 sm:mt-6 text-[15px] sm:text-[17px] xl:text-[18px] text-[#677992] font-normal leading-relaxed space-y-1">
              <p>Bún phở, cơm tấm và đồ uống thanh mát chế biến trong ngày.</p>
              <p>Đặt món dễ dàng, luôn nóng hổi.</p>
            </div>

            {/* Red & White Action Buttons */}
            <div className="mt-8 sm:mt-9 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 sm:gap-4">
              <Link
                href="/menu"
                className="inline-flex items-center justify-center bg-[#e31837] hover:bg-[#c9122c] active:bg-[#a50b20] text-white font-bold text-[16px] px-8 py-3.5 sm:py-4 rounded-xl shadow-lg shadow-red-500/25 transition duration-200 hover:scale-[1.02] active:scale-[0.98] text-center"
              >
                Khám phá thực đơn
              </Link>
              <Link
                href="/orders"
                className="inline-flex items-center justify-center bg-white hover:bg-neutral-50 active:bg-neutral-100 text-[#0f172a] hover:text-[#e31837] font-bold text-[16px] px-8 py-3.5 sm:py-4 rounded-xl border border-[#dddddd] hover:border-[#cccccc] shadow-xs transition duration-200 hover:scale-[1.02] active:scale-[0.98] text-center"
              >
                Tra cứu đơn hàng
              </Link>
            </div>
          </div>

          {/* Mobile Food Showcase (< lg only) */}
          <div className="mt-12 lg:hidden flex justify-center">
            <div className="relative w-full max-w-sm sm:max-w-md aspect-4/3 flex items-center justify-center">
              <Image
                src="/foods_nobg/gapopcorn_hero.png"
                alt="Gà popcorn"
                width={949}
                height={516}
                priority
                className="w-4/5 h-auto drop-shadow-2xl z-10"
              />
              <Image
                src="/foods_nobg/trasua_hero.png"
                alt="Trà sữa"
                width={527}
                height={741}
                priority
                className="w-1/3 h-auto drop-shadow-lg absolute -right-2 top-0"
              />
              <Image
                src="/foods_nobg/banhxeo_hero.png"
                alt="Bánh xèo"
                width={988}
                height={631}
                priority
                className="w-3/5 h-auto drop-shadow-lg absolute -left-2 -bottom-2"
              />
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
                <CiDeliveryTruck className="w-5 h-5 stroke-1" />
              </div>
              <span className="text-[13px] sm:text-[14px] font-bold text-[#0f172a]">Giao nóng 30 phút</span>
            </div>

            <div className="flex items-center justify-center md:justify-start gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-rose-100 text-[#e31837] flex items-center justify-center shrink-0">
                <CiForkAndKnife className="w-5 h-5 stroke-1" />
              </div>
              <span className="text-[13px] sm:text-[14px] font-bold text-[#0f172a]">Chế biến chuẩn vị</span>
            </div>

            <div className="flex items-center justify-center md:justify-start gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-rose-100 text-[#e31837] flex items-center justify-center shrink-0">
                <CiCircleCheck className="w-5 h-5 stroke-1" />
              </div>
              <span className="text-[13px] sm:text-[14px] font-bold text-[#0f172a]">Nguyên liệu tươi sạch</span>
            </div>

            <div className="flex items-center justify-center md:justify-start gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-rose-100 text-[#e31837] flex items-center justify-center shrink-0">
                <CiClock2 className="w-5 h-5 stroke-1" />
              </div>
              <span className="text-[13px] sm:text-[14px] font-bold text-[#0f172a]">Mở cửa 06:00 - 24:00</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. INTERACTIVE BANNER SLIDER (VietQR | Bán Chạy | Đặt Nhóm) */}
      <BannerSlider bestSellers={featuredProducts} />

      {/* 4. FEATURED PRODUCTS (2 Rows = 8 Items) */}
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
            <CiCircleChevRight className="w-5 h-5" />
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
