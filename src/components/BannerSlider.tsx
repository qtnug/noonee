'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Check,
  PlusCircle,
  LogIn,
  Flame,
  Utensils,
  Truck,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

/* ─────────────────────────────────────────────
   Types
───────────────────────────────────────────── */
interface ProductItem {
  id: number | string;
  name: string;
  price: number | string;
  slug?: string;
  image?: string;
  imageUrl?: string;
}

interface BannerSliderProps {
  bestSellers?: ProductItem[];
}

const DEFAULT_HOT_PRODUCTS: ProductItem[] = [
  {
    id: 1,
    name: 'Cơm Tấm Sườn Bì Chả Đặc Biệt',
    slug: 'com-tam-suon-bi-cha',
    price: 65000,
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500&auto=format&fit=crop&q=60',
  },
  {
    id: 2,
    name: 'Phở Bò Tái Nạm Bắp Hoa',
    slug: 'pho-bo-tai-nam',
    price: 60000,
    image: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=500&auto=format&fit=crop&q=60',
  },
  {
    id: 3,
    name: 'Bún Chả Hà Nội Đặc Biệt',
    slug: 'bun-cha-ha-noi',
    price: 55000,
    image: 'https://images.unsplash.com/photo-1559847844-5315695dadae?w=500&auto=format&fit=crop&q=60',
  },
  {
    id: 4,
    name: 'Trà Đào Cam Sả Hạt Chia',
    slug: 'tra-dao-cam-sa',
    price: 32000,
    image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500&auto=format&fit=crop&q=60',
  },
];

