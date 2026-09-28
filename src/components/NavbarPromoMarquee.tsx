'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { CiShoppingTag, CiCircleChevRight, CiCircleCheck } from 'react-icons/ci';

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
    <div className="flex items-center gap-8 sm:gap-12 shrink-0 pr-8 sm:pr-12">
      {/* 1. Voucher VietQR */}
      <div className="inline-flex items-center gap-2">
        <span className="inline-flex items-center gap-1 bg-white/20 text-white text-[11px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
          <CiShoppingTag className="w-3.5 h-3.5" />
          VOUCHER 20%
        </span>
        <span className="text-white/90">
          Nhập mã{' '}
          <button
            type="button"
            onClick={(e) => handleCopy('VIETQR20', e)}
            className="text-amber-200 font-mono font-bold underline decoration-dotted hover:text-white transition cursor-pointer"
            title="Bấm để sao chép mã"
          >
            VIETQR20
          </button>{' '}
          giảm ngay 20% cho đơn thanh toán VietQR đầu tiên!
        </span>
        {copiedCode === 'VIETQR20' && (
          <span className="inline-flex items-center gap-0.5 text-emerald-300 text-[11px] font-bold bg-black/30 px-1.5 py-0.5 rounded">
            <CiCircleCheck className="w-3 h-3 stroke-2" /> Đã chép
          </span>
        )}
      </div>

      <span className="text-white/40 select-none">✦</span>

      {/* 2. Đơn nhóm */}
      <Link
        href="/group"
        className="inline-flex items-center gap-2 hover:opacity-90 transition group cursor-pointer"
      >
        <span className="inline-flex items-center gap-1 bg-amber-400 text-red-950 text-[11px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
          👥 ĐƠN NHÓM -15%
        </span>
        <span className="text-white font-medium">
          Đặt món theo nhóm: <strong className="text-amber-200 underline decoration-white/40">Giảm thêm tới 15%</strong> tổng hoá đơn &amp; gom 1 đơn tiết kiệm phí ship
        </span>
        <span className="inline-flex items-center text-amber-200 text-[11px] font-bold group-hover:translate-x-0.5 transition-transform">
          Tạo phòng ngay →
        </span>
      </Link>

      <span className="text-white/40 select-none">✦</span>

      {/* 3. Voucher 10K */}
      <div className="inline-flex items-center gap-2">
        <span className="inline-flex items-center gap-1 bg-white/20 text-white text-[11px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
          <CiShoppingTag className="w-3.5 h-3.5" />
          GIẢM 10K
        </span>
        <span className="text-white/90">
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
          <span className="inline-flex items-center gap-0.5 text-emerald-300 text-[11px] font-bold bg-black/30 px-1.5 py-0.5 rounded">
            <CiCircleCheck className="w-3 h-3 stroke-2" /> Đã chép
          </span>
        )}
      </div>

      <span className="text-white/40 select-none">✦</span>

      {/* 4. Đơn nhóm share link */}
      <Link
        href="/group"
        className="inline-flex items-center gap-2 hover:opacity-90 transition group cursor-pointer"
      >
        <span className="text-white font-medium">
          🍜 <strong className="text-amber-200">Gom đơn đồng nghiệp:</strong> Chia sẻ link cho bạn bè cùng tự chọn món &amp; topping cực tiện
        </span>
        <span className="inline-flex items-center text-amber-200 text-[11px] font-bold group-hover:translate-x-0.5 transition-transform">
          Tham gia phòng →
        </span>
      </Link>

      <span className="text-white/40 select-none">✦</span>

      {/* 5. Freeship */}
      <Link
        href="/menu"
        className="inline-flex items-center gap-2 hover:opacity-90 transition group cursor-pointer"
      >
        <span className="inline-flex items-center gap-1 bg-emerald-500 text-white text-[11px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
          🚚 FREESHIP 0Đ
        </span>
        <span className="text-white/90">
          Miễn phí vận chuyển bán kính 3km cho đơn nhóm hoặc đơn từ 100K
        </span>
      </Link>
    </div>
  );

  return (
    <div
      className="w-full bg-gradient-to-r from-[#b91c1c] via-[#e31837] to-[#b91c1c] text-white overflow-hidden select-none border-t border-white/15 border-b border-red-900/40 relative z-30 shadow-xs"
      style={{ minHeight: '34px' }}
      title="Rê chuột để tạm dừng"
    >
      <div className="flex w-max animate-marquee hover:[animation-play-state:paused] py-1.5 text-[12px] sm:text-[13px] items-center cursor-default">
        {promoItems}
        {promoItems}
      </div>
    </div>
  );
}
