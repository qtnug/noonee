'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight, Sparkles } from 'lucide-react';

interface FoodDecorItem {
  id: string;
  name: string;
  price: string;
  image: string;
  slug: string;
  glowClass: string;
  auraBg: string;
  animationClass: string;
  positionClasses: string;
  sizeClasses: string;
  tooltipSide: 'top' | 'bottom';
  badgeLabel?: string;
  hideOnSmall?: boolean;
}

const FLOATING_ITEMS: FoodDecorItem[] = [
  {
    id: 'banh-xeo',
    name: 'Bánh xèo giòn rụm',
    price: '25.000đ',
    image: '/foods_nobg/banhxeo.png',
    slug: 'banh-xeo',
    glowClass: 'glow-gold',
    auraBg: 'bg-amber-400/30',
    animationClass: 'animate-float-sway',
    positionClasses: 'top-2 sm:top-4 left-2 xl:-left-6',
    sizeClasses: 'w-20 h-20 sm:w-26 sm:h-26 lg:w-28 lg:h-28 xl:w-32 xl:h-32',
    tooltipSide: 'bottom',
    badgeLabel: 'Mới ra lò',
    hideOnSmall: true,
  },
  {
    id: 'pho-mai-que',
    name: 'Phô mai que kéo sợi',
    price: '21.000đ',
    image: '/foods_nobg/phomaique.png',
    slug: 'pho-mai-que',
    glowClass: 'glow-gold',
    auraBg: 'bg-yellow-400/30',
    animationClass: 'animate-float-slow',
    positionClasses: 'top-2 lg:top-3 left-[46%] -translate-x-1/2',
    sizeClasses: 'w-18 h-18 sm:w-22 sm:h-22 lg:w-24 lg:h-24 xl:w-28 xl:h-28',
    tooltipSide: 'bottom',
    badgeLabel: 'Ăn vặt hot',
    hideOnSmall: true,
  },
  {
    id: 'tra-sua',
    name: 'Trà sữa tự chọn',
    price: '25.000đ',
    image: '/foods_nobg/trasua.png',
    slug: 'tra-sua-tu-chon-topping',
    glowClass: 'glow-orange',
    auraBg: 'bg-orange-400/30',
    animationClass: 'animate-float-slow',
    positionClasses: 'top-2 sm:top-3 right-2 xl:-right-6',
    sizeClasses: 'w-22 h-22 sm:w-26 sm:h-26 lg:w-28 lg:h-28 xl:w-32 xl:h-32',
    tooltipSide: 'bottom',
    badgeLabel: 'Best-seller',
  },
  {
    id: 'banh-trang-tron',
    name: 'Bánh tráng trộn sốt me',
    price: '20.000đ',
    image: '/foods_nobg/banhtrangtron.png',
    slug: 'banh-trang-tron',
    glowClass: 'glow-red',
    auraBg: 'bg-rose-500/30',
    animationClass: 'animate-float-reverse',
    positionClasses: 'top-[36%] lg:top-[38%] right-[44%] xl:right-[42%]',
    sizeClasses: 'w-20 h-20 sm:w-24 sm:h-24 lg:w-26 lg:h-26 xl:w-30 xl:h-30',
    tooltipSide: 'top',
    badgeLabel: 'Đặc sản vỉa hè',
    hideOnSmall: true,
  },
  {
    id: 'ga-popcorn',
    name: 'Gà popcorn giòn cay',
    price: '28.000đ',
    image: '/foods_nobg/gapopcorn.png',
    slug: 'ga-popcorn',
    glowClass: 'glow-orange',
    auraBg: 'bg-orange-500/30',
    animationClass: 'animate-float-reverse',
    positionClasses: 'bottom-2 sm:bottom-4 left-4 xl:left-8',
    sizeClasses: 'w-18 h-18 sm:w-22 sm:h-22 lg:w-24 lg:h-24 xl:w-28 xl:h-28',
    tooltipSide: 'top',
    badgeLabel: 'Giòn rụm',
    hideOnSmall: true,
  },
  {
    id: 'tra-thai-xanh',
    name: 'Trà thái xanh thanh mát',
    price: '20.000đ',
    image: '/foods_nobg/trathaixanh.png',
    slug: 'tra-thai-xanh',
    glowClass: 'glow-green',
    auraBg: 'bg-emerald-400/30',
    animationClass: 'animate-float-sway',
    positionClasses: 'bottom-3 sm:bottom-5 right-4 xl:right-10',
    sizeClasses: 'w-20 h-20 sm:w-24 sm:h-24 lg:w-26 lg:h-26 xl:w-30 xl:h-30',
    tooltipSide: 'top',
    badgeLabel: 'Giải nhiệt',
  },
];

