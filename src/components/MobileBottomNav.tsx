'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  CiHome,
  CiForkAndKnife,
  CiUser,
  CiShoppingBasket,
  CiReceipt,
} from 'react-icons/ci';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { totalItems, setIsCartOpen } = useCart();
  const { user } = useAuth();
  const [isCartBumping, setIsCartBumping] = useState(false);

  useEffect(() => {
    if (totalItems > 0) {
      setIsCartBumping(true);
      const timer = setTimeout(() => setIsCartBumping(false), 500);
      return () => clearTimeout(timer);
    }
  }, [totalItems]);

  // Hide on admin pages
  if (pathname.startsWith('/admin')) {
    return null;
  }

  const navItems = [
    {
      name: 'Trang chủ',
      href: '/',
      icon: CiHome,
      isActive: pathname === '/',
    },
    {
      name: 'Thực đơn',
      href: '/menu',
      icon: CiForkAndKnife,
      isActive: pathname.startsWith('/menu'),
    },
    {
      name: 'Đơn nhóm',
      href: '/group',
      icon: CiUser,
      badge: '-10%',
      isActive: pathname.startsWith('/group'),
    },
    {
      name: 'Đơn hàng',
      href: '/orders',
      icon: CiReceipt,
      isActive: pathname.startsWith('/orders'),
    },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#dddddd] shadow-[0_-4px_16px_rgba(0,0,0,0.06)] pb-safe">
      <div className="grid grid-cols-5 h-14 items-center px-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center h-full relative transition-colors ${
                item.isActive ? 'text-[#e31837]' : 'text-[#6b7280] hover:text-[#181d26]'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${item.isActive ? 'stroke-[2.5]' : 'stroke-[1.75]'}`} />
                {item.badge && (
                  <span className="absolute -top-1.5 -right-3 text-[9px] font-extrabold px-1 bg-[#e31837] text-white rounded-full leading-tight animate-pulse">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] mt-0.5 font-medium leading-none ${item.isActive ? 'font-bold' : ''}`}>
                {item.name}
              </span>
            </Link>
          );
        })}

        {/* 5th Tab: Cart Button with live count */}
        <button
          type="button"
          onClick={() => setIsCartOpen(true)}
          className={`flex flex-col items-center justify-center h-full relative transition-all cursor-pointer ${
            isCartBumping ? 'text-[#e31837] scale-110' : 'text-[#6b7280] hover:text-[#e31837]'
          }`}
        >
          <div className="relative">
            <CiShoppingBasket className="w-6 h-6 stroke-1" />
            {totalItems > 0 && (
              <span className={`absolute -top-1.5 -right-2.5 min-w-[16px] h-4 px-1 text-[9px] font-extrabold bg-[#e31837] text-white rounded-full flex items-center justify-center leading-none transition-transform ${isCartBumping ? 'scale-125' : ''}`}>
                {totalItems}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-0.5 font-medium leading-none">
            Giỏ hàng
          </span>
        </button>
      </div>
    </div>
  );
}
