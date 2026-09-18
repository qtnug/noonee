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
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[#181d26] leading-tight">
                Cùng Nhau Chọn Món, <span className="text-[#e31837]">Tiết Kiệm Tối Đa</span>
              </h2>
              <p className="text-[14px] sm:text-[16px] text-[#41454d] leading-relaxed mt-2.5 max-w-xl">
                Không còn phải chuyền tay điện thoại hay ghi chép thủ công. Mỗi người tự mở link nhóm trên máy mình để chọn món yêu thích. Hệ thống tự động gộp đơn và giảm giá trực tiếp vào hóa đơn!
              </p>
            </div>

            {/* Feature Highlights Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="p-3 bg-white/80 backdrop-blur-xs rounded-[12px] border border-red-100 shadow-2xs">
                <div className="flex items-center gap-2 text-[#e31837] font-bold text-[13px]">
                  <Share2 className="w-4 h-4 shrink-0" />
                  <span>1 Link duy nhất</span>
                </div>
                <p className="text-[12px] text-[#555a64] mt-1">
                  Tạo phòng & gửi link nhóm cho bạn bè vào chọn món ngay
                </p>
              </div>

              <div className="p-3 bg-white/80 backdrop-blur-xs rounded-[12px] border border-red-100 shadow-2xs">
                <div className="flex items-center gap-2 text-[#e31837] font-bold text-[13px]">
                  <ShoppingBag className="w-4 h-4 shrink-0" />
                  <span>Tự chọn riêng</span>
                </div>
                <p className="text-[12px] text-[#555a64] mt-1">
                  Tùy biến món & ghi chú khẩu vị theo ý thích từng người
                </p>
              </div>

              <div className="p-3 bg-white/80 backdrop-blur-xs rounded-[12px] border border-red-100 shadow-2xs">
                <div className="flex items-center gap-2 text-[#e31837] font-bold text-[13px]">
                  <Percent className="w-4 h-4 shrink-0" />
                  <span>Giảm trực tiếp</span>
                </div>
                <p className="text-[12px] text-[#555a64] mt-1">
                  Tự động giảm 2% - 5% - 10% bill khi đủ người
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Link
                href="/group"
                className="inline-flex items-center justify-center gap-2 bg-[#e31837] hover:bg-[#be0e27] active:bg-[#a50b20] text-white font-medium text-[15px] px-6 py-3.5 rounded-[12px] shadow-sm transition group"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Tạo phòng nhóm mới</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/group"
                className="inline-flex items-center justify-center gap-2 bg-white hover:bg-[#fff1f2] text-[#181d26] hover:text-[#e31837] font-medium text-[15px] px-6 py-3.5 rounded-[12px] border border-[#dddddd] hover:border-[#fecdd3] transition"
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

              {/* Tier Progress Bar Visual */}
              <div className="space-y-2 bg-[#f8fafc] p-3.5 rounded-[12px] border border-[#e5e7eb]">
                <div className="flex items-center justify-between text-[12px]">
                  <span className="font-semibold text-[#181d26] flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-[#e31837]" /> Mức ưu đãi nhóm hiện tại:
                  </span>
                  <span className="font-bold text-[#e31837] text-[13px] bg-red-50 px-2 py-0.5 rounded border border-red-200">
                    -5% Bill
                  </span>
                </div>

                {/* 3 Step Tiers */}
                <div className="grid grid-cols-3 gap-1.5 pt-1 text-center">
                  <div className="bg-emerald-50 border border-emerald-200 p-1.5 rounded-[8px]">
                    <div className="text-[10px] text-emerald-700 font-semibold">3-4 người</div>
                    <div className="text-[12px] font-bold text-emerald-800">Giảm 2%</div>
                  </div>
                  <div className="bg-[#e31837] text-white p-1.5 rounded-[8px] shadow-xs relative">
                    <div className="text-[10px] text-white/90 font-semibold">5-9 người</div>
                    <div className="text-[12px] font-extrabold text-white">Giảm 5%</div>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 p-1.5 rounded-[8px]">
                    <div className="text-[10px] text-amber-700 font-semibold">10 người</div>
                    <div className="text-[12px] font-bold text-amber-800">Giảm 10%</div>
                  </div>
                </div>

                <div className="text-[11px] text-gray-500 text-center pt-0.5">
                  Thêm <strong className="text-[#181d26]">5 người nữa</strong> để đạt mức giảm kịch sàn <strong className="text-[#e31837]">10%</strong>
                </div>
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
                    <CheckCircle2 className="w-3.5 h-3.5" /> Tiết kiệm ngay ~25.000đ
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
