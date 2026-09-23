'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  PlusCircle,
  LogIn,
} from 'lucide-react';

const MARQUEE_STEPS = [
  { icon: '🏠', label: 'Tạo phòng nhóm' },
  { icon: '🔗', label: 'Gửi link cho bạn' },
  { icon: '🍜', label: 'Mọi người chọn món' },
  { icon: '📦', label: 'Gom 1 đơn duy nhất' },
  { icon: '🚀', label: 'Giao cùng lúc' },
];

// Duplicated for seamless infinite loop
const ALL_STEPS = [...MARQUEE_STEPS, ...MARQUEE_STEPS];

export default function GroupOrderBanner() {
  return (
    <section className="w-full bg-[#0a0a0a] relative overflow-hidden py-14 sm:py-20">
      {/* Red glow radial backdrop */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 70% 50% at 50% 50%, rgba(227,24,55,0.12) 0%, transparent 70%)',
        }}
      />
      {/* Subtle noise texture */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '128px 128px',
        }}
      />

      <div className="relative z-10">
        {/* TOP: Headline */}
        <div className="text-center px-4 mb-10">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Đặt Món Theo Nhóm,{' '}
            <span className="text-[#e31837]">Gom Chung 1 Đơn</span>
          </h2>
          <p className="mt-3 text-[15px] sm:text-[16px] text-white/50 font-medium max-w-xl mx-auto leading-relaxed">
            Tạo nhóm, gửi link cho bạn bè tự chọn món — hệ thống gom 1 đơn, giao cùng lúc, tiết kiệm phí ship.
          </p>
        </div>

        {/* MIDDLE: Infinite marquee */}
        <div className="relative overflow-hidden mb-10">
          {/* Left fade mask */}
          <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-32 z-10 pointer-events-none"
            style={{ background: 'linear-gradient(to right, #0a0a0a, transparent)' }} />
          {/* Right fade mask */}
          <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-32 z-10 pointer-events-none"
            style={{ background: 'linear-gradient(to left, #0a0a0a, transparent)' }} />

          <div className="flex animate-marquee gap-4 w-max py-2">
            {ALL_STEPS.map((step, i) => (
              <div
                key={i}
                className="flex items-center gap-3 bg-white/5 border border-white/10 backdrop-blur-sm rounded-2xl px-6 py-4 shrink-0"
              >
                <span className="text-2xl">{step.icon}</span>
                <span className="text-white/80 font-semibold text-[14px] whitespace-nowrap">{step.label}</span>
                {/* Arrow between steps (not after last in each set) */}
                {(i % MARQUEE_STEPS.length) < MARQUEE_STEPS.length - 1 && (
                  <ArrowRight className="w-4 h-4 text-[#e31837]/60 ml-1 shrink-0" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* BOTTOM: Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 px-4">
          <Link
            href="/group"
            className="inline-flex items-center justify-center gap-2 bg-[#e31837] hover:bg-[#be0e27] active:bg-[#a50b20] text-white font-bold text-[15px] px-7 py-3.5 rounded-[12px] shadow-lg shadow-red-900/30 transition group"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Tạo phòng mới</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="/group"
            className="inline-flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white font-bold text-[15px] px-7 py-3.5 rounded-[12px] backdrop-blur-sm transition"
          >
            <LogIn className="w-4 h-4 text-[#e31837]" />
            <span>Tham gia bằng mã</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
