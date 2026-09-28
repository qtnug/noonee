'use client';

import React from 'react';
import Link from 'next/link';
import {
  CiStar,
  CiForkAndKnife,
  CiCirclePlus,
  CiCircleChevRight,
} from 'react-icons/ci';

/* ─────────────────────────────────────────────
   Types
───────────────────────────────────────────── */
export interface ProductItem {
  id: number | string;
  name: string;
  price: number | string;
  slug?: string;
  image?: string;
  imageUrl?: string;
  categoryName?: string;
  rating?: number;
  description?: string;
}

interface BannerSliderProps {
  bestSellers?: ProductItem[];
}

/* ─────────────────────────────────────────────
   8 Curated Best-Seller Fallbacks
───────────────────────────────────────────── */
const DEFAULT_BEST_SELLERS: ProductItem[] = [
  {
    id: 1,
    name: 'Cơm Tấm Sườn Bì Chả Đặc Biệt',
    slug: 'com-tam-sai-gon',
    categoryName: 'Cơm Tấm',
    price: 38000,
    rating: 5.0,
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
    description: 'Sườn cốt lết nướng than hoa thơm lừng, bì dai giòn, chả trứng béo ngậy.',
  },
  {
    id: 2,
    name: 'Phở Bò Tái Nạm Bắp Hoa',
    slug: 'pho-bo',
    categoryName: 'Phở',
    price: 40000,
    rating: 5.0,
    image: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?auto=format&fit=crop&w=800&q=80',
    description: 'Nước dùng hầm xương bò 12 tiếng thơm quế hồi, nạm gầu ngọt mềm.',
  },
  {
    id: 3,
    name: 'Cơm Rang Dương Châu Xá Xíu',
    slug: 'com-rang-duong-chau',
    categoryName: 'Cơm Rang',
    price: 35000,
    rating: 5.0,
    image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=800&q=80',
    description: 'Cơm rang giòn tơi hạt vàng ruộm cùng xá xíu, lạp xưởng và trứng gà.',
  },
  {
    id: 4,
    name: 'Bún Bò Huế Đậm Đà Cố Đô',
    slug: 'bun-bo-hue',
    categoryName: 'Bún Mì',
    price: 42000,
    rating: 5.0,
    image: 'https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=800&q=80',
    description: 'Vị cay nồng sả ớt, bắp bò hoa giòn sần sật, chả cua Huế ngọt đậm đà.',
  },
  {
    id: 5,
    name: 'Gà Popcorn Giòn Rụm Lắc Phô Mai',
    slug: 'ga-popcorn-chien-gion',
    categoryName: 'Ăn Vặt',
    price: 35000,
    rating: 4.9,
    image: '/foods_nobg/gapopcorn_hero.png',
    description: 'Thịt gà phi lê tẩm ướp giòn tan bên ngoài, mọng nước bên trong.',
  },
  {
    id: 6,
    name: 'Bánh Tráng Trộn Sốt Me Đặc Biệt',
    slug: 'banh-trang-tron',
    categoryName: 'Ăn Vặt',
    price: 20000,
    rating: 5.0,
    image: 'https://images.unsplash.com/photo-1626804475297-41608ea09aeb?auto=format&fit=crop&w=800&q=80',
    description: 'Bánh tráng ngấm đẫm sốt me chua ngọt cay bùi, bò khô xé sợi và xoài xanh.',
  },
  {
    id: 7,
    name: 'Trà Sữa Trân Châu Đường Đen',
    slug: 'tra-sua-tu-chon-topping',
    categoryName: 'Đồ Uống',
    price: 25000,
    rating: 5.0,
    image: 'https://images.unsplash.com/photo-1558857563-b371033873b8?auto=format&fit=crop&w=800&q=80',
    description: 'Trà đen đậm đà, sữa tươi thanh béo cùng trân châu đen dẻo dai thơm lừng.',
  },
  {
    id: 8,
    name: 'Trà Đào Cam Sả Hạt Chia',
    slug: 'tra-dao',
    categoryName: 'Đồ Uống',
    price: 22000,
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80',
    description: 'Vị đào thanh mát, cam sả thơm dịu giải nhiệt tức thì ngày hè oi bức.',
  },
];

