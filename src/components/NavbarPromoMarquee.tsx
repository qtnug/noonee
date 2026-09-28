'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { CiShoppingTag, CiCircleCheck } from 'react-icons/ci';

export default function NavbarPromoMarquee() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

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
        <span className="inline-flex items-center gap-0.5 bg-red-600/80 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider">
          <CiShoppingTag className="w-3 h-3" />
          VOUCHER 20%
        </span>
        <span className="text-zinc-300">
          Nhập mã{' '}
          <button
            type="button"
            onClick={(e) => handleCopy('VIETQR20', e)}
            className="text-amber-400 font-mono font-bold underline decoration-dotted hover:text-white transition cursor-pointer"
            title="Bấm để sao chép mã"
          >
            VIETQR20
          </button>{' '}
          giảm 20% cho đơn thanh toán VietQR đầu tiên!
        </span>
        {copiedCode === 'VIETQR20' && (
          <span className="inline-flex items-center gap-0.5 text-emerald-400 text-[10px] font-bold bg-white/10 px-1 py-0.5 rounded">
            <CiCircleCheck className="w-3 h-3 stroke-2" /> Đã chép
          </span>
        )}
      </div>

      <span className="text-zinc-600 text-[10px] select-none">✦</span>

      {/* 2. Đơn nhóm */}
      <Link
        href="/group"
        className="inline-flex items-center gap-1.5 hover:text-white transition group cursor-pointer"
      >
        <span className="inline-flex items-center gap-0.5 bg-amber-400 text-stone-900 text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
          👥 ĐƠN NHÓM -15%
        </span>
        <span className="text-zinc-300 font-normal">
          Đặt món theo nhóm: <strong className="text-amber-300 font-medium">Giảm thêm tới 15%</strong> tổng hoá đơn &amp; gom đơn tiết kiệm ship
        </span>
        <span className="inline-flex items-center text-amber-400 text-[10px] font-bold group-hover:translate-x-0.5 transition-transform">
          Tạo phòng ngay →
        </span>
      </Link>

      <span className="text-zinc-600 text-[10px] select-none">✦</span>

      {/* 3. Freeship 120k */}
      <Link
        href="/menu"
        className="inline-flex items-center gap-1.5 hover:text-white transition group cursor-pointer"
      >
        <span className="inline-flex items-center gap-0.5 bg-emerald-600/90 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
          🚚 FREESHIP 0Đ
        </span>
        <span className="text-zinc-300">
          Miễn phí vận chuyển cho <strong className="text-emerald-300 font-semibold">đơn từ 120.000đ</strong> &amp; đơn nhóm
        </span>
      </Link>

      <span className="text-zinc-600 text-[10px] select-none">✦</span>

      {/* 4. Voucher 10K */}
      <div className="inline-flex items-center gap-1.5">
        <span className="inline-flex items-center gap-0.5 bg-red-600/80 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider">
          <CiShoppingTag className="w-3 h-3" />
          GIẢM 10K
        </span>
        <span className="text-zinc-300">
          Nhập mã{' '}
          <button
            type="button"
            onClick={(e) => handleCopy('NOONEE10K', e)}
            className="text-amber-400 font-mono font-bold underline decoration-dotted hover:text-white transition cursor-pointer"
            title="Bấm để sao chép mã"
          >
            NOONEE10K
          </button>{' '}
          giảm 10.000đ cho đơn từ 60.000đ
        </span>
        {copiedCode === 'NOONEE10K' && (
          <span className="inline-flex items-center gap-0.5 text-emerald-400 text-[10px] font-bold bg-white/10 px-1 py-0.5 rounded">
            <CiCircleCheck className="w-3 h-3 stroke-2" /> Đã chép
          </span>
        )}
      </div>

      <span className="text-zinc-600 text-[10px] select-none">✦</span>

      {/* 5. Đơn nhóm share link */}
      <Link
        href="/group"
        className="inline-flex items-center gap-1.5 hover:text-white transition group cursor-pointer"
      >
        <span className="text-zinc-300">
          🍜 <strong className="text-amber-300 font-medium">Gom đơn đồng nghiệp:</strong> Mời bạn bè cùng chọn món &amp; thanh toán cực tiện
        </span>
        <span className="inline-flex items-center text-amber-400 text-[10px] font-bold group-hover:translate-x-0.5 transition-transform">
          Tham gia phòng →
        </span>
      </Link>
    </div>
  );

  return (
    <div
      className="w-full bg-[#18181b] text-zinc-300 overflow-hidden select-none border-b border-zinc-800 relative z-30 shadow-xs h-[28px] sm:h-[30px] flex items-center"
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
