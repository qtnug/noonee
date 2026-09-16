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
import ProductCard from '@/components/ProductCard';
import PromoBanner from '@/components/PromoBanner';

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Content Column */}
            <div className="lg:col-span-7 space-y-6">
              <h1 className="text-4xl sm:text-5xl lg:text-[44px] font-normal tracking-tight text-[#181d26] leading-[1.15]">
                Hệ thống đặt món ăn trực tuyến nhanh chóng & tiện lợi
              </h1>

              <p className="text-[16px] text-[#41454d] leading-relaxed max-w-xl">
                Khám phá danh mục món ăn phong phú từ cơm tấm, bún phở truyền thống đến thức uống giải khát mát lạnh. Đặt món dễ dàng và giao nhanh tận nơi, đảm bảo luôn nóng hổi.
              </p>

              {/* Red & White CTA Button Pair */}
              <div className="pt-2 flex flex-wrap items-center gap-3">
                <Link
                  href="/menu"
                  className="inline-flex items-center justify-center bg-[#e31837] hover:bg-[#be0e27] active:bg-[#a50b20] text-white font-medium text-[16px] leading-[1.4] px-7 py-3.5 rounded-[12px] shadow-sm transition"
                >
                  Khám phá thực đơn
                </Link>
                <Link
                  href="/orders"
                  className="inline-flex items-center justify-center bg-white hover:bg-[#fff1f2] text-[#e31837] font-medium text-[16px] leading-[1.4] px-7 py-3.5 rounded-[12px] border border-[#e31837] transition"
                >
                  Tra cứu đơn hàng
                </Link>
              </div>
            </div>

            {/* Right Visual Fragment */}
            <div className="lg:col-span-5">
              <div className="bg-[#fff1f2] p-6 rounded-[12px] border border-[#fecdd3] relative">
                <div className="bg-white rounded-[10px] border border-[#dddddd] p-4 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-[#dddddd] pb-3">
                    <div>
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-[#e31837]">
                        Món ăn nổi bật
                      </span>
                      <h4 className="text-[16px] font-semibold text-[#181d26]">Cơm Tấm Sườn Bì Chả Đặc Biệt</h4>
                    </div>
                    <span className="text-[16px] font-bold text-[#e31837]">60.000 ₫</span>
                  </div>

                  <div className="aspect-square w-full rounded-[6px] overflow-hidden bg-[#f8fafc]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=700&q=80"
                      alt="Cơm tấm sườn"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[12px] text-[#41454d] flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span className="font-medium">4.9 (240+ đánh giá)</span>
                    </span>
                    <Link
                      href="/menu"
                      className="h-8 px-3 rounded-[6px] bg-[#e31837] hover:bg-[#be0e27] text-white text-[12px] font-medium inline-flex items-center gap-1 transition"
                    >
                      <span>Xem món ngay</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredProducts.slice(0, 4).map((product) => (
            <ProductCard key={product.id} product={product} badgeText="Nổi bật" />
          ))}
        </div>
      </section>

      {/* 5. RED & WHITE THEMATIC CARDS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="bg-white border border-[#dddddd] hover:border-[#e31837] rounded-[10px] p-6 flex flex-col justify-between h-64 transition-colors group">
            <div>
              <span className="text-[11px] font-bold text-[#e31837] uppercase tracking-wider">
                Món ăn chính
              </span>
              <h3 className="text-xl font-semibold text-[#181d26] mt-2 group-hover:text-[#e31837] transition-colors">
                Cơm tấm & Bún phở gia truyền
              </h3>
              <p className="text-[13px] text-[#41454d] mt-2 leading-relaxed">
                Hương vị truyền thống đậm đà, nước dùng hầm xương kỹ lưỡng mang lại trải nghiệm chuẩn vị.
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
                Đồ ăn nhanh
              </span>
              <h3 className="text-xl font-semibold text-[#181d26] mt-2 group-hover:text-[#e31837] transition-colors">
                Bánh mì & Đồ ăn vặt nóng giòn
              </h3>
              <p className="text-[13px] text-[#41454d] mt-2 leading-relaxed">
                Vỏ bánh giòn rụm, pa-tê nhà làm thơm béo cùng dưa leo và rau ngò tươi ngon.
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
                Giải khát & Tráng miệng
              </span>
              <h3 className="text-xl font-semibold text-[#181d26] mt-2 group-hover:text-[#e31837] transition-colors">
                Trà đào & Cà phê muối đặc sản
              </h3>
              <p className="text-[13px] text-[#41454d] mt-2 leading-relaxed">
                Thức uống pha chế tươi mỗi ngày, sử dụng trà lá tự nhiên và lớp kem muối béo ngậy.
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
