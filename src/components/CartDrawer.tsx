'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { X, Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { formatVND } from '@/lib/utils';

export default function CartDrawer() {
  const { cart, isCartOpen, setIsCartOpen, updateQuantity, removeFromCart, totalPrice, totalItems } = useCart();

  useEffect(() => {
    if (isCartOpen) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [isCartOpen]);

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#181d26]/40 transition-opacity"
        onClick={() => setIsCartOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
        <div className="w-screen max-w-md bg-white border-l border-[#dddddd] shadow-2xl flex flex-col">
          {/* Header */}
          <div className="h-14 sm:h-16 px-4 sm:px-6 border-b border-[#dddddd] flex items-center justify-between bg-white">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[#e31837]" />
              <h2 className="text-[15px] sm:text-[16px] font-semibold text-[#181d26]">
                Giỏ hàng <span className="text-[13px] font-normal text-[#9297a0]">({totalItems} món)</span>
              </h2>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-1.5 sm:p-2 text-[#41454d] hover:text-[#e31837] rounded-[6px] hover:bg-[#fff1f2] transition"
              aria-label="Đóng"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Items */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 divide-y divide-[#dddddd]">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-16">
                <div className="w-14 h-14 rounded-[12px] bg-[#fff1f2] border border-[#fecdd3] text-[#e31837] flex items-center justify-center mb-4">
                  <ShoppingBag className="w-7 h-7" />
                </div>
                <h3 className="text-[16px] font-medium text-[#181d26] mb-1">Giỏ hàng của bạn đang trống</h3>
                <p className="text-[13px] text-[#41454d] max-w-xs mb-6">
                  Khám phá thực đơn món ngon và thêm món ăn yêu thích vào giỏ.
                </p>
                <Link
                  href="/menu"
                  onClick={() => setIsCartOpen(false)}
                  className="px-6 py-2.5 bg-[#e31837] hover:bg-[#be0e27] text-white rounded-[6px] text-[14px] font-medium transition inline-block text-center"
                >
                  Xem thực đơn
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {cart.map((item) => (
                  <div key={item.cartItemId} className="pt-4 first:pt-0 flex gap-4 items-start border-b border-[#dddddd] pb-4 last:border-0 last:pb-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-16 h-16 rounded-[6px] object-cover bg-[#f8fafc] shrink-0 border border-[#dddddd]"
                    />
                    <div className="flex-1 min-w-0 space-y-1">
                      <h4 className="text-[14px] font-medium text-[#181d26] truncate">
                        {item.product.name}
                      </h4>

                      {/* Toppings Badges */}
                      {item.selectedToppings && item.selectedToppings.length > 0 && (
                        <div className="flex flex-wrap gap-1 text-[11px] text-[#41454d]">
                          {item.selectedToppings.map((t) => (
                            <span
                              key={t.id}
                              className="px-1.5 py-0.5 rounded bg-[#fff1f2] text-[#e31837] border border-[#fecdd3]"
                            >
                              +{t.name} ({formatVND(t.price)})
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Item Note */}
                      {item.note && (
                        <p className="text-[11px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 line-clamp-1 italic">
                          "{item.note}"
                        </p>
                      )}

                      <p className="text-[13px] font-bold text-[#e31837]">
                        {formatVND(item.itemPrice || item.product.price)}
                      </p>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2 pt-1">
                        <div className="flex items-center border border-[#dddddd] rounded-[6px] bg-white h-7 px-1">
                          <button
                            onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}
                            className="p-1 hover:text-[#e31837] text-[#41454d] transition cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2 text-[12px] font-semibold text-[#181d26]">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}
                            className="p-1 hover:text-[#e31837] text-[#41454d] transition cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.cartItemId)}
                          className="p-1 text-[#9297a0] hover:text-[#e31837] transition cursor-pointer"
                          title="Xóa món"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[14px] font-bold text-[#181d26]">
                        {formatVND((item.itemPrice || item.product.price) * item.quantity)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer Checkout */}
          {cart.length > 0 && (
            <div className="p-4 sm:p-6 border-t border-[#dddddd] bg-[#f8fafc] space-y-3 sm:space-y-4">
              <div className="space-y-1.5 text-[13px]">
                <div className="flex justify-between text-[#41454d]">
                  <span>Tạm tính</span>
                  <span className="font-medium text-[#181d26]">{formatVND(totalPrice)}</span>
                </div>
                <div className="flex justify-between text-[#41454d]">
                  <span>Phí giao hàng</span>
                  <span className="text-[#006400] font-medium">Miễn phí</span>
                </div>
                <div className="flex justify-between text-[16px] font-bold text-[#181d26] pt-2 border-t border-[#dddddd]">
                  <span>Tổng thanh toán</span>
                  <span className="text-[#e31837] text-lg">{formatVND(totalPrice)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <Link
                  href="/cart"
                  onClick={() => setIsCartOpen(false)}
                  className="h-11 flex items-center justify-center border border-[#e31837] bg-white text-[#e31837] text-[14px] font-semibold rounded-[6px] hover:bg-[#fff1f2] transition"
                >
                  Xem giỏ hàng
                </Link>
                <Link
                  href="/checkout"
                  onClick={() => setIsCartOpen(false)}
                  className="h-11 flex items-center justify-center bg-[#e31837] hover:bg-[#be0e27] text-white text-[14px] font-semibold rounded-[6px] shadow-xs transition"
                >
                  Thanh toán
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
