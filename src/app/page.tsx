import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { CiCircleChevRight } from 'react-icons/ci';
import { getProducts } from '@/lib/db';
import ProductCard from '@/components/ProductCard';
import BannerSlider from '@/components/BannerSlider';
import HeroFoodCollage from '@/components/HeroFoodCollage';

export const revalidate = 0; // Dynamic

export default async function HomePage() {
  let allProducts: any[] = [];
  let featuredProducts: any[] = [];
  let bestSellers: any[] = [];
  try {
    allProducts = await getProducts();
    featuredProducts = allProducts.filter((p) => p.isFeatured);
    // 8 best sellers: prioritized featured products, padded with popular items
    bestSellers = [
      ...featuredProducts,
      ...allProducts.filter((p) => !p.isFeatured),
    ].slice(0, 8);
  } catch (e) {
    console.error('Error loading products for homepage:', e);
  }

  return (
    <div className="bg-[#FFFAF0] min-h-screen relative overflow-x-hidden">
      {/* 1. HERO SECTION (100% Faithful to landingpage.png & Responsive across all laptop/desktop heights) */}
      <section className="relative overflow-hidden bg-[#FFFAF0] h-[calc(100vh-64px)] min-h-[600px] max-h-[1080px] flex flex-col justify-start pt-6 sm:pt-8 lg:pt-10 xl:pt-12 2xl:pt-14">
        {/* The 6 Food Dishes Collage (Desktop presentation) */}
        <div className="hidden lg:block absolute inset-0 pointer-events-none">
          <HeroFoodCollage />
        </div>

        {/* Hero Left Content Column - Shifted upward with compact buttons to never overlap Banh xeo */}
        <div className="max-w-[1800px] mx-auto px-6 sm:px-10 lg:px-16 xl:px-20 2xl:px-[127px] w-full relative z-20">
          <div className="max-w-xl lg:max-w-3xl xl:max-w-4xl">
            <h1 className="font-sans text-3xl sm:text-4xl md:text-5xl lg:text-[44px] xl:text-[52px] 2xl:text-[60px] font-extrabold tracking-tight text-[#0f172a] leading-[1.12]">
              <span className="block whitespace-nowrap">Thưởng thức món ngon</span>
              <span className="block whitespace-nowrap mt-1 sm:mt-1.5">
                <span className="text-[#e31837]">chuẩn vị</span> &amp; giao tận nơi
              </span>
            </h1>

            <div className="mt-3 sm:mt-4 xl:mt-5 text-[15px] sm:text-[16px] xl:text-[17px] text-[#677992] font-normal leading-[1.6] space-y-0.5">
              <p>Bún phở, cơm tấm và đồ uống thanh mát chế biến trong ngày.</p>
              <p>Đặt món dễ dàng, luôn nóng hổi.</p>
            </div>

            {/* Red & White Action Buttons - Compact size and elevated position */}
            <div className="mt-5 sm:mt-6 xl:mt-7 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
              <Link
                href="/menu"
                className="inline-flex items-center justify-center bg-[#e31837] hover:bg-[#c9122c] active:bg-[#a50b20] text-white font-bold text-[15px] sm:text-[16px] px-7 sm:px-8 py-3 sm:py-3.5 rounded-xl shadow-md shadow-red-500/20 transition duration-200 hover:scale-[1.02] active:scale-[0.98] text-center"
              >
                Khám phá thực đơn
              </Link>
              <Link
                href="/orders"
                className="inline-flex items-center justify-center bg-white hover:bg-neutral-50 active:bg-neutral-100 text-[#0f172a] hover:text-[#e31837] font-bold text-[15px] sm:text-[16px] px-7 sm:px-8 py-3 sm:py-3.5 rounded-xl border border-[#dddddd] hover:border-[#cccccc] shadow-xs transition duration-200 hover:scale-[1.02] active:scale-[0.98] text-center"
              >
                Tra cứu đơn hàng
              </Link>
            </div>
          </div>

          {/* Mobile Food Showcase (< lg only) */}
          <div className="mt-8 sm:mt-12 lg:hidden flex justify-center">
            <div className="relative w-full max-w-xs sm:max-w-sm aspect-4/3 flex items-center justify-center">
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

      {/* 2. BEST SELLER CAROUSEL BANNER (8 Items Looping Carousel) */}
      <BannerSlider bestSellers={bestSellers} />

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
