import React from 'react';
import Link from 'next/link';
import { getProducts } from '@/lib/db';
import HeroFoodCollage from '@/components/HeroFoodCollage';
import ScrollReveal from '@/components/ScrollReveal';
import HomeFeaturedContent from '@/components/HomeFeaturedContent';

export const revalidate = 0; // Dynamic

export default async function HomePage() {
  let productsWithSales: any[] = [];
  try {
    const allProducts = await getProducts();
    productsWithSales = allProducts.filter((p) => (p.soldCount || 0) > 0);
  } catch (e) {
    console.error('Error loading products for homepage:', e);
  }

  return (
    <div className="bg-[#FFFAF0] min-h-screen relative overflow-x-hidden">
      {/* 1. HERO SECTION:
          - Desktop (lg+): Full height with HeroFoodCollage (6 floating dishes)
          - Mobile (< lg): Simplified, clean, compact, NO food images, with quick trust badges
      */}
      <section className="relative overflow-hidden bg-[#FFFAF0] py-8 sm:py-12 lg:py-0 lg:h-[calc(100vh-64px)] lg:min-h-[600px] lg:max-h-[1080px] flex flex-col justify-start pt-6 sm:pt-10 lg:pt-10 xl:pt-12 2xl:pt-14">
        {/* The 6 Food Dishes Collage (Desktop presentation only) */}
        <div className="hidden lg:block absolute inset-0 pointer-events-none">
          <HeroFoodCollage />
        </div>

        {/* Hero Left Content Column */}
        <div className="max-w-[1800px] mx-auto px-6 sm:px-10 lg:px-16 xl:px-20 2xl:px-[127px] w-full relative z-20">
          <ScrollReveal animation="fade-up" duration={700}>
            <div className="max-w-xl lg:max-w-3xl xl:max-w-4xl">
              <h1 className="font-sans text-3xl sm:text-4xl md:text-5xl lg:text-[44px] xl:text-[52px] 2xl:text-[60px] font-extrabold tracking-tight text-[#0f172a] leading-[1.18] sm:leading-[1.12]">
                <span className="block sm:whitespace-nowrap">Thưởng thức món ngon</span>
                <span className="block sm:whitespace-nowrap mt-1 sm:mt-1.5">
                  <span className="text-[#A30029]">chuẩn vị</span> &amp; giao tận nơi
                </span>
              </h1>

              <div className="mt-3 sm:mt-4 xl:mt-5 text-[15px] sm:text-[16px] xl:text-[17px] text-[#677992] font-normal leading-[1.6] space-y-0.5">
                <p>Bún phở, cơm tấm và đồ uống thanh mát chế biến trong ngày.</p>
                <p>Đặt món dễ dàng, luôn nóng hổi.</p>
              </div>

              {/* Red & White Action Buttons */}
              <div className="mt-5 sm:mt-6 xl:mt-7 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                <Link
                  href="/menu"
                  className="btn-shine inline-flex items-center justify-center bg-[#A30029] hover:bg-[#850021] active:bg-[#6e001b] text-white font-bold text-[15px] sm:text-[16px] px-7 sm:px-8 py-3 sm:py-3.5 rounded-xl shadow-md shadow-red-500/20 transition duration-200 hover:scale-[1.02] active:scale-[0.98] text-center"
                >
                  Khám phá thực đơn
                </Link>
                <Link
                  href="/orders"
                  className="inline-flex items-center justify-center bg-white hover:bg-neutral-50 active:bg-neutral-100 text-[#0f172a] hover:text-[#A30029] font-bold text-[15px] sm:text-[16px] px-7 sm:px-8 py-3 sm:py-3.5 rounded-xl border border-[#dddddd] hover:border-[#cccccc] shadow-xs transition duration-200 hover:scale-[1.02] active:scale-[0.98] text-center"
                >
                  Tra cứu đơn hàng
                </Link>
              </div>
            </div>
          </ScrollReveal>

          {/* Mobile Quick Highlights (< lg only) - Clean, fast, minimalist, NO food images */}
          <ScrollReveal animation="fade-up" delay={150} duration={650}>
            <div className="mt-7 pt-6 border-t border-[#eedfd0]/80 lg:hidden">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#A30029] mb-3">
                Cam kết từ NooNee Food
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                <div className="bg-white/85 backdrop-blur-xs border border-[#eedfd0] rounded-xl p-3 shadow-xs">
                  <span className="text-base block mb-0.5">⚡</span>
                  <p className="text-xs font-bold text-[#0f172a]">Giao siêu tốc 30p</p>
                  <p className="text-[11px] text-[#677992]">Đồ ăn luôn nóng hổi</p>
                </div>
                <div className="bg-white/85 backdrop-blur-xs border border-[#eedfd0] rounded-xl p-3 shadow-xs">
                  <span className="text-base block mb-0.5">🚚</span>
                  <p className="text-xs font-bold text-[#0f172a]">Freeship từ 120k</p>
                  <p className="text-[11px] text-[#677992]">Tiết kiệm mọi đơn hàng</p>
                </div>
                <div className="bg-white/85 backdrop-blur-xs border border-[#eedfd0] rounded-xl p-3 shadow-xs">
                  <span className="text-base block mb-0.5">🍜</span>
                  <p className="text-xs font-bold text-[#0f172a]">Tươi ngon chuẩn vị</p>
                  <p className="text-[11px] text-[#677992]">Chế biến trong ngày</p>
                </div>
                <div className="bg-white/85 backdrop-blur-xs border border-[#eedfd0] rounded-xl p-3 shadow-xs">
                  <span className="text-base block mb-0.5">👥</span>
                  <p className="text-xs font-bold text-[#0f172a]">Đặt nhóm tiện lợi</p>
                  <p className="text-[11px] text-[#677992]">Gom 1 đơn, dễ chia tiền</p>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* 2. BEST SELLER BANNER & FEATURED PRODUCTS (Filtered reactively by active branch) */}
      <HomeFeaturedContent productsWithSales={productsWithSales} />
    </div>
  );
}
