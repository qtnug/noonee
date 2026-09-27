'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  CiCircleChevLeft,
  CiCircleChevRight,
  CiStar,
  CiForkAndKnife,
  CiCirclePlus,
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

const AUTO_PLAY_INTERVAL = 3500;

export default function BannerSlider({ bestSellers }: BannerSliderProps) {
  // Combine props with defaults to ensure exactly 8 items
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

  // Triple items for seamless infinite looping
  const count = baseItems.length;
  const extendedItems = React.useMemo(() => {
    return [...baseItems, ...baseItems, ...baseItems];
  }, [baseItems]);

  const [currentIndex, setCurrentIndex] = useState(count); // Start at middle segment
  const [isTransitioning, setIsTransitioning] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [itemsPerView, setItemsPerView] = useState(4);

  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // Responsive itemsPerView
  useEffect(() => {
    const updateView = () => {
      const w = window.innerWidth;
      if (w < 640) {
        setItemsPerView(1);
      } else if (w < 768) {
        setItemsPerView(2);
      } else if (w < 1024) {
        setItemsPerView(3);
      } else {
        setItemsPerView(4);
      }
    };
    updateView();
    window.addEventListener('resize', updateView);
    return () => window.removeEventListener('resize', updateView);
  }, []);

  // Handlers for Next and Prev
  const handleNext = useCallback(() => {
    setIsTransitioning(true);
    setCurrentIndex((prev) => prev + 1);
  }, []);

  const handlePrev = useCallback(() => {
    setIsTransitioning(true);
    setCurrentIndex((prev) => prev - 1);
  }, []);

  // Wrap-around boundary handling without visual stutter
  const handleTransitionEnd = () => {
    if (currentIndex >= count * 2) {
      setIsTransitioning(false);
      setCurrentIndex((prev) => prev - count);
    } else if (currentIndex < count) {
      setIsTransitioning(false);
      setCurrentIndex((prev) => prev + count);
    }
  };

  // Re-enable transition if it was silently disabled
  useEffect(() => {
    if (!isTransitioning) {
      const timer = setTimeout(() => {
        setIsTransitioning(true);
      }, 20);
      return () => clearTimeout(timer);
    }
  }, [isTransitioning]);

  // Auto-play timer (pauses when hovered or touched)
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      handleNext();
    }, AUTO_PLAY_INTERVAL);
    return () => clearInterval(timer);
  }, [isPaused, handleNext]);

  // Touch Swipe Handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsPaused(true);
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    setIsPaused(false);
    if (touchStartX.current !== null && touchEndX.current !== null) {
      const diff = touchStartX.current - touchEndX.current;
      if (diff > 40) {
        handleNext();
      } else if (diff < -40) {
        handlePrev();
      }
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  // Active item index (0..7) for dots
  const activeDotIndex = ((currentIndex % count) + count) % count;

  return (
    <section
      className="w-full bg-[#0a0a0d] relative overflow-hidden select-none border-y border-white/5 py-10 sm:py-12"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Ambient background glows */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 sm:mb-8 pb-4 border-b border-white/10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-950/80 border border-red-800/40 text-rose-300 text-[12px] font-bold mb-2 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-[#e31837] animate-pulse" />
              <span>MÓN ĂN BÁN CHẠY NHẤT</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Top Món Ngon Được Yêu Thích
            </h2>
            <p className="text-zinc-400 text-[13px] sm:text-[14px] font-medium mt-1 max-w-xl">
              8 món ngon nóng hổi được đặt nhiều nhất mỗi ngày tại NooNee Food.
            </p>
          </div>

          {/* Controls: Prev / Next buttons + View Menu link */}
          <div className="flex items-center gap-2.5 self-start sm:self-end">
            <button
              type="button"
              onClick={handlePrev}
              className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/15 active:bg-white/20 border border-white/10 text-white flex items-center justify-center transition shadow-xs cursor-pointer group"
              aria-label="Món trước đó"
              title="Món trước đó"
            >
              <CiCircleChevLeft className="w-6 h-6 group-hover:-translate-x-0.5 transition-transform" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/15 active:bg-white/20 border border-white/10 text-white flex items-center justify-center transition shadow-xs cursor-pointer group"
              aria-label="Món tiếp theo"
              title="Món tiếp theo"
            >
              <CiCircleChevRight className="w-6 h-6 group-hover:translate-x-0.5 transition-transform" />
            </button>
            <Link
              href="/menu"
              className="ml-2 hidden sm:inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#e31837] hover:bg-[#be0e27] text-white text-[13px] font-bold shadow-md shadow-red-900/30 transition group"
            >
              <span>Xem thực đơn</span>
              <CiCircleChevRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Carousel Track Viewport */}
        <div className="overflow-hidden relative w-full pt-1 pb-3">
          <div
            className="flex"
            onTransitionEnd={handleTransitionEnd}
            style={{
              transform: `translate3d(-${(currentIndex * 100) / itemsPerView}%, 0, 0)`,
              transition: isTransitioning
                ? 'transform 500ms cubic-bezier(0.25, 1, 0.5, 1)'
                : 'none',
            }}
          >
            {extendedItems.map((item, idx) => {
              const imgSrc = item.image || item.imageUrl || '';
              const targetUrl = item.slug ? `/product/${item.slug}` : `/menu`;
              const formattedPrice =
                typeof item.price === 'number'
                  ? item.price.toLocaleString('vi-VN') + 'đ'
                  : item.price;

              return (
                <div
                  key={`${item.id}-${idx}`}
                  className="shrink-0 px-2 sm:px-2.5"
                  style={{ width: `${100 / itemsPerView}%` }}
                >
                  <div className="bg-zinc-900/90 hover:bg-zinc-800/90 border border-zinc-800 hover:border-red-500/40 rounded-2xl p-3 sm:p-3.5 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5 shadow-[0_8px_24px_rgba(0,0,0,0.5)] group h-full">
                    {/* Image Box */}
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

                      {/* Hot Badge */}
                      <div className="absolute top-2.5 left-2.5 z-10">
                        <span className="bg-[#e31837] text-white text-[11px] font-extrabold px-2.5 py-0.5 rounded-md shadow-md flex items-center gap-1">
                          <span>🔥 Bán chạy</span>
                        </span>
                      </div>

                      {/* Rating Badge */}
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
                          <span className="text-[15px] sm:text-[16px] font-black text-[#e31837] block leading-tight">
                            {formattedPrice}
                          </span>
                        </div>

                        <Link
                          href={targetUrl}
                          className="px-3 py-1.5 rounded-lg bg-[#e31837] hover:bg-[#be0e27] active:bg-[#a50b20] text-white text-[12px] font-bold transition flex items-center gap-1 shadow-xs shrink-0"
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

        {/* Bottom Pagination Dots */}
        <div className="flex items-center justify-center gap-1.5 mt-5">
          {baseItems.map((_, dotIdx) => (
            <button
              key={dotIdx}
              type="button"
              onClick={() => {
                setIsTransitioning(true);
                // Snap to the closest corresponding index in the middle segment
                setCurrentIndex(count + dotIdx);
              }}
              className={`transition-all duration-300 cursor-pointer ${
                activeDotIndex === dotIdx
                  ? 'w-7 h-2 bg-[#e31837] rounded-full shadow-[0_0_8px_rgba(227,24,55,0.7)]'
                  : 'w-2 h-2 bg-white/25 hover:bg-white/60 rounded-full'
              }`}
              aria-label={`Xem món ${dotIdx + 1}`}
              title={`Món ${dotIdx + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
