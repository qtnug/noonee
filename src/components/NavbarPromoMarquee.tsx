'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CiShoppingTag, CiCircleCheck } from 'react-icons/ci';

export default function NavbarPromoMarquee() {
  const pathname = usePathname();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  if (pathname?.startsWith('/admin') || pathname?.startsWith('/dine-in')) {
    return null;
  }

  const handleCopy = (code: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const promoItems = (
    <div className="flex items-center gap-6 sm:gap-9 shrink-0 pr-6 sm:pr-9">
      {/* 1. Voucher VietQR */}
      <div className="inline-flex items-center gap-1.5">
        <span className="inline-flex items-center gap-0.5 bg-white/20 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider">
          <CiShoppingTag className="w-3 h-3" />
          VOUCHER 20%
        </span>
        <span className="text-white/95">
          Nhập mã{' '}
          <button
            type="button"
            onClick={(e) => handleCopy('VIETQR20', e)}
            className="text-amber-200 font-mono font-bold underline decoration-dotted hover:text-white transition cursor-pointer"
            title="Bấm để sao chép mã"
          >
            VIETQR20
          </button>{' '}
          giảm 20% cho đơn thanh toán VietQR đầu tiên!
        </span>
        {copiedCode === 'VIETQR20' && (
          <span className="inline-flex items-center gap-0.5 text-emerald-300 text-[10px] font-bold bg-black/30 px-1 py-0.5 rounded">
            <CiCircleCheck className="w-3 h-3 stroke-2" /> Đã chép
          </span>
        )}
      </div>

      <span className="text-white/40 text-[10px] select-none">✦</span>

      {/* 2. Đơn nhóm */}
      <Link
        href="/group"
        className="inline-flex items-center gap-1.5 hover:opacity-90 transition group cursor-pointer"
      >
        <span className="inline-flex items-center gap-0.5 bg-amber-400 text-red-950 text-[10px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
          👥 ĐƠN NHÓM -15%
        </span>
        <span className="text-white font-normal">
          Đặt món theo nhóm: <strong className="text-amber-200 font-medium">Giảm thêm tới 15%</strong> tổng hoá đơn &amp; gom đơn tiết kiệm ship
        </span>
        <span className="inline-flex items-center text-amber-200 text-[10px] font-bold group-hover:translate-x-0.5 transition-transform">
          Tạo phòng ngay →
        </span>
      </Link>

      <span className="text-white/40 text-[10px] select-none">✦</span>

      {/* 3. Freeship 120k */}
      <Link
        href="/menu"
        className="inline-flex items-center gap-1.5 hover:opacity-90 transition group cursor-pointer"
      >
        <span className="inline-flex items-center gap-0.5 bg-emerald-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
          🚚 FREESHIP 0Đ
        </span>
        <span className="text-white/95">
          Miễn phí vận chuyển cho <strong className="text-amber-200 font-semibold">đơn từ 120.000đ</strong> &amp; đơn nhóm
        </span>
      </Link>

      <span className="text-white/40 text-[10px] select-none">✦</span>

      {/* 4. Voucher 10K */}
      <div className="inline-flex items-center gap-1.5">
        <span className="inline-flex items-center gap-0.5 bg-white/20 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider">
          <CiShoppingTag className="w-3 h-3" />
          GIẢM 10K
        </span>
        <span className="text-white/95">
          Nhập mã{' '}
          <button
            type="button"
            onClick={(e) => handleCopy('NOONEE10K', e)}
            className="text-amber-200 font-mono font-bold underline decoration-dotted hover:text-white transition cursor-pointer"
            title="Bấm để sao chép mã"
          >
            NOONEE10K
          </button>{' '}
          giảm 10.000đ cho đơn từ 60.000đ
        </span>
        {copiedCode === 'NOONEE10K' && (
          <span className="inline-flex items-center gap-0.5 text-emerald-300 text-[10px] font-bold bg-black/30 px-1 py-0.5 rounded">
            <CiCircleCheck className="w-3 h-3 stroke-2" /> Đã chép
          </span>
        )}
      </div>

      <span className="text-white/40 text-[10px] select-none">✦</span>

      {/* 5. Đơn nhóm share link */}
      <Link
        href="/group"
        className="inline-flex items-center gap-1.5 hover:opacity-90 transition group cursor-pointer"
      >
        <span className="text-white">
          🍜 <strong className="text-amber-200 font-medium">Gom đơn đồng nghiệp:</strong> Mời bạn bè cùng chọn món &amp; thanh toán cực tiện
        </span>
        <span className="inline-flex items-center text-amber-200 text-[10px] font-bold group-hover:translate-x-0.5 transition-transform">
          Tham gia phòng →
        </span>
      </Link>
    </div>
  );

  return (
    <div
      className="w-full bg-gradient-to-r from-[#7a001e] via-[#A30029] to-[#7a001e] text-white overflow-hidden select-none border-b border-[#5c0017]/40 relative z-30 shadow-xs h-[28px] sm:h-[30px] flex items-center"
      title="Rê chuột để tạm dừng"
    >
      <div
        className="flex w-max animate-marquee hover:[animation-play-state:paused] text-[11px] sm:text-[12px] items-center cursor-default"
        style={{ animationDuration: '65s' }}
      >
        {promoItems}
        {promoItems}
      </div>
    </div>
  );
}
