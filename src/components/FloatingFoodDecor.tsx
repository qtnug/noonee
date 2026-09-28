'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  CiCircleChevRight as ArrowRight,
  CiCircleChevLeft as ArrowLeft,
} from 'react-icons/ci';

interface SideFoodItem {
  id: string;
  name: string;
  price: string;
  image: string;
  slug: string;
  side: 'left' | 'right';
  topPercent: string;
  glowClass: string;
  auraBg: string;
  animationClass: string;
  badgeLabel?: string;
  sizeClasses: string;
}

const SIDE_FOOD_ITEMS: SideFoodItem[] = [
  // === LEFT SIDE DISHES (Dàn đều dọc bên trái trang web) ===
  {
    id: 'banh-xeo',
    name: 'Bánh xèo giòn rụm',
    price: '25.000đ',
    image: '/foods_nobg/banhxeo.png',
    slug: 'banh-xeo',
    side: 'left',
    topPercent: 'top-[8%]',
    glowClass: 'glow-gold',
    auraBg: 'bg-amber-400/30',
    animationClass: 'animate-float-sway',
    badgeLabel: 'Mới ra lò',
    sizeClasses: 'w-24 h-24 xl:w-28 xl:h-28 2xl:w-32 2xl:h-32',
  },
  {
    id: 'pho-mai-que',
    name: 'Phô mai que kéo sợi',
    price: '21.000đ',
    image: '/foods_nobg/phomaique.png',
    slug: 'pho-mai-que',
    side: 'left',
    topPercent: 'top-[42%]',
    glowClass: 'glow-gold',
    auraBg: 'bg-yellow-400/30',
    animationClass: 'animate-float-slow',
    badgeLabel: 'Ăn vặt hot',
    sizeClasses: 'w-22 h-22 xl:w-26 xl:h-26 2xl:w-28 2xl:h-28',
  },
  {
    id: 'ga-popcorn',
    name: 'Gà popcorn giòn cay',
    price: '28.000đ',
    image: '/foods_nobg/gapopcorn.png',
    slug: 'ga-popcorn',
    side: 'left',
    topPercent: 'top-[76%]',
    glowClass: 'glow-orange',
    auraBg: 'bg-orange-500/30',
    animationClass: 'animate-float-reverse',
    badgeLabel: 'Giòn rụm',
    sizeClasses: 'w-22 h-22 xl:w-26 xl:h-26 2xl:w-28 2xl:h-28',
  },

  // === RIGHT SIDE DISHES (Dàn đều dọc bên phải trang web) ===
  {
    id: 'tra-sua',
    name: 'Trà sữa tự chọn',
    price: '25.000đ',
    image: '/foods_nobg/trasua.png',
    slug: 'tra-sua-tu-chon-topping',
    side: 'right',
    topPercent: 'top-[16%]',
    glowClass: 'glow-orange',
    auraBg: 'bg-orange-400/30',
    animationClass: 'animate-float-slow',
    badgeLabel: 'Best-seller',
    sizeClasses: 'w-24 h-24 xl:w-28 xl:h-28 2xl:w-32 2xl:h-32',
  },
  {
    id: 'banh-trang-tron',
    name: 'Bánh tráng trộn sốt me',
    price: '20.000đ',
    image: '/foods_nobg/banhtrangtron.png',
    slug: 'banh-trang-tron',
    side: 'right',
    topPercent: 'top-[50%]',
    glowClass: 'glow-red',
    auraBg: 'bg-rose-500/30',
    animationClass: 'animate-float-reverse',
    badgeLabel: 'Đặc sản vỉa hè',
    sizeClasses: 'w-24 h-24 xl:w-28 xl:h-28 2xl:w-30 2xl:h-30',
  },
  {
    id: 'tra-thai-xanh',
    name: 'Trà thái xanh thanh mát',
    price: '20.000đ',
    image: '/foods_nobg/trathaixanh.png',
    slug: 'tra-thai-xanh',
    side: 'right',
    topPercent: 'top-[84%]',
    glowClass: 'glow-green',
    auraBg: 'bg-emerald-400/30',
    animationClass: 'animate-float-sway',
    badgeLabel: 'Giải nhiệt',
    sizeClasses: 'w-22 h-22 xl:w-26 xl:h-26 2xl:w-28 2xl:h-28',
  },
];

export default function FloatingFoodDecor() {
  return (
    /* Hidden on mobile/tablet, only shown on wide desktop screens (hidden xl:block) */
    <div className="hidden xl:block absolute inset-0 pointer-events-none z-20 overflow-hidden">
      {SIDE_FOOD_ITEMS.map((item) => {
        const isLeft = item.side === 'left';
        const horizontalPosition = isLeft
          ? 'left-3 2xl:left-8'
          : 'right-3 2xl:right-8';

        return (
          <div
            key={item.id}
            className={`absolute ${item.topPercent} ${horizontalPosition}`}
          >
            <div className={item.animationClass}>
              <Link
                href={`/product/${item.slug}`}
                aria-label={`Xem chi tiết món ${item.name}`}
                className="group pointer-events-auto relative block cursor-pointer transition-transform duration-300 hover:scale-115 active:scale-95 focus:outline-none"
              >
                {/* Aura Bloom Background on Hover */}
                <div
                  className={`absolute inset-0 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none scale-125 ${item.auraBg}`}
                />

                {/* Food Image with Contoured Glowing Drop Shadow */}
                <div className={`relative ${item.sizeClasses}`}>
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    sizes="(max-width: 1536px) 112px, 128px"
                    className={`object-contain select-none transition-all duration-300 ${item.glowClass}`}
                    draggable={false}
                  />
                </div>

                {/* Interactive Tooltip Pill on Hover */}
                <div
                  className={`absolute top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-30 whitespace-nowrap shadow-xl rounded-full bg-white/95 backdrop-blur-md border border-rose-200 px-3 py-1.5 flex items-center gap-2 ${
                    isLeft
                      ? 'left-full ml-3 group-hover:translate-x-1'
                      : 'right-full mr-3 group-hover:-translate-x-1'
                  }`}
                >
                  {isLeft ? (
                    <>
                      {item.badgeLabel && (
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-[#A30029] px-1.5 py-0.5 rounded-full border border-rose-200/60">
                          {item.badgeLabel}
                        </span>
                      )}
                      <span className="text-[12px] font-bold text-[#0f172a]">{item.name}</span>
                      <span className="text-[12px] font-extrabold text-[#A30029]">{item.price}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-[#A30029]" />
                    </>
                  ) : (
                    <>
                      <ArrowLeft className="w-3.5 h-3.5 text-[#A30029]" />
                      <span className="text-[12px] font-extrabold text-[#A30029]">{item.price}</span>
                      <span className="text-[12px] font-bold text-[#0f172a]">{item.name}</span>
                      {item.badgeLabel && (
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-[#A30029] px-1.5 py-0.5 rounded-full border border-rose-200/60">
                          {item.badgeLabel}
                        </span>
                      )}
                    </>
                  )}
                </div>
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}