export default function FloatingFoodDecor() {
  return (
    <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
      <div className="max-w-7xl mx-auto h-full w-full relative">
        {FLOATING_ITEMS.map((item) => {
          return (
            <div
              key={item.id}
              className={`absolute ${item.positionClasses} ${
                item.hideOnSmall ? 'hidden md:block' : 'block'
              }`}
            >
              <div className={item.animationClass}>
                <Link
                  href={`/product/${item.slug}`}
                  aria-label={`Xem món ${item.name}`}
                  className="group pointer-events-auto relative block cursor-pointer transition-transform duration-300 hover:scale-115 active:scale-95 focus:outline-none"
                >
                  {/* Aura Bloom Backdrop on Hover */}
                  <div
                    className={`absolute inset-0 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none scale-125 ${item.auraBg}`}
                  />

                  {/* Food Image with Contoured Glow on Hover */}
                  <div className={`relative ${item.sizeClasses}`}>
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="(max-width: 768px) 96px, (max-width: 1200px) 120px, 140px"
                      className={`object-contain select-none transition-all duration-300 ${item.glowClass}`}
                      draggable={false}
                    />
                  </div>

                  {/* Interactive Tooltip Pill */}
                  <div
                    className={`absolute left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-30 whitespace-nowrap shadow-xl rounded-full bg-white/95 backdrop-blur-md border border-rose-200 px-3 py-1.5 flex items-center gap-2 ${
                      item.tooltipSide === 'top'
                        ? 'bottom-full mb-2 group-hover:-translate-y-1'
                        : 'top-full mt-2 group-hover:translate-y-1'
                    }`}
                  >
                    {item.badgeLabel && (
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-[#e31837] px-1.5 py-0.5 rounded-full border border-rose-200/60">
                        {item.badgeLabel}
                      </span>
                    )}
                    <span className="text-[12px] font-bold text-[#0f172a]">{item.name}</span>
                    <span className="text-[12px] font-extrabold text-[#e31837]">{item.price}</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-[#e31837]" />
                  </div>
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Compact Mobile Snack Chips Bar
export function MobileFoodSnackStrip() {
  return (
    <div className="md:hidden mt-6 pt-4 border-t border-rose-100/70">
      <div className="flex items-center gap-1.5 mb-2.5 px-1">
        <Sparkles className="w-3.5 h-3.5 text-[#e31837] animate-pulse" />
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#9297a0]">
          Món ăn vặt & Đồ uống hot
        </span>
      </div>
      <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none no-scrollbar">
        {FLOATING_ITEMS.map((item) => (
          <Link
            key={item.id}
            href={`/product/${item.slug}`}
            className="group shrink-0 flex items-center gap-2 bg-white/90 backdrop-blur-xs border border-[#dddddd] hover:border-[#e31837] px-2.5 py-1.5 rounded-full shadow-xs hover:shadow-md transition active:scale-95"
          >
            <div className="relative w-7 h-7 shrink-0">
              <Image
                src={item.image}
                alt={item.name}
                fill
                sizes="28px"
                className={`object-contain ${item.glowClass}`}
              />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-[11px] font-bold text-[#0f172a] leading-tight">
                {item.name.split(' ')[0]} {item.name.split(' ')[1] || ''}
              </span>
              <span className="text-[10px] font-bold text-[#e31837] leading-tight">
                {item.price}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
