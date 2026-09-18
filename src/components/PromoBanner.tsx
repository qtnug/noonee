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
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <div className="bg-gradient-to-r from-[#e31837] via-[#c7132e] to-[#990c21] text-white rounded-[16px] p-8 md:p-12 relative overflow-hidden shadow-md">
        {/* Background decorative accents */}
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute right-10 bottom-0 opacity-15 pointer-events-none hidden md:block">
          <Sparkles className="w-48 h-48 text-white" />
        </div>

        <div className="max-w-2xl space-y-4 relative z-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[6px] bg-white text-[#e31837] text-[12px] font-bold uppercase tracking-wider shadow-xs">
              <Tag className="w-3.5 h-3.5" />
              Ưu đãi người dùng mới
            </span>
            <span className="inline-block px-2.5 py-1 rounded-[6px] bg-white/20 text-white text-[12px] font-medium backdrop-blur-xs">
              Giảm 20% đơn đầu tiên
            </span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Giảm ngay 20% cho đơn hàng đầu tiên qua VietQR
          </h2>

          <p className="text-[14px] sm:text-[15px] text-white/90 leading-relaxed max-w-xl font-medium">
            Nhập mã bên dưới hoặc áp dụng khi quét mã VietQR tại bước thanh toán để nhận ưu đãi ngay.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <div className="flex items-center bg-white/15 border border-white/30 rounded-[10px] px-3.5 py-2 backdrop-blur-sm">
              <span className="text-[12px] text-white/80 mr-2">Mã ưu đãi:</span>
              <strong className="text-[15px] font-mono font-bold tracking-wider text-white select-all">
                VIETQR20
              </strong>
              <button
                type="button"
                onClick={handleCopyCode}
                className="ml-3 px-2 py-1 bg-white text-[#e31837] text-[11px] font-semibold rounded hover:bg-[#fff1f2] transition flex items-center gap-1"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3 text-[#006400]" />
                    <span>Đã sao chép</span>
                  </>
                ) : (
                  <span>Sao chép</span>
                )}
              </button>
            </div>

            <Link
              href="/menu"
              className="inline-flex items-center justify-center bg-white text-[#e31837] font-semibold text-[14px] px-6 py-2.5 rounded-[10px] hover:bg-[#fff1f2] transition shadow-xs gap-1.5"
            >
              <span>Đặt món ngay</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