export default function BannerSlider({ bestSellers }: BannerSliderProps) {
  // Ensure exactly 8 items
  const baseItems: ProductItem[] = React.useMemo(() => {
    if (bestSellers && bestSellers.length >= 8) {
      return bestSellers.slice(0, 8);
    }
    if (bestSellers && bestSellers.length > 0) {
      const needed = 8 - bestSellers.length;
      return [...bestSellers, ...DEFAULT_BEST_SELLERS.slice(0, needed)];
    }
    return DEFAULT_BEST_SELLERS;
  }, [bestSellers]);

  // Duplicate items for continuous seamless conveyor belt marquee (cuộn băng chạy liên tục)
  const conveyorItems = React.useMemo(() => {
    return [...baseItems, ...baseItems];
  }, [baseItems]);

  return (
    <section className="w-full bg-[#0a0a0d] relative overflow-hidden select-none border-y border-white/5 py-10 sm:py-12">
      {/* Ambient background glows */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Container (Clean, no tags, no badges) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-white/10">
          <div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Món Ăn Bán Chạy
            </h2>
            <p className="text-zinc-400 text-[13px] sm:text-[14px] font-medium mt-1 max-w-xl">
              Những món ngon nóng hổi được yêu thích và đặt nhiều nhất mỗi ngày tại NooNee Food.
            </p>
          </div>

          <Link
            href="/menu"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-white text-[13px] font-bold transition group self-start sm:self-end"
          >
            <span>Xem tất cả thực đơn</span>
            <CiCircleChevRight className="w-4 h-4 text-white group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>

      {/* Conveyor Belt Marquee Ribbon (Cuộn băng chạy liên tục, tự động dừng khi hover) */}
      <div className="relative w-full overflow-hidden">
        {/* Soft edge fade masks */}
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-r from-[#0a0a0d] to-transparent z-20" />
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-l from-[#0a0a0d] to-transparent z-20" />

        {/* Continuous Marquee Track */}
        <div className="animate-food-conveyor py-2 px-4">
          {conveyorItems.map((item, idx) => {
            const imgSrc = item.image || item.imageUrl || '';
            const targetUrl = item.slug ? `/product/${item.slug}` : `/menu`;
            const formattedPrice =
              typeof item.price === 'number'
                ? item.price.toLocaleString('vi-VN') + 'đ'
                : item.price;

            return (
              <div
                key={`${item.id}-${idx}`}
                className="w-[270px] sm:w-[290px] shrink-0 mr-4 sm:mr-5"
              >
                <div className="bg-zinc-900/90 hover:bg-zinc-800/90 border border-zinc-800/80 hover:border-red-500/40 rounded-2xl p-3 sm:p-3.5 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5 shadow-[0_8px_24px_rgba(0,0,0,0.5)] group h-full">
                  {/* Image Container */}
                  <Link
                    href={targetUrl}
                    className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-zinc-800 mb-3 block"
                  >
                    {imgSrc ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={imgSrc}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-500">
                        <CiForkAndKnife className="w-10 h-10" />
                      </div>
                    )}

                    {/* Star Rating Badge only */}
                    <div className="absolute top-2.5 right-2.5 z-10">
                      <span className="bg-black/60 backdrop-blur-md border border-white/10 text-white text-[11px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-xs">
                        <CiStar className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>{item.rating ? item.rating.toFixed(1) : '5.0'}</span>
                      </span>
                    </div>
                  </Link>

                  {/* Information */}
                  <div className="space-y-1.5 flex-1 flex flex-col justify-between">
                    <div>
                      {item.categoryName && (
                        <p className="text-zinc-500 text-[11px] font-semibold uppercase tracking-wider">
                          {item.categoryName}
                        </p>
                      )}
                      <Link href={targetUrl}>
                        <h3 className="text-white font-bold text-[14px] sm:text-[15px] leading-snug line-clamp-1 group-hover:text-rose-300 transition-colors">
                          {item.name}
                        </h3>
                      </Link>
                      {item.description && (
                        <p className="text-zinc-400 text-[12px] line-clamp-1 font-normal leading-relaxed mt-0.5">
                          {item.description}
                        </p>
                      )}
                    </div>

                    {/* Price & Order CTA */}
                    <div className="pt-2.5 mt-2 border-t border-zinc-800/80 flex items-center justify-between gap-2">
                      <div>
                        <span className="text-[15px] sm:text-[16px] font-black text-[#A30029] block leading-tight">
                          {formattedPrice}
                        </span>
                      </div>

                      <Link
                        href={targetUrl}
                        className="px-3 py-1.5 rounded-lg bg-[#A30029] hover:bg-[#850021] active:bg-[#6e001b] text-white text-[12px] font-bold transition flex items-center gap-1 shadow-xs shrink-0"
                      >
                        <CiCirclePlus className="w-4 h-4 stroke-1" />
                        <span>Đặt món</span>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
