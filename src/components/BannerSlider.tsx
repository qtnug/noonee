'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Check,
  Tag,
  PlusCircle,
  LogIn,
  Flame,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

/* ─────────────────────────────────────────────
   Types
───────────────────────────────────────────── */
interface BannerSliderProps {
  /** Best-seller products passed from server page */
  bestSellers?: {
    id: number | string;
    name: string;
    price: number | string;
    imageUrl?: string;
  }[];
}

/* ─────────────────────────────────────────────
   Slide 1 — VietQR Promo
───────────────────────────────────────────── */
function SlideVietQR() {
  const { user } = useAuth();
  const [hasPaid, setHasPaid] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user) return;
    let mounted = true;
    fetch(`/api/user/promo-status?userId=${user.id}`)
      .then((r) => r.json())
      .then((d) => {
        if (mounted && d.success) setHasPaid(Boolean(d.hasPaidFirstVietqr));
      })
      .catch(() => {});
    return () => { mounted = false; };
  }, [user]);

  const copy = () => {
    navigator.clipboard.writeText('VIETQR20');
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="relative w-full h-full flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-16 px-6 sm:px-10 lg:px-16 py-10 sm:py-14">
      {/* Glows */}
      <div className="absolute -top-28 -right-28 w-96 h-96 bg-[#e31837]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-amber-600/8 rounded-full blur-3xl pointer-events-none" />

      {/* LEFT */}
      <div className="flex-1 space-y-5 relative z-10 text-center lg:text-left">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl animate-float">
          <span className="w-2 h-2 rounded-full bg-[#e31837] animate-pulse" />
          <span className="text-[11px] font-bold text-white/80 uppercase tracking-widest">
            {hasPaid ? 'Đã sử dụng ưu đãi' : 'Ưu đãi người dùng mới'}
          </span>
          <Tag className="w-3 h-3 text-amber-400" />
        </div>

        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-[1.1] text-white">
          Thanh toán{' '}
          <span
            style={{
              background: 'linear-gradient(135deg,#e31837 0%,#ff6b35 50%,#f59e0b 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            VietQR
          </span>
          <br />
          <span
            style={{
              background: 'linear-gradient(90deg,#fbbf24 0%,#f59e0b 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Giảm ngay 20%
          </span>{' '}
          đơn đầu tiên
        </h2>

        <p className="text-[15px] text-white/60 leading-relaxed max-w-md mx-auto lg:mx-0 font-medium">
          Nhập mã bên dưới hoặc áp dụng khi quét mã VietQR tại bước thanh toán để nhận ưu đãi ngay.
        </p>

        {!hasPaid && (
          <div className="flex flex-wrap items-center gap-3 justify-center lg:justify-start">
            {/* Code box */}
            <div
              className="relative flex items-center gap-3 bg-white/5 border border-white/10 backdrop-blur-xl rounded-[12px] px-4 py-3 overflow-hidden cursor-pointer group"
              onClick={copy}
            >
              <div
                className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                  background: 'linear-gradient(105deg,transparent 40%,rgba(255,255,255,0.08) 50%,transparent 60%)',
                  backgroundSize: '200% 100%',
                  animation: 'shimmer 1.4s ease infinite',
                }}
              />
              <span className="text-[12px] text-white/50 font-medium">Mã ưu đãi:</span>
              <strong className="text-[16px] font-mono font-bold tracking-[0.2em] text-white select-all">
                VIETQR20
              </strong>
              <button
                type="button"
                className="relative z-10 ml-1 px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/15 text-white text-[11px] font-semibold rounded-[8px] transition-all flex items-center gap-1.5"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400">Đã sao chép</span>
                  </>
                ) : (
                  <span>Sao chép</span>
                )}
              </button>
            </div>

            <Link
              href="/menu"
              className="inline-flex items-center justify-center gap-2 bg-[#e31837] hover:bg-[#be0e27] text-white font-bold text-[14px] px-5 py-3 rounded-[12px] shadow-lg shadow-red-900/30 transition group"
            >
              <span>Đặt món ngay</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        )}
      </div>

      {/* RIGHT — QR Card */}
      <div className="flex-shrink-0 w-[220px] sm:w-[260px] relative z-10">
        <div className="relative bg-white/5 border border-white/10 backdrop-blur-xl rounded-[24px] p-5 shadow-2xl shadow-black/50 overflow-hidden">
          <div
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{
              background: 'repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(255,255,255,0.03) 3px,rgba(255,255,255,0.03) 4px)',
            }}
          />
          <div className="absolute -top-8 -right-8 w-28 h-28 bg-[#e31837]/20 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-[#e31837] flex items-center justify-center">
                <span className="text-white text-[8px] font-black">VQ</span>
              </div>
              <span className="text-white font-black text-[13px] tracking-wider">VIETQR</span>
            </div>
            <div className="px-2.5 py-1 rounded-[8px] bg-amber-400 text-[#0f0f0f] text-[13px] font-black shadow-md shadow-amber-500/30">
              −20%
            </div>
          </div>

          <div className="relative z-10 bg-white/8 border border-white/10 rounded-[14px] p-3 flex items-center justify-center">
            <svg width="140" height="140" viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="8" y="8" width="44" height="44" rx="6" fill="none" stroke="#e31837" strokeWidth="3.5" />
              <rect x="18" y="18" width="24" height="24" rx="3" fill="#e31837" />
              <rect x="108" y="8" width="44" height="44" rx="6" fill="none" stroke="#e31837" strokeWidth="3.5" />
              <rect x="118" y="18" width="24" height="24" rx="3" fill="#e31837" />
              <rect x="8" y="108" width="44" height="44" rx="6" fill="none" stroke="#e31837" strokeWidth="3.5" />
              <rect x="18" y="118" width="24" height="24" rx="3" fill="#e31837" />
              {[
                [64,8],[72,8],[80,8],[88,8],[96,8],
                [64,16],[80,16],[96,16],
                [64,24],[72,24],[88,24],
                [64,32],[80,32],[96,32],
                [8,64],[24,64],[40,64],[64,64],[72,64],[88,64],[104,64],[120,64],[136,64],
                [16,72],[32,72],[64,72],[80,72],[96,72],[112,72],[128,72],
                [8,80],[24,80],[48,80],[64,80],[88,80],[104,80],[136,80],
                [16,88],[40,88],[56,88],[72,88],[96,88],[112,88],
                [64,108],[80,108],[96,108],[112,108],[128,108],
                [64,116],[72,116],[88,116],[104,116],[136,116],
                [64,124],[80,124],[96,124],[120,124],[144,124],
                [64,132],[72,132],[88,132],[104,132],[128,132],
                [64,140],[80,140],[96,140],[112,140],[136,140],
              ].map(([x, y], i) => (
                <rect key={i} x={x} y={y} width="6" height="6" rx="1" fill="rgba(255,255,255,0.7)" />
              ))}
            </svg>
          </div>

          <div className="mt-3 relative z-10 text-center space-y-0.5">
            <p className="text-white/40 text-[10px] font-medium uppercase tracking-widest">Quét mã để thanh toán</p>
            <p className="text-white/70 text-[12px] font-bold font-mono tracking-wider">VIETQR20</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Slide 2 — Best Seller Discount