/* ─────────────────────────────────────────────
   Slide 0 — Hero: Thưởng thức món ngon
───────────────────────────────────────────── */
function SlideHero() {
  return (
    <div className="relative w-full h-full min-h-[420px] flex items-center justify-center px-4 sm:px-8 lg:px-12 py-10 sm:py-14">
      {/* Subtle ambient light */}
      <div className="absolute -top-24 -left-24 w-80 h-80 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -right-20 w-60 h-60 bg-amber-500/8 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto w-full flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-12 relative z-10">
        {/* Left: Headline & CTA */}
        <div className="flex-1 space-y-5 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.05] border border-white/[0.1] text-xs font-semibold text-zinc-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
            <span className="w-2 h-2 rounded-full bg-[#e31837] animate-pulse" />
            <span>NooNee Food • Tươi Ngon Mỗi Ngày</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-[1.15] text-white">
            Thưởng thức món ngon,{' '}
            <br className="hidden sm:inline" />
            <span className="text-[#e31837]">chuẩn vị</span> &amp; giao tận nơi
          </h2>

          <p className="text-[15px] sm:text-[16px] text-zinc-400 leading-relaxed max-w-lg mx-auto lg:mx-0 font-medium">
            Bún phở, cơm tấm và đồ uống thanh mát chế biến ngay khi đặt. Giao nhanh 30 phút, đảm bảo nóng hổi.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-3 justify-center lg:justify-start pt-1">
            <Link
              href="/menu"
              className="inline-flex items-center justify-center gap-2 bg-[#e31837] hover:bg-[#be0e27] active:bg-[#a50b20] text-white font-bold text-[15px] px-7 py-3.5 rounded-[12px] shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_4px_16px_rgba(227,24,55,0.35)] transition group"
            >
              <Utensils className="w-4 h-4" />
              <span>Khám phá thực đơn</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/orders"
              className="inline-flex items-center justify-center gap-2 bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.12] text-white font-bold text-[15px] px-7 py-3.5 rounded-[12px] shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] transition"
            >
              <span>Tra cứu đơn hàng</span>
            </Link>
          </div>
        </div>

        {/* Right: Tactile Trust cards (SkeuDesign style) */}
        <div className="flex-shrink-0 w-full max-w-sm lg:max-w-[280px] flex flex-col gap-3">
          {[
            { icon: <Truck className="w-5 h-5 text-[#e31837]" />, title: 'Giao nóng 30 phút', desc: 'Đóng gói giữ nhiệt cẩn thận' },
            { icon: <Utensils className="w-5 h-5 text-[#e31837]" />, title: 'Chế biến chuẩn vị', desc: 'Nguyên liệu tươi sạch trong ngày' },
            { icon: <Clock className="w-5 h-5 text-[#e31837]" />, title: 'Mở cửa 06:00 – 24:00', desc: 'Sẵn sàng phục vụ cả ngày lẫn đêm' },
          ].map(({ icon, title, desc }, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3.5 bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700/80 rounded-[14px] p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_4px_12px_rgba(0,0,0,0.3)] transition"
            >
              <div className="w-9 h-9 rounded-lg bg-red-950/60 border border-red-800/30 flex items-center justify-center shrink-0 mt-0.5">
                {icon}
              </div>
              <div>
                <p className="text-white text-[13px] font-bold">{title}</p>
                <p className="text-zinc-400 text-[11px] font-medium leading-tight mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Slide 1 — VietQR Promo Banner (No text gradient, solid colors, clean UI)
───────────────────────────────────────────── */
function SlideVietQR() {
  const [copied, setCopied] = useState(false);

  const copy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText('VIETQR20');
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="relative w-full h-full min-h-[420px] flex items-center justify-center px-4 sm:px-8 lg:px-12 py-10 sm:py-14">
      {/* Ambient glows */}
      <div className="absolute -top-28 -right-28 w-96 h-96 bg-red-600/12 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto w-full flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-16 relative z-10">
        {/* Left: Text & Coupon (Solid single-color text) */}
        <div className="flex-1 space-y-5 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.05] border border-white/[0.1] text-xs font-semibold text-zinc-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Thanh toán quét mã tiện lợi</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-[1.15] text-white">
            Thanh toán <span className="text-[#e31837]">VietQR</span>
            <br />
            <span className="text-amber-400">Giảm ngay 20%</span> đơn đầu tiên
          </h2>

          <p className="text-[15px] sm:text-[16px] text-zinc-400 leading-relaxed max-w-md mx-auto lg:mx-0 font-medium">
            Quét mã QR qua ứng dụng ngân hàng bất kỳ để thanh toán tức thì và nhận giảm giá 20% trực tiếp vào hoá đơn của bạn.
          </p>

          <div className="flex flex-wrap items-center gap-3 justify-center lg:justify-start pt-1">
            {/* Skeuomorphic tactile coupon box */}
            <div
              className="relative flex items-center gap-3 bg-zinc-900/90 border border-zinc-700/80 hover:border-zinc-600 rounded-[12px] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_4px_12px_rgba(0,0,0,0.4)] cursor-pointer group transition"
              onClick={copy}
              title="Bấm để sao chép mã"
            >
              <span className="text-[12px] text-zinc-400 font-medium">Mã ưu đãi:</span>
              <strong className="text-[16px] font-mono font-bold tracking-[0.2em] text-white select-all">
                VIETQR20
              </strong>
              <button
                type="button"
                className="ml-1 px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/15 text-white text-[12px] font-semibold rounded-[8px] transition flex items-center gap-1.5 shadow-xs"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Đã chép</span>
                  </>
                ) : (
                  <span>Sao chép</span>
                )}
              </button>
            </div>

            <Link
              href="/menu"
              className="inline-flex items-center justify-center gap-2 bg-[#e31837] hover:bg-[#be0e27] text-white font-bold text-[14px] px-6 py-3.5 rounded-[12px] shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_4px_16px_rgba(227,24,55,0.35)] transition group"
            >
              <span>Đặt món ngay</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Right: Tactile VietQR Card (Skeudesign / SmoothUI fintech pass style) */}
        <div className="flex-shrink-0 w-[240px] sm:w-[280px]">
          <div className="relative bg-zinc-900/90 border border-zinc-800 rounded-[24px] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_20px_40px_rgba(0,0,0,0.6)] overflow-hidden">
            <div className="absolute -top-8 -right-8 w-28 h-28 bg-[#e31837]/20 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between mb-4 relative z-10">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-[#e31837] flex items-center justify-center">
                  <span className="text-white text-[9px] font-black">VQ</span>
                </div>
                <span className="text-white font-bold text-[13px] tracking-wider">VIETQR</span>
              </div>
              <div className="px-2.5 py-1 rounded-[8px] bg-amber-400 text-zinc-950 text-[12px] font-black shadow-md shadow-amber-500/20">
                −20%
              </div>
            </div>

            {/* High-contrast QR Matrix */}
            <div className="relative z-10 bg-black/60 border border-white/10 rounded-[16px] p-3.5 flex items-center justify-center">
              <svg width="150" height="150" viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
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
                  <rect key={i} x={x} y={y} width="6" height="6" rx="1.5" fill="rgba(255,255,255,0.85)" />
                ))}
              </svg>
            </div>

            <div className="mt-3 relative z-10 text-center space-y-0.5">
              <p className="text-zinc-500 text-[10px] font-semibold uppercase tracking-widest">Quét thanh toán</p>
              <p className="text-zinc-300 text-[12px] font-bold font-mono tracking-wider">VIETQR20</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Slide 2 — Best Seller (Exact 4 items, No VietQR promo mention)
