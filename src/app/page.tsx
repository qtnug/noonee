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
      {/* 1. HERO BAND (Red & White Editorial Theme) */}
      <section className="bg-white border-b border-[#dddddd]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Content Column */}
            <div className="lg:col-span-6 space-y-4 sm:space-y-6">
              <h1 className="text-3xl sm:text-5xl lg:text-[44px] font-normal tracking-tight text-[#181d26] leading-[1.18]">
                Hệ thống đặt món ăn trực tuyến nhanh chóng & tiện lợi
              </h1>

              <p className="text-[14px] sm:text-[16px] text-[#41454d] leading-relaxed max-w-xl">
                Khám phá thực đơn phong phú từ cơm rang, bún phở truyền thống đến các món ăn vặt giòn rụm và thức uống thanh mát. Đặt món dễ dàng, giao nhanh tận nơi, đảm bảo luôn nóng hổi.
              </p>

              {/* Red & White CTA Button Pair */}
              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <Link
                  href="/menu"
                  className="inline-flex items-center justify-center bg-[#e31837] hover:bg-[#be0e27] active:bg-[#a50b20] text-white font-medium text-[15px] sm:text-[16px] leading-[1.4] px-6 sm:px-7 py-3 sm:py-3.5 rounded-[6px] shadow-sm transition"
                >
                  Khám phá thực đơn
                </Link>
                <Link
                  href="/orders"
                  className="inline-flex items-center justify-center bg-white hover:bg-[#fff1f2] text-[#e31837] font-medium text-[15px] sm:text-[16px] leading-[1.4] px-6 sm:px-7 py-3 sm:py-3.5 rounded-[6px] border border-[#e31837] transition"
                >
                  Tra cứu đơn hàng
                </Link>
              </div>
            </div>

            {/* Right Visual Fragment: Scroll-driven 360 Food Video */}
            <div className="lg:col-span-6">
              <ScrollFoodVideo
                totalFrames={100}
                dishName="Bún Bò Huế Cay Nồng Đặc Biệt"
                price={42000}
                dishCategory="Món Nước Nóng Hổi"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 2. TRUST BAR */}
      <section className="border-b border-[#dddddd] bg-[#f8fafc]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-3">
              <div className="w-10 h-10 rounded-[6px] bg-[#fff1f2] border border-[#fecdd3] text-[#e31837] flex items-center justify-center shrink-0">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-[14px] font-semibold text-[#181d26]">Giao hàng 30 phút</h4>
                <p className="text-[12px] text-[#9297a0]">Món ăn luôn nóng hổi</p>
              </div>
            </div>

            <div className="flex items-center justify-center md:justify-start gap-3">
              <div className="w-10 h-10 rounded-[6px] bg-[#fff1f2] border border-[#fecdd3] text-[#e31837] flex items-center justify-center shrink-0">
                <Utensils className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-[14px] font-semibold text-[#181d26]">Chế biến chuẩn vị</h4>
                <p className="text-[12px] text-[#9297a0]">Hương vị gia truyền đậm đà</p>
              </div>
            </div>

            <div className="flex items-center justify-center md:justify-start gap-3">
              <div className="w-10 h-10 rounded-[6px] bg-[#fff1f2] border border-[#fecdd3] text-[#e31837] flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-[14px] font-semibold text-[#181d26]">Nguyên liệu tươi sạch</h4>
                <p className="text-[12px] text-[#9297a0]">Đảm bảo vệ sinh 100%</p>
              </div>
            </div>

            <div className="flex items-center justify-center md:justify-start gap-3">
              <div className="w-10 h-10 rounded-[6px] bg-[#fff1f2] border border-[#fecdd3] text-[#e31837] flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-[14px] font-semibold text-[#181d26]">07:00 - 22:00</h4>
                <p className="text-[12px] text-[#9297a0]">Phục vụ tất cả các ngày</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. SIGNATURE RED BANNER (PromoBanner with auto-hide after first paid VietQR order) */}
      <PromoBanner />

      {/* 4. FEATURED PRODUCTS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8 pb-3 border-b border-[#dddddd]">
          <div>
            <h2 className="text-2xl font-normal text-[#181d26]">Món ăn nổi bật hôm nay</h2>
            <p className="text-[14px] text-[#41454d] mt-1">
              Những món ngon được lựa chọn và chuẩn bị đặc biệt trong ngày
            </p>
          </div>
          <Link
            href="/menu"
            className="text-[14px] font-semibold text-[#e31837] hover:underline flex items-center gap-1 transition"
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

      {/* 6. RED & WHITE THEMATIC CARDS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="bg-white border border-[#dddddd] hover:border-[#e31837] rounded-[10px] p-6 flex flex-col justify-between h-64 transition-colors group">
            <div>
              <span className="text-[11px] font-bold text-[#e31837] uppercase tracking-wider">
                Cơm & Món chính
              </span>
              <h3 className="text-xl font-semibold text-[#181d26] mt-2 group-hover:text-[#e31837] transition-colors">
                Cơm rang & Bún phở gia truyền
              </h3>
              <p className="text-[13px] text-[#41454d] mt-2 leading-relaxed">
                Hương vị truyền thống đậm đà, hạt cơm vàng giòn và nước dùng hầm xương kỹ lưỡng thơm ngon.
              </p>
            </div>
            <Link
              href="/menu?categoryId=1"
              className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#e31837] hover:underline pt-3 border-t border-[#fecdd3]"
            >
              <span>Xem danh mục</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Card 2 */}
          <div className="bg-white border border-[#dddddd] hover:border-[#e31837] rounded-[10px] p-6 flex flex-col justify-between h-64 transition-colors group">
            <div>
              <span className="text-[11px] font-bold text-[#e31837] uppercase tracking-wider">
                Đồ ăn vặt
              </span>
              <h3 className="text-xl font-semibold text-[#181d26] mt-2 group-hover:text-[#e31837] transition-colors">
                Bánh tráng & Ăn vặt nóng giòn
              </h3>
              <p className="text-[13px] text-[#41454d] mt-2 leading-relaxed">
                Bánh tráng nướng, bánh tráng trộn, nem chua rán và phô mai que giòn rụm thơm ngon.
              </p>
            </div>
            <Link
              href="/menu?categoryId=2"
              className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#e31837] hover:underline pt-3 border-t border-[#fecdd3]"
            >
              <span>Xem danh mục</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Card 3 */}
          <div className="bg-white border border-[#dddddd] hover:border-[#e31837] rounded-[10px] p-6 flex flex-col justify-between h-64 transition-colors group">
            <div>
              <span className="text-[11px] font-bold text-[#e31837] uppercase tracking-wider">
                Đồ uống & Tráng miệng
              </span>
              <h3 className="text-xl font-semibold text-[#181d26] mt-2 group-hover:text-[#e31837] transition-colors">
                Trà sữa, Cà phê & Nước ép thanh mát
              </h3>
              <p className="text-[13px] text-[#41454d] mt-2 leading-relaxed">
                Trà sữa tự chọn topping, cà phê sữa phin Đắk Lắk đậm đà cùng các loại chè và sữa chua mát lạnh.
              </p>
            </div>
            <Link
              href="/menu?categoryId=3"
              className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#e31837] hover:underline pt-3 border-t border-[#fecdd3]"
            >
              <span>Xem danh mục</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
