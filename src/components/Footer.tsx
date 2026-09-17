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
    <footer className="bg-white text-[#333840] border-t border-[#dddddd]">
      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10">
          {/* Col 1: Brand & Description */}
          <div className="space-y-3">
            <Link href="/" className="inline-block">
              <span className="font-friem text-3xl tracking-wide text-[#181d26]">
                NooNee<span className="text-[#e31837]">.</span>
              </span>
            </Link>
            <p className="text-[14px] text-[#41454d] leading-relaxed">
              Ẩm thực tươi ngon chuẩn vị mỗi ngày, chế biến từ nguyên liệu tươi sạch và giao nhanh tận nơi, giữ trọn hương vị và độ nóng sốt đến tay thực khách.
            </p>
            <div className="text-[13px] text-[#9297a0] pt-1">
              Phục vụ bữa ăn ngon miệng, nhanh chóng và tận tâm mỗi ngày.
            </div>
          </div>

          {/* Col 2: Thực Đơn & Danh Mục */}
          <div>
            <h4 className="text-[#181d26] text-[14px] font-medium uppercase tracking-wider mb-4">
              Thực Đơn NooNee
            </h4>
            <ul className="space-y-2.5 text-[14px] text-[#41454d]">
              <li>
                <Link href="/menu" className="hover:text-[#181d26] transition">
                  Tất cả món ăn
                </Link>
              </li>
              <li>
                <Link href="/menu?categoryId=1" className="hover:text-[#181d26] transition">
                  Cơm & Món chính
                </Link>
              </li>
              <li>
                <Link href="/menu?categoryId=2" className="hover:text-[#181d26] transition">
                  Đồ ăn vặt
                </Link>
              </li>
              <li>
                <Link href="/menu?categoryId=3" className="hover:text-[#181d26] transition">
                  Đồ uống & Tráng miệng
                </Link>
              </li>
              <li>
                <Link href="/group" className="hover:text-[#181d26] transition flex items-center gap-1.5 font-medium">
                  <span className="text-[#e31837] font-bold text-[11px] bg-[#fff1f2] border border-[#fecdd3] px-1.5 py-0.2 rounded-full">
                    -10%
                  </span>
                  <span>Đặt đơn nhóm</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Hỗ Trợ & Khách Hàng */}
          <div>
            <h4 className="text-[#181d26] text-[14px] font-medium uppercase tracking-wider mb-4">
              Hỗ Trợ & Tài Khoản
            </h4>
            <ul className="space-y-2.5 text-[14px] text-[#41454d]">
              <li>
                <Link href="/orders" className="hover:text-[#181d26] transition">
                  Theo dõi trạng thái đơn hàng
                </Link>
              </li>
              <li>
                <Link href="/cart" className="hover:text-[#181d26] transition">
                  Giỏ hàng của bạn
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-[#181d26] transition">
                  Đăng nhập tài khoản
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Thông Tin Liên Hệ */}
          <div>
            <h4 className="text-[#181d26] text-[14px] font-medium uppercase tracking-wider mb-4">
              Liên Hệ & Cửa Hàng
            </h4>
            <ul className="space-y-2.5 text-[14px] text-[#41454d]">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[#181d26] shrink-0 mt-1" />
                <span>120 Yên Lãng, Đống Đa, Hà Nội</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#181d26] shrink-0" />
                <span>Hotline: <strong className="text-[#181d26] font-medium">0988.888.888</strong></span>
              </li>
              <li className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#181d26] shrink-0" />
                <span>Giờ phục vụ: 07:00 - 22:00</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Hairline Row */}
        <div className="border-t border-[#dddddd] mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between text-[13px] text-[#9297a0] gap-4">
          <p>© {new Date().getFullYear()} NooNee Food. Thiết kế theo phong cách giao diện Airtable.</p>
          <div className="flex items-center gap-2 text-[12px] text-[#9297a0]">
            <span>Giao hàng nhanh</span>
            <span>•</span>
            <span>Món ngon mỗi ngày</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
