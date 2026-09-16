'use client';

import React from 'react';
import Link from 'next/link';
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight, ArrowLeft } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { formatVND } from '@/lib/utils';

export default function CartPage() {
  const { cart, updateQuantity, removeFromCart, clearCart, totalPrice, totalItems } = useCart();

  if (cart.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center space-y-4">
        <div className="w-16 h-16 bg-[#fff1f2] border border-[#fecdd3] text-[#e31837] rounded-[12px] flex items-center justify-center mx-auto">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-normal text-[#181d26]">Giỏ hàng của bạn đang trống</h1>
        <p className="text-[14px] text-[#41454d] max-w-sm mx-auto">
          Khám phá thực đơn NooNee và lựa chọn cho mình những món ăn ngon miệng nhé!
        </p>
        <div className="pt-3">
          <Link
            href="/menu"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#e31837] hover:bg-[#be0e27] text-white font-medium text-[14px] rounded-[12px] shadow-xs transition"
          >
            <span>Khám phá thực đơn</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-6 border-b border-[#dddddd]">
          <div>
            <h1 className="text-3xl font-normal text-[#181d26]">Giỏ hàng của bạn</h1>
            <p className="text-[14px] text-[#41454d] mt-1">
              Đang có <strong className="text-[#e31837]">{totalItems}</strong> món ăn sẵn sàng thanh toán
            </p>
          </div>
          <button
            onClick={clearCart}
            className="text-[13px] text-[#e31837] font-semibold hover:underline"
          >
            Xóa tất cả món
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Items List */}
          <div className="lg:col-span-8 bg-white rounded-[10px] p-6 border border-[#dddddd] space-y-4">
            <div className="divide-y divide-[#dddddd]">
              {cart.map((item) => (
                <div key={item.cartItemId} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-20 h-20 rounded-[6px] object-cover bg-[#f8fafc] border border-[#dddddd] shrink-0"
                    />
                    <div className="flex-1 min-w-0 space-y-1">
                      <h3 className="text-[15px] font-semibold text-[#181d26] truncate">
                        {item.product.name}
                      </h3>

                      {/* Selected Toppings */}
                      {item.selectedToppings && item.selectedToppings.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 text-[12px] text-[#41454d]">
                          {item.selectedToppings.map((t) => (
                            <span
                              key={t.id}
                              className="px-2 py-0.5 rounded bg-[#fff1f2] text-[#e31837] border border-[#fecdd3]"
                            >
                              +{t.name} ({formatVND(t.price)})
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Item Note */}
                      {item.note && (
                        <p className="text-[12px] text-amber-800 bg-amber-50 px-2.5 py-1 rounded border border-amber-200 inline-block italic">
                          Ghi chú món: "{item.note}"
                        </p>
                      )}

                      <p className="text-[14px] font-bold text-[#e31837]">
                        {formatVND(item.itemPrice || item.product.price)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#dddddd]">
                    {/* Quantity controls */}
                    <div className="flex items-center border border-[#dddddd] rounded-[6px] bg-white h-8 px-1">
                      <button
                        onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}
                        className="p-1 hover:text-[#e31837] text-[#41454d] transition cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-8 text-center text-[13px] font-semibold text-[#181d26]">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}
                        className="p-1 hover:text-[#e31837] text-[#41454d] transition cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      onClick={() => removeFromCart(item.cartItemId)}
                      className="p-1.5 text-[#9297a0] hover:text-[#e31837] rounded transition cursor-pointer"
                      title="Xóa món khỏi giỏ"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <div className="w-28 text-right">
                      <span className="text-[15px] font-bold text-[#181d26]">
                        {formatVND((item.itemPrice || item.product.price) * item.quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-[#dddddd]">
              <Link
                href="/menu"
                className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#e31837] hover:underline"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Tiếp tục chọn thêm món khác</span>
              </Link>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-4 bg-[#fdf2f2]/40 rounded-[10px] p-6 border border-[#fecdd3] space-y-5">
            <h2 className="text-[16px] font-semibold text-[#181d26] pb-3 border-b border-[#fecdd3]">
              Tóm tắt đơn hàng
            </h2>

            <div className="space-y-2.5 text-[13px]">
              <div className="flex justify-between text-[#41454d]">
                <span>Tạm tính ({totalItems} món)</span>
                <span className="font-semibold text-[#181d26]">{formatVND(totalPrice)}</span>
              </div>
              <div className="flex justify-between text-[#41454d]">
                <span>Phí vận chuyển</span>
                <span className="text-[#006400] font-semibold">Miễn phí</span>
              </div>
              <div className="flex justify-between text-[16px] font-bold text-[#181d26] pt-3 border-t border-[#fecdd3]">
                <span>Tổng thanh toán</span>
                <span className="text-[#e31837] text-lg">{formatVND(totalPrice)}</span>
              </div>
            </div>

            <Link
              href="/checkout"
              className="w-full h-12 bg-[#e31837] hover:bg-[#be0e27] active:bg-[#a50b20] text-white font-semibold text-[14px] rounded-[12px] flex items-center justify-center gap-2 transition shadow-xs"
            >
              <span>Tiến hành đặt hàng</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
