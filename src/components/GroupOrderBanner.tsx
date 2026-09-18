'use client';

import React from 'react';
import Link from 'next/link';
import {
  Sparkles,
  ArrowRight,
  Share2,
  CheckCircle2,
  Percent,
  PlusCircle,
  LogIn,
  ShoppingBag,
} from 'lucide-react';

export default function GroupOrderBanner() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="relative overflow-hidden rounded-[20px] sm:rounded-[24px] border border-[#fecdd3] bg-gradient-to-br from-[#fff1f2] via-white to-[#fff8f8] p-6 sm:p-10 lg:p-12 shadow-sm">
        {/* Background decorative soft circles */}
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-red-100/60 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-orange-100/50 rounded-full blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center relative z-10">
          {/* Left Column: Headline, Highlights & Actions */}
          <div className="lg:col-span-7 space-y-4 sm:space-y-6">
            {/* Main Title */}
            <div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-[#0f172a] leading-tight">
                Đặt Món Theo Nhóm, <span className="text-[#e31837]">Gom Chung 1 Đơn</span>
              </h2>
              <p className="text-[14px] sm:text-[16px] text-[#475569] font-medium leading-relaxed mt-2.5 max-w-xl">
                Tạo nhóm và gửi link cho bạn bè, đồng nghiệp tự chọn món theo khẩu vị riêng. Hệ thống tự động gom vào 1 đơn, giao cùng lúc và tiết kiệm phí ship.
              </p>
            </div>

            {/* Feature Highlights Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="p-3 bg-white/90 backdrop-blur-xs rounded-[12px] border border-red-100 shadow-2xs">
                <div className="flex items-center gap-2 text-[#e31837] font-bold text-[13px]">
                  <Share2 className="w-4 h-4 shrink-0" />
                  <span>Gửi 1 link duy nhất</span>
                </div>
                <p className="text-[12px] text-[#475569] font-medium mt-1">
                  Mọi người tự vào chọn món trên máy riêng
                </p>
              </div>

              <div className="p-3 bg-white/90 backdrop-blur-xs rounded-[12px] border border-red-100 shadow-2xs">
                <div className="flex items-center gap-2 text-[#e31837] font-bold text-[13px]">
                  <ShoppingBag className="w-4 h-4 shrink-0" />
                  <span>Tự chọn khẩu vị</span>
                </div>
                <p className="text-[12px] text-[#475569] font-medium mt-1">
                  Thêm topping và ghi chú riêng từng người
                </p>
              </div>

              <div className="p-3 bg-white/90 backdrop-blur-xs rounded-[12px] border border-red-100 shadow-2xs">
                <div className="flex items-center gap-2 text-[#e31837] font-bold text-[13px]">
                  <Percent className="w-4 h-4 shrink-0" />
                  <span>Tiết kiệm tối đa</span>
                </div>
                <p className="text-[12px] text-[#475569] font-medium mt-1">
                  Giao cùng lúc, tiết kiệm phí vận chuyển
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Link
                href="/group"
                className="inline-flex items-center justify-center gap-2 bg-[#e31837] hover:bg-[#be0e27] active:bg-[#a50b20] text-white font-bold text-[15px] px-6 py-3 rounded-[8px] shadow-sm transition group"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Tạo phòng nhóm mới</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/group"
                className="inline-flex items-center justify-center gap-2 bg-white hover:bg-rose-50/70 text-[#0f172a] hover:text-[#e31837] font-bold text-[15px] px-6 py-3 rounded-[8px] border border-[#dddddd] hover:border-[#e31837] transition"
              >
                <LogIn className="w-4 h-4 text-[#e31837]" />
                <span>Tham gia bằng mã</span>
              </Link>
            </div>
          </div>

          {/* Right Column: Visual Mockup Showcase of Group Order */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-[18px] border border-red-200 p-5 sm:p-6 shadow-md relative space-y-4">
              {/* Room Card Header */}
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-[#fff1f2] text-[#e31837] flex items-center justify-center font-bold text-[14px]">
                    🍜
                  </div>
                  <div>
                    <h3 className="font-bold text-[#181d26] text-[14px] sm:text-[15px]">
                      Phòng Ăn Trưa Văn Phòng
                    </h3>
                    <div className="flex items-center gap-2 text-[11px] text-[#9297a0]">
                      <span>Mã: <strong className="font-mono text-[#e31837]">#NN-8823</strong></span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-emerald-600 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Đang chọn món
                      </span>
                    </div>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-red-50 text-[#e31837] font-bold text-[12px] rounded-lg border border-red-100">
                  5 người
                </span>
              </div>

              {/* Members Avatars preview */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center -space-x-2 overflow-hidden">
                  <div className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-blue-500 text-white font-bold text-[11px] flex items-center justify-center">
                    HQ
                  </div>
                  <div className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-emerald-500 text-white font-bold text-[11px] flex items-center justify-center">
                    ML
                  </div>
                  <div className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-purple-500 text-white font-bold text-[11px] flex items-center justify-center">
                    TT
                  </div>
                  <div className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-amber-500 text-white font-bold text-[11px] flex items-center justify-center">
                    PA
                  </div>
                  <div className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-[#e31837] text-white font-bold text-[11px] flex items-center justify-center">
                    +1
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[11px] text-gray-500 block">Đã chọn: <strong>7 món</strong></span>
                  <span className="text-[12px] font-bold text-emerald-600 flex items-center gap-1 justify-end">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Gộp chung 1 lượt giao
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