───────────────────────────────────────────── */
function SlideBestSeller({ products }: { products?: ProductItem[] }) {
  const displayProducts = (products && products.length > 0)
    ? products.slice(0, 4)
    : DEFAULT_HOT_PRODUCTS;

  return (
    <div className="relative w-full h-full min-h-[420px] flex items-center justify-center px-4 sm:px-8 lg:px-12 py-10 sm:py-14">
      {/* Subtle background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[550px] h-44 bg-amber-500/8 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto w-full space-y-6 relative z-10">
        {/* Header (Clean, no VietQR discount text) */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.05] border border-white/[0.1] text-xs font-semibold text-amber-400 mb-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>Được yêu thích nhất</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
              Món Bán Chạy Nhất
            </h2>
            <p className="text-zinc-400 text-[13px] sm:text-[14px] font-medium mt-1">
              Những món ăn được khách hàng lựa chọn nhiều nhất mỗi ngày tại NooNee Food.
            </p>
          </div>

          <Link
            href="/best-seller"
            className="inline-flex items-center gap-1.5 text-zinc-300 hover:text-white font-semibold text-[13px] sm:text-[14px] transition shrink-0 group self-start sm:self-end px-3.5 py-2 rounded-[10px] bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
          >
            <span>Xem tất cả thực đơn</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Exactly 4 Clean Tactile Product Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 pt-1">
          {displayProducts.map((p) => {
            const imgSrc = p.image || p.imageUrl || '';
            const targetUrl = p.slug ? `/product/${p.slug}` : `/menu`;
            return (
              <Link
                key={p.id}
                href={targetUrl}
                className="group bg-zinc-900/80 hover:bg-zinc-800/80 border border-zinc-800 hover:border-zinc-700/80 rounded-[18px] p-2.5 sm:p-3 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_8px_20px_rgba(0,0,0,0.4)]"
              >
                <div className="relative w-full aspect-[4/3] rounded-[12px] overflow-hidden bg-zinc-800 mb-2.5">
                  {imgSrc ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={imgSrc}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl">🍜</div>
                  )}
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded-[6px] bg-[#e31837] text-white text-[10px] font-bold shadow-sm tracking-wide">
                    HOT 🔥
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-[13px] sm:text-[14px] font-bold text-white leading-snug line-clamp-1 group-hover:text-rose-300 transition-colors">
                    {p.name}
                  </p>
                  <div className="flex items-center justify-between pt-0.5">
                    <span className="text-[13px] sm:text-[14px] font-extrabold text-[#e31837]">
                      {typeof p.price === 'number' ? p.price.toLocaleString('vi-VN') + 'đ' : p.price}
                    </span>
                    <span className="text-[11px] text-zinc-400 flex items-center gap-0.5 font-medium">
                      ⭐ 4.9
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Slide 3 — Group Order
───────────────────────────────────────────── */
const GROUP_STEPS = [
  { icon: '🏠', title: 'Tạo phòng nhóm', desc: 'Chọn món trước hoặc gửi link mời bạn bè' },
  { icon: '🔗', title: 'Gửi link cho bạn', desc: 'Chia sẻ qua Zalo, Messenger chỉ với 1 chạm' },
  { icon: '🍜', title: 'Tự chọn khẩu vị', desc: 'Mỗi người chọn món & topping riêng biệt' },
  { icon: '📦', title: 'Gom chung 1 đơn', desc: 'Hệ thống tự tổng hợp thanh toán rõ ràng' },
  { icon: '🚀', title: 'Giao cùng lúc', desc: 'Tiết kiệm tối đa phí ship cho cả nhóm' },
];

function SlideGroupOrder() {
  return (
    <div className="relative w-full h-full min-h-[420px] flex items-center justify-center px-4 sm:px-8 lg:px-12 py-10 sm:py-14 text-center">
      {/* Red glow backdrop */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(227,24,55,0.12) 0%, transparent 70%)',
        }}
      />

      <div className="max-w-7xl mx-auto w-full space-y-6 relative z-10">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.05] border border-white/[0.1] text-xs font-semibold text-zinc-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Tính năng đặt đơn nhóm thông minh</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Đặt Món Theo Nhóm,{' '}
            <span className="text-[#e31837]">Gom Chung 1 Đơn</span>
          </h2>
          <p className="text-zinc-400 text-[15px] sm:text-[16px] font-medium max-w-2xl mx-auto leading-relaxed">
            Tạo phòng nhóm, gửi link cho đồng nghiệp &amp; bạn bè tự chọn món — đơn gom lại giao cùng lúc, cực tiện và siêu tiết kiệm!
          </p>
        </div>

        {/* 5 Process Steps (Tactile cards) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 max-w-5xl mx-auto text-left">
          {GROUP_STEPS.map((step, i) => (
            <div
              key={i}
              className="bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700/80 rounded-[16px] p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_4px_12px_rgba(0,0,0,0.3)] transition flex flex-col justify-between"
            >
              <div>
                <span className="text-2xl block mb-1.5">{step.icon}</span>
                <p className="text-white text-[13px] font-bold leading-tight">{step.title}</p>
              </div>
              <p className="text-zinc-400 text-[11px] font-medium mt-1 leading-snug">{step.desc}</p>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1">
          <Link
            href="/group"
            className="inline-flex items-center justify-center gap-2 bg-[#e31837] hover:bg-[#be0e27] active:bg-[#a50b20] text-white font-bold text-[15px] px-7 py-3.5 rounded-[12px] shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_4px_16px_rgba(227,24,55,0.35)] transition group"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Tạo phòng mới</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="/group"
            className="inline-flex items-center justify-center gap-2 bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.12] text-white font-bold text-[15px] px-7 py-3.5 rounded-[12px] shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] transition"
          >
            <LogIn className="w-4 h-4 text-[#e31837]" />
            <span>Tham gia bằng mã phòng</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Main Banner Slider
───────────────────────────────────────────── */
const AUTO_PLAY_INTERVAL = 6000;
const TOTAL_SLIDES = 4;

export default function BannerSlider({ bestSellers }: BannerSliderProps) {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const next = useCallback(() => {
    setCurrent((c) => (c + 1) % TOTAL_SLIDES);
  }, []);

  const prev = useCallback(() => {
    setCurrent((c) => (c - 1 + TOTAL_SLIDES) % TOTAL_SLIDES);
  }, []);

  // Auto-play timer (pauses when user hovers or interacts)
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(next, AUTO_PLAY_INTERVAL);
    return () => clearInterval(timer);
  }, [isPaused, next]);

  // Touch Swipe Handlers for mobile interaction
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
      if (diff > 50) {
        next();
      } else if (diff < -50) {
        prev();
      }
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  const slides = [
    <SlideHero key="hero" />,
    <SlideVietQR key="vietqr" />,
    <SlideBestSeller key="bestseller" products={bestSellers} />,
    <SlideGroupOrder key="group" />,
  ];

  return (
    <section
      className="w-full bg-[#0a0a0c] relative overflow-hidden select-none border-y border-white/5"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Subtle noise texture */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none z-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '128px 128px',
        }}
      />

      {/* Viewport & 400% track */}
      <div className="relative z-10 w-full overflow-hidden">
        <div
          className="flex transition-transform duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]"
          style={{
            width: `${TOTAL_SLIDES * 100}%`,
            transform: `translate3d(-${(current * 100) / TOTAL_SLIDES}%, 0, 0)`,
          }}
        >
          {slides.map((slide, i) => (
            <div
              key={i}
              className="shrink-0 flex-shrink-0"
              style={{ width: `${100 / TOTAL_SLIDES}%` }}
            >
              {slide}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
