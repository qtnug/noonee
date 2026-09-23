'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Tag, Sparkles, ArrowRight, Check } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function PromoBanner() {
  const { user } = useAuth();
  const [hasPaidFirstVietqr, setHasPaidFirstVietqr] = useState(false);
  const [copied, setCopied] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!user) {
      setHasPaidFirstVietqr(false);
      setChecking(false);
      return;
    }

    let isMounted = true;
    fetch(`/api/user/promo-status?userId=${user.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.success) {
          setHasPaidFirstVietqr(Boolean(data.hasPaidFirstVietqr));
        }
      })
      .catch((err) => {
        console.error('Error checking promo status:', err);
      })
      .finally(() => {
        if (isMounted) setChecking(false);
      });

    return () => {
      isMounted = false;
    };
  }, [user]);

  // Requirement: If user has completed & paid first order with VietQR, hide the banner completely!
  if (hasPaidFirstVietqr) {
    return null;
  }

  const handleCopyCode = () => {
    navigator.clipboard.writeText('VIETQR20');
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <section className="w-full bg-[#0f0f0f] relative overflow-hidden py-12 sm:py-16">
      {/* SVG noise texture overlay */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '128px 128px',
        }}
      />
      {/* Red glow top-right */}
      <div className="absolute -top-32 -right-32 w-[480px] h-[480px] bg-[#e31837]/10 rounded-full blur-3xl pointer-events-none" />
      {/* Warm amber glow bottom-left */}
      <div className="absolute -bottom-24 -left-24 w-[320px] h-[320px] bg-amber-600/8 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">

          {/* LEFT: Text Content */}
          <div className="flex-1 space-y-6">
            {/* Animated pill badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl animate-float">
              <span className="w-2 h-2 rounded-full bg-[#e31837] animate-pulse" />
              <span className="text-[12px] font-bold text-white/80 uppercase tracking-widest">
                Ưu đãi người dùng mới
              </span>
              <Tag className="w-3 h-3 text-amber-400" />
            </div>

            {/* Headline */}
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-[1.1] text-white">
              Thanh toán{' '}
              <span
                className="inline-block"
                style={{
                  background: 'linear-gradient(135deg, #e31837 0%, #ff6b35 50%, #f59e0b 100%)',
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
                  background: 'linear-gradient(90deg, #fbbf24 0%, #f59e0b 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                Giảm ngay 20%
              </span>{' '}
              đơn đầu tiên
            </h2>

            {/* Description */}
            <p className="text-[15px] text-white/60 leading-relaxed max-w-md font-medium">
              Nhập mã bên dưới hoặc áp dụng khi quét mã VietQR tại bước thanh toán để nhận ưu đãi ngay.
            </p>

            {/* Code box with shimmer + copy button */}
            <div className="flex flex-wrap items-center gap-3">
              <div
                className="relative flex items-center gap-3 bg-white/5 border border-white/10 backdrop-blur-xl rounded-[12px] px-4 py-3 overflow-hidden cursor-pointer group"
                onClick={handleCopyCode}
              >
                {/* Shimmer overlay */}
                <div
                  className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{
                    background:
                      'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.08) 50%, transparent 60%)',
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
          </div>

          {/* RIGHT: VietQR Phone Mockup Card */}
          <div className="flex-shrink-0 w-[260px] sm:w-[300px]">
            <div className="relative bg-white/5 border border-white/10 backdrop-blur-xl rounded-[24px] p-6 shadow-2xl shadow-black/50 overflow-hidden">
              {/* Scan-line animation overlay */}
              <div
                className="absolute inset-0 pointer-events-none opacity-20"
                style={{
                  background:
                    'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,0.03) 3px, rgba(255,255,255,0.03) 4px)',
                }}
              />
              {/* Ambient red glow inside card */}
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#e31837]/20 rounded-full blur-2xl pointer-events-none" />

              {/* VIETQR label */}
              <div className="flex items-center justify-between mb-4 relative z-10">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-[#e31837] flex items-center justify-center">
                    <span className="text-white text-[8px] font-black">VQ</span>
                  </div>
                  <span className="text-white font-black text-[13px] tracking-wider">VIETQR</span>
                </div>
                {/* 20% badge */}
                <div className="px-2.5 py-1 rounded-[8px] bg-amber-400 text-[#0f0f0f] text-[13px] font-black shadow-md shadow-amber-500/30">
                  −20%
                </div>
              </div>

              {/* QR Code SVG grid */}
              <div className="relative z-10 bg-white/8 border border-white/10 rounded-[16px] p-4 flex items-center justify-center">
                <svg width="160" height="160" viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Top-left finder pattern */}
                  <rect x="8" y="8" width="44" height="44" rx="6" fill="none" stroke="#e31837" strokeWidth="3.5" />
                  <rect x="18" y="18" width="24" height="24" rx="3" fill="#e31837" />
                  {/* Top-right finder pattern */}
                  <rect x="108" y="8" width="44" height="44" rx="6" fill="none" stroke="#e31837" strokeWidth="3.5" />
                  <rect x="118" y="18" width="24" height="24" rx="3" fill="#e31837" />
                  {/* Bottom-left finder pattern */}
                  <rect x="8" y="108" width="44" height="44" rx="6" fill="none" stroke="#e31837" strokeWidth="3.5" />
                  <rect x="18" y="118" width="24" height="24" rx="3" fill="#e31837" />
                  {/* Data modules grid (random dots pattern) */}
                  {[
                    [64, 8], [72, 8], [80, 8], [88, 8], [96, 8],
                    [64, 16], [80, 16], [96, 16],
                    [64, 24], [72, 24], [88, 24],
                    [64, 32], [80, 32], [88, 32], [96, 32],
                    [64, 40], [72, 40], [80, 40],
                    [8, 64], [24, 64], [40, 64], [64, 64], [72, 64], [88, 64], [104, 64], [120, 64], [136, 64],
                    [16, 72], [32, 72], [64, 72], [80, 72], [96, 72], [112, 72], [128, 72], [144, 72],
                    [8, 80], [24, 80], [48, 80], [64, 80], [88, 80], [104, 80], [120, 80], [136, 80],
                    [16, 88], [40, 88], [56, 88], [72, 88], [96, 88], [112, 88], [128, 88],
                    [8, 96], [32, 96], [64, 96], [80, 96], [104, 96], [120, 96], [144, 96],
                    [64, 108], [80, 108], [96, 108], [112, 108], [128, 108], [144, 108],
                    [64, 116], [72, 116], [88, 116], [104, 116], [136, 116],
                    [64, 124], [80, 124], [96, 124], [120, 124], [144, 124],
                    [64, 132], [72, 132], [88, 132], [104, 132], [128, 132],
                    [64, 140], [80, 140], [96, 140], [112, 140], [136, 140],
                  ].map(([x, y], i) => (
                    <rect key={i} x={x} y={y} width="6" height="6" rx="1" fill="rgba(255,255,255,0.7)" />
                  ))}
                </svg>
              </div>

              {/* Card footer */}
              <div className="mt-4 relative z-10 text-center space-y-1">
                <p className="text-white/40 text-[10px] font-medium uppercase tracking-widest">Quét mã để thanh toán</p>
                <p className="text-white/70 text-[12px] font-bold font-mono tracking-wider">VIETQR20</p>
              </div>
            </div>
          </div>

        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
      `}</style>
    </section>
  );
}
