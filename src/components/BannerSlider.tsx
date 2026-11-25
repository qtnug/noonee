'use client';

import React from 'react';
import Link from 'next/link';
import {
  CiStar,
  CiForkAndKnife,
  CiCirclePlus,
  CiCircleChevRight,
} from 'react-icons/ci';

export interface ProductItem {
  id: number | string;
  name: string;
  price: number | string;
  slug?: string;
  image?: string;
  imageUrl?: string;
  categoryName?: string;
  rating?: number;
  soldCount?: number;
  description?: string;
}

interface BannerSliderProps {
  bestSellers?: ProductItem[];
}

export default function BannerSlider({ bestSellers }: BannerSliderProps) {
  // Chỉ lấy các món có dữ liệu mua thật (không chèn món giả định)
  const realItems: ProductItem[] = React.useMemo(() => {
    if (!bestSellers || bestSellers.length === 0) return [];
    return bestSellers.filter((item) => (item.soldCount ?? 0) > 0);
  }, [bestSellers]);

  // Lặp chính các món bán chạy thật đủ độ rộng màn hình để cuộn băng mượt liên tục (-50%)
  const conveyorItems = React.useMemo(() => {
    if (realItems.length === 0) return [];
    const half: ProductItem[] = [];
    while (half.length < 8) {
      half.push(...realItems);
    }
    return [...half, ...half];
  }, [realItems]);

  if (realItems.length === 0) {
    return null;
  }

  return (
    <section className="w-full bg-[#0a0a0d] relative overflow-hidden select-none border-y border-white/5 py-10 sm:py-12">
      {/* Ambient background glows */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-white/10">
          <div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Món Ăn Bán Chạy
            </h2>
            <p className="text-zinc-400 text-[13px] sm:text-[14px] font-medium mt-1 max-w-xl">
              Xếp hạng trực tiếp theo số lượt đặt mua thực tế cao nhất tại NooNee Food.
            </p>
          </div>

          <Link
            href="/best-seller"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-white text-[13px] font-bold transition group self-start sm:self-end"
          >
            <span>Xem bảng xếp hạng</span>
            <CiCircleChevRight className="w-4 h-4 text-white group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>

      {/* Conveyor Belt Marquee Ribbon */}
      <div className="relative w-full overflow-hidden">
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-r from-[#0a0a0d] to-transparent z-20" />
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-l from-[#0a0a0d] to-transparent z-20" />

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

                    {typeof item.soldCount === 'number' && item.soldCount > 0 && (
                      <div className="absolute top-2.5 left-2.5 z-10">
                        <span className="bg-[#A30029]/90 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-0.5 rounded-md shadow-xs">
                          Đã bán {item.soldCount}
                        </span>
                      </div>
                    )}

                    <div className="absolute top-2.5 right-2.5 z-10">
                      <span className="bg-black/60 backdrop-blur-md border border-white/10 text-white text-[11px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-xs">
                        <CiStar className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>{item.rating ? item.rating.toFixed(1) : '5.0'}</span>
                      </span>
                    </div>
                  </Link>

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
