'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CiPhone, CiMapPin, CiClock2 } from 'react-icons/ci';

export default function Footer() {
  const pathname = usePathname();

  // Do not render footer in admin pages
  if (pathname.startsWith('/admin')) {
    return null;
  }
  return (
    <footer className="bg-[#FFFAF0] text-[#334155] border-t border-[#ebdcd0]">
      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 sm:gap-10">
          {/* Col 1: Brand & Description */}
          <div className="space-y-3">
            <Link href="/" className="inline-block">
              <span className="font-friem text-3xl tracking-wide text-[#0f172a]">
                NooNee<span className="text-[#A30029]">.</span>
              </span>
            </Link>
            <p className="text-[14px] text-[#475569] font-medium leading-relaxed">
              Món ngon chuẩn vị, chế biến từ nguyên liệu sạch mỗi ngày. Giao nhanh 30 phút, luôn nóng hổi.
            </p>
          </div>

          {/* Col 2: Thực Đơn & Danh Mục */}
          <div>
            <h4 className="text-[#0f172a] text-[14px] font-bold uppercase tracking-wider mb-4">
              Thực Đơn NooNee
            </h4>
            <ul className="space-y-2.5 text-[14px] text-[#475569] font-medium">
              <li>
                <Link href="/menu" className="hover:text-[#A30029] transition">
                  Tất cả món ăn
                </Link>
              </li>
              <li>
                <Link href="/menu?categoryId=1" className="hover:text-[#A30029] transition">
                  Cơm
                </Link>
              </li>
              <li>
                <Link href="/menu?categoryId=4" className="hover:text-[#A30029] transition">
                  Bún mì
                </Link>
              </li>
              <li>
                <Link href="/menu?categoryId=5" className="hover:text-[#A30029] transition">
                  Phở
                </Link>
              </li>
              <li>
                <Link href="/menu?categoryId=2" className="hover:text-[#A30029] transition">
                  Đồ ăn vặt
                </Link>
              </li>
              <li>
                <Link href="/menu?categoryId=3" className="hover:text-[#A30029] transition">
                  Đồ uống & Tráng miệng
                </Link>
              </li>
              <li>
                <Link href="/group" className="hover:text-[#A30029] transition flex items-center gap-1.5 font-semibold">
                  <span className="text-[#A30029] font-bold text-[11px] bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded-full">
                    -10%
                  </span>
                  <span>Đặt đơn nhóm</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Hỗ Trợ & Khách Hàng */}
          <div>
            <h4 className="text-[#0f172a] text-[14px] font-bold uppercase tracking-wider mb-4">
              Hỗ Trợ & Tài Khoản
            </h4>
            <ul className="space-y-2.5 text-[14px] text-[#475569] font-medium">
              <li>
                <Link href="/contact" className="hover:text-[#A30029] transition">
                  Chăm sóc khách hàng & Khiếu nại
                </Link>
              </li>
              <li>
                <Link href="/orders" className="hover:text-[#A30029] transition">
                  Tra cứu lịch sử đơn hàng
                </Link>
              </li>
              <li>
                <Link href="/profile" className="hover:text-[#A30029] transition">
                  Hạng thành viên & Điểm thưởng
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-[#A30029] transition">
                  Chính sách bảo mật & Giao hàng
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Hệ thống cơ sở */}
          <div>
            <h4 className="text-[#0f172a] text-[14px] font-bold uppercase tracking-wider mb-4">
              Hệ thống 2 cơ sở
            </h4>
            <ul className="space-y-2.5 text-[13px] text-[#475569] font-medium">
              <li className="flex items-start gap-2">
                <CiMapPin className="w-5 h-5 text-[#A30029] shrink-0 stroke-1 mt-0.5" />
                <div>
                  <strong className="text-[#0f172a] block">CS1: 120 Yên Lãng</strong>
                  <span>Thịnh Quang, Đống Đa, Hà Nội</span>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <CiMapPin className="w-5 h-5 text-[#A30029] shrink-0 stroke-1 mt-0.5" />
                <div>
                  <strong className="text-[#0f172a] block">CS2: 269 Cầu Giấy</strong>
                  <span>Quan Hoa, Cầu Giấy, Hà Nội</span>
                </div>
              </li>
              <li className="flex items-center gap-2 pt-1">
                <CiPhone className="w-5 h-5 text-[#A30029] shrink-0 stroke-1" />
                <span>Hotline: <strong className="text-[#0f172a] font-bold">0943.190.609</strong></span>
              </li>
              <li className="flex items-center gap-2">
                <CiClock2 className="w-5 h-5 text-[#A30029] shrink-0 stroke-1" />
                <span>Giờ mở cửa: 08:00 - 22:30</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Hairline Row */}
        <div className="border-t border-[#ebdcd0] mt-10 pt-6 flex items-center justify-center text-[13px] text-[#64748b]">
          <p>© 2026 NooNee Food.</p>
        </div>
      </div>
    </footer>
  );
}