───────────────────────────────────────────── */
function SlideBestSeller({ products }: { products: BannerSliderProps['bestSellers'] }) {
  return (
    <div className="relative w-full h-full flex flex-col justify-center px-6 sm:px-10 lg:px-16 py-10 sm:py-14 gap-6">
      {/* Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-48 bg-amber-500/8 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex items-center gap-3 flex-wrap justify-center lg:justify-start">
        <Flame className="w-7 h-7 text-orange-400" />
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Bán Chạy Nhất
        </h2>
        <span className="px-3 py-1.5 rounded-[10px] bg-amber-400 text-[#0a0a0a] text-[13px] font-black shadow-md shadow-amber-500/20">
          −20% khi dùng VietQR
        </span>
      </div>

      <p className="text-white/50 text-[14px] font-medium text-center lg:text-left relative z-10">
        Những món được yêu thích nhất — áp dụng mã <strong className="text-amber-400 font-mono">VIETQR20</strong> để nhận ngay 20% off.
      </p>

      {/* Horizontal scroll strip */}
      <div
        className="flex gap-4 overflow-x-auto pb-2 relative z-10"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {(products ?? []).slice(0, 10).map((p) => (
          <Link
            key={p.id}
            href={`/product/${p.id}`}
            className="group flex-shrink-0 w-40 sm:w-44 bg-white/5 border border-white/10 hover:border-white/25 backdrop-blur-sm rounded-[16px] overflow-hidden transition-all hover:bg-white/8 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/30"
          >
            <div className="relative w-full h-28 bg-white/5 overflow-hidden">
              {p.imageUrl ? (
                <img
                  src={p.imageUrl}
                  alt={p.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl">🍜</div>
              )}
              <div className="absolute top-2 left-2 px-2 py-0.5 rounded-[6px] bg-[#e31837] text-white text-[10px] font-black">
                HOT 🔥
              </div>
            </div>
            <div className="p-3 space-y-1">
              <p className="text-[12px] font-bold text-white/90 leading-tight line-clamp-2">{p.name}</p>
              <p className="text-[13px] font-extrabold text-amber-400">
                {typeof p.price === 'number' ? p.price.toLocaleString('vi-VN') + 'đ' : p.price}
              </p>
            </div>
          </Link>
        ))}
        {(!products || products.length === 0) && (
          <p className="text-white/30 text-sm py-8">Đang tải sản phẩm...</p>
        )}
      </div>

      <div className="relative z-10 flex justify-center lg:justify-start">
        <Link
          href="/best-seller"
          className="inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-[#0a0a0a] font-bold text-[14px] px-5 py-2.5 rounded-[10px] transition group"
        >
          <span>Xem tất cả món hot</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Slide 3 — Group Order
───────────────────────────────────────────── */
const GROUP_STEPS = [
  { icon: '🏠', label: 'Tạo phòng nhóm' },
  { icon: '🔗', label: 'Gửi link cho bạn' },
  { icon: '🍜', label: 'Mọi người chọn món' },
  { icon: '📦', label: 'Gom 1 đơn duy nhất' },
  { icon: '🚀', label: 'Giao cùng lúc' },
];

function SlideGroupOrder() {
  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center px-6 sm:px-10 lg:px-16 py-10 sm:py-14 gap-6 text-center">
      {/* Glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 70% 60% at 50% 50%,rgba(227,24,55,0.13) 0%,transparent 70%)',
        }}
      />

      <div className="relative z-10 space-y-2">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
          Đặt Món Theo Nhóm,{' '}
          <span className="text-[#e31837]">Gom Chung 1 Đơn</span>
        </h2>
        <p className="text-white/50 text-[15px] font-medium max-w-xl mx-auto leading-relaxed">
          Tạo nhóm, gửi link cho bạn bè tự chọn món — hệ thống gom 1 đơn, giao cùng lúc, tiết kiệm phí ship.
        </p>
      </div>

      {/* Steps */}
      <div className="relative z-10 flex flex-wrap items-center justify-center gap-2 sm:gap-3 max-w-2xl">
        {GROUP_STEPS.map((step, i) => (
          <React.Fragment key={i}>
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 backdrop-blur-sm rounded-2xl px-4 py-3 hover:bg-white/10 transition-colors cursor-default">
              <span className="text-xl">{step.icon}</span>
              <span className="text-white/80 font-semibold text-[13px] whitespace-nowrap">{step.label}</span>
            </div>
            {i < GROUP_STEPS.length - 1 && (
              <ArrowRight className="w-4 h-4 text-[#e31837]/50 hidden sm:block flex-shrink-0" />
            )}
          </React.Fragment>
        ))}
      </div>

      <div className="relative z-10 flex flex-col sm:flex-row items-center gap-3">
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
  );
}

/* ─────────────────────────────────────────────
   Main Slider Shell
───────────────────────────────────────────── */
const SLIDE_LABELS = ['VietQR −20%', '🔥 Bán Chạy', '👥 Đặt Nhóm'];
const AUTO_PLAY_INTERVAL = 6000;

export default function BannerSlider({ bestSellers }: BannerSliderProps) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const total = 3;

  const next = useCallback(() => setCurrent((c) => (c + 1) % total), []);
  const prev = useCallback(() => setCurrent((c) => (c - 1 + total) % total), []);
  const goTo = (i: number) => setCurrent(i);

  // Auto-play
  useEffect(() => {
    if (paused) return;
    timerRef.current = setInterval(next, AUTO_PLAY_INTERVAL);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [paused, next]);

  const slides = [
    <SlideVietQR key="vietqr" />,
    <SlideBestSeller key="bestseller" products={bestSellers} />,
    <SlideGroupOrder key="group" />,
  ];

  return (
    <section
      className="w-full bg-[#0f0f0f] relative overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* SVG noise */}
      <div
        className="absolute inset-0 opacity-[0.035] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '128px 128px',
        }}
      />

      {/* Slide viewport */}
      <div className="relative overflow-hidden" style={{ minHeight: '360px' }}>
        <div
          className="flex transition-transform duration-500 ease-[cubic-bezier(0.77,0,0.175,1)]"
          style={{ transform: `translateX(-${current * 100}%)`, width: `${total * 100}%` }}
        >
          {slides.map((slide, i) => (
            <div key={i} className="w-full flex-shrink-0" style={{ width: `${100 / total}%` }}>
              {slide}
            </div>
          ))}
        </div>
      </div>

      {/* Controls bar */}
      <div className="relative z-20 flex items-center justify-between px-6 sm:px-10 lg:px-16 py-4 border-t border-white/5">
        {/* Dot indicators + labels */}
        <div className="flex items-center gap-2">
          {SLIDE_LABELS.map((label, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`group flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-300 text-[12px] font-semibold ${
                current === i
                  ? 'bg-white/10 border-white/20 text-white'
                  : 'bg-transparent border-white/0 text-white/30 hover:text-white/60 hover:border-white/10'
              }`}
            >
              {/* Active progress bar inside dot */}
              <span
                className={`relative w-2 h-2 rounded-full flex-shrink-0 transition-colors ${
                  current === i ? 'bg-[#e31837]' : 'bg-white/20'
                }`}
              >
                {current === i && (
                  <span className="absolute inset-0 rounded-full bg-[#e31837] animate-ping opacity-60" />
                )}
              </span>
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        {/* Progress bar */}
        <div className="hidden sm:flex flex-1 mx-6 h-0.5 bg-white/5 rounded-full overflow-hidden">
          <div
            key={current}
            className="h-full bg-[#e31837] rounded-full"
            style={{
              width: paused ? `${((current + 1) / total) * 100}%` : '0%',
              animation: paused ? 'none' : `progressBar ${AUTO_PLAY_INTERVAL}ms linear forwards`,
            }}
          />
        </div>

        {/* Arrow buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={prev}
            aria-label="Slide trước"
            className="w-9 h-9 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-white/60 hover:text-white transition-all flex items-center justify-center"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={next}
            aria-label="Slide tiếp theo"
            className="w-9 h-9 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-white/60 hover:text-white transition-all flex items-center justify-center"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        @keyframes progressBar {
          from { width: 0%; }
          to   { width: 100%; }
        }
      `}</style>
    </section>
  );
}
