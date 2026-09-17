'use client';

import React, { useState } from 'react';
import { Plus, Minus, ShoppingBag, Check, CheckSquare, Square, PenLine, Sparkles } from 'lucide-react';
import { Product, ProductTopping } from '@/types';
import { useCart } from '@/context/CartContext';
import { formatVND } from '@/lib/utils';
import { getAvailableToppings } from '@/components/ProductOptionsModal';

export default function ProductDetailActions({ product }: { product: Product }) {
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [selectedToppings, setSelectedToppings] = useState<ProductTopping[]>([]);
  const [itemNote, setItemNote] = useState('');
  const [added, setAdded] = useState(false);

  const toppings: ProductTopping[] = getAvailableToppings(product);

  const toggleTopping = (topping: ProductTopping) => {
    setSelectedToppings((prev) => {
      const exists = prev.some((t) => t.id === topping.id);
      if (exists) {
        return prev.filter((t) => t.id !== topping.id);
      } else {
        return [...prev, topping];
      }
    });
  };

  const toppingsTotal = selectedToppings.reduce((sum, t) => sum + (t.price || 0), 0);
  const itemUnitPrice = product.price + toppingsTotal;
  const totalPrice = itemUnitPrice * quantity;

  const handleAdd = () => {
    addToCart(product, quantity, selectedToppings, itemNote.trim());
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="space-y-6 pt-6 border-t border-[#dddddd]">
      {/* 1. TOPPINGS & OPTIONS SELECTOR */}
      {toppings.length > 0 && (
        <div className="space-y-3 bg-[#f8fafc] p-4 sm:p-5 rounded-[10px] border border-[#dddddd]">
          <div className="flex items-center justify-between">
            <h3 className="text-[14px] font-semibold text-[#181d26] flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#e31837]" />
              <span>Tùy chọn món thêm / Topping:</span>
            </h3>
            <span className="text-[11px] text-[#9297a0]">Chọn không giới hạn</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            {toppings.map((top) => {
              const isSelected = selectedToppings.some((t) => t.id === top.id);
              return (
                <button
                  key={top.id}
                  type="button"
                  onClick={() => toggleTopping(top)}
                  className={`flex items-center justify-between p-3 rounded-[8px] border text-left transition cursor-pointer text-[13px] ${
                    isSelected
                      ? 'bg-white border-[#e31837] text-[#181d26] shadow-xs'
                      : 'bg-white border-[#dddddd] text-[#41454d] hover:border-[#fecdd3]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4 text-[#e31837] shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-gray-300 shrink-0" />
                    )}
                    <span className={isSelected ? 'font-semibold text-[#181d26]' : 'font-normal'}>
                      {top.name}
                    </span>
                  </div>
                  <span className={`text-[12px] font-semibold shrink-0 ml-2 ${
                    top.price > 0 ? (isSelected ? 'text-[#e31837]' : 'text-[#41454d]') : 'text-[#16a34a]'
                  }`}>
                    {top.price > 0 ? `+${formatVND(top.price)}` : 'Miễn phí'}
                  </span>
                </button>
              );
            })}
          </div>

          {selectedToppings.length > 0 && (
            <div className="flex items-center justify-between pt-2 border-t border-[#dddddd] text-[12px]">
              <span className="text-[#41454d]">
                Đã chọn {selectedToppings.length} món thêm:
              </span>
              <span className="font-bold text-[#e31837]">
                +{formatVND(toppingsTotal)} / phần
              </span>
            </div>
          )}
        </div>
      )}

      {/* 2. ITEM CULINARY NOTE (Ghi chú riêng cho món này) */}
      <div className="space-y-1.5">
        <label className="text-[13px] font-semibold text-[#181d26] flex items-center gap-1.5">
          <PenLine className="w-3.5 h-3.5 text-[#e31837]" />
          <span>Ghi chú riêng cho món này (Bếp chế biến theo yêu cầu):</span>
        </label>
        <input
          type="text"
          placeholder="Ví dụ: Không lấy hành lá, ít cay, nhiều mỡ hành, sốt để riêng..."
          value={itemNote}
          onChange={(e) => setItemNote(e.target.value)}
          maxLength={200}
          className="w-full h-10 px-3.5 bg-white border border-[#dddddd] rounded-[6px] text-[13px] text-[#181d26] placeholder-[#9297a0] focus:outline-none focus:border-[#e31837]"
        />
      </div>

      {/* 3. QUANTITY & TOTAL PRICE BAR */}
      <div className="bg-[#fff1f2]/40 p-4 rounded-[10px] border border-[#fecdd3] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-[12px] text-[#41454d]">
            Đơn giá: <strong className="text-[#181d26] font-bold">{formatVND(itemUnitPrice)}</strong>
            {toppingsTotal > 0 && (
              <span className="text-[11px] text-[#9297a0] ml-1">
                (Gốc: {formatVND(product.price)} + Topping: {formatVND(toppingsTotal)})
              </span>
            )}
          </div>
          <div className="text-xl sm:text-2xl font-bold text-[#e31837]">
            Tổng: {formatVND(totalPrice)}
          </div>
        </div>

        <div className="flex items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
          {/* Quantity Stepper */}
          <div className="flex items-center border border-[#dddddd] rounded-[6px] bg-white h-11 px-1 shrink-0">
            <button
              type="button"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="p-2 text-[#41454d] hover:text-[#e31837] transition cursor-pointer"
              aria-label="Giảm số lượng"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-8 sm:w-9 text-center text-[14px] sm:text-[15px] font-bold text-[#181d26]">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity(quantity + 1)}
              className="p-2 text-[#41454d] hover:text-[#e31837] transition cursor-pointer"
              aria-label="Tăng số lượng"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Add to Cart Button */}
          <button
            type="button"
            onClick={handleAdd}
            disabled={!product.isAvailable}
            className={`h-11 px-4 sm:px-6 rounded-[8px] font-semibold text-[13px] sm:text-[14px] flex-1 sm:flex-initial flex items-center justify-center gap-1.5 sm:gap-2 transition cursor-pointer shadow-xs ${
              !product.isAvailable
                ? 'bg-[#f8fafc] text-[#9297a0] border border-[#dddddd] cursor-not-allowed'
                : added
                ? 'bg-[#006400] text-white'
                : 'bg-[#e31837] hover:bg-[#be0e27] active:bg-[#a50b20] text-white'
            }`}
          >
            {added ? (
              <>
                <Check className="w-4 h-4" />
                <span>Đã thêm vào giỏ!</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-4 h-4 shrink-0" />
                <span className="truncate">
                  {product.isAvailable ? `Thêm vào giỏ • ${formatVND(totalPrice)}` : 'Món tạm hết hàng'}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
