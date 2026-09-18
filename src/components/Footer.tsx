'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Phone, MapPin, Clock, ShieldCheck, Mail, ArrowRight } from 'lucide-react';

export default function Footer() {
  const pathname = usePathname();

  // Do not render footer in admin pages
  if (pathname.startsWith('/admin')) {
    return null;
  }
  return (
    <footer className="bg-white text-[#334155] border-t border-[#e2e8f0]">
      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 sm:gap-10">
          {/* Col 1: Brand & Description */}
          <div className="space-y-3">
            <Link href="/" className="inline-block">
              <span className="font-friem text-3xl tracking-wide text-[#0f172a]">
                NooNee<span className="text-[#e31837]">.</span>
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
                <Link href="/menu" className="hover:text-[#e31837] transition">
                  Tất cả món ăn
                </Link>
              </li>
              <li>
                <Link href="/menu?categoryId=1" className="hover:text-[#e31837] transition">
                  Cơm & Món chính
                </Link>
              </li>
              <li>
                <Link href="/menu?categoryId=2" className="hover:text-[#e31837] transition">
                  Đồ ăn vặt
                </Link>
              </li>
              <li>
                <Link href="/menu?categoryId=3" className="hover:text-[#e31837] transition">
                  Đồ uống & Tráng miệng
                </Link>
              </li>
              <li>
                <Link href="/group" className="hover:text-[#e31837] transition flex items-center gap-1.5 font-semibold">
                  <span className="text-[#e31837] font-bold text-[11px] bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded-full">
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
                <Link href="/orders" className="hover:text-[#e31837] transition">
                  Tra cứu đơn hàng
                </Link>
              </li>
              <li>
                <Link href="/cart" className="hover:text-[#e31837] transition">
                  Giỏ hàng
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-[#e31837] transition">
                  Đăng nhập tài khoản
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Thông Tin Liên Hệ */}
          <div>
            <h4 className="text-[#0f172a] text-[14px] font-bold uppercase tracking-wider mb-4">
              Liên Hệ & Cửa Hàng
            </h4>
            <ul className="space-y-2.5 text-[14px] text-[#475569] font-medium">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[#e31837] shrink-0 mt-0.5" />
                <span>120 Yên Lãng, Đống Đa, Hà Nội</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#e31837] shrink-0" />
                <span>Hotline: <strong className="text-[#0f172a] font-bold">0988.888.888</strong></span>
              </li>
              <li className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#e31837] shrink-0" />
                <span>Giờ phục vụ: 07:00 - 22:00</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Hairline Row */}
        <div className="border-t border-[#e2e8f0] mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between text-[13px] text-[#64748b] gap-4">
          <p>© {new Date().getFullYear()} NooNee Food. Giữ trọn hương vị chuẩn vị & nóng hổi.</p>
          <div className="flex items-center gap-2 text-[12px] text-[#64748b] font-medium">
            <span>Giao hàng 30 phút</span>
            <span>•</span>
            <span>Món ngon mỗi ngày</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
