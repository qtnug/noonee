'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import {
  X,
  Plus,
  Minus,
  ShoppingBag,
  Check,
  CheckSquare,
  Square,
  Sparkles,
  Zap,
} from 'lucide-react';
import { Product, ProductTopping } from '@/types';
import { formatVND } from '@/lib/utils';
import { useCart } from '@/context/CartContext';

export function getAvailableToppings(product: Product): ProductTopping[] {
  if (product.toppings && Array.isArray(product.toppings) && product.toppings.length > 0) {
    return product.toppings;
  }

  const catName = (product.categoryName || '').toLowerCase();
  const prodName = product.name.toLowerCase();

  // 1. Cơm & Bún Phở
  if (
    product.categoryId === 1 ||
    catName.includes('cơm') ||
    catName.includes('bún') ||
    catName.includes('phở') ||
    prodName.includes('cơm') ||
    prodName.includes('phở') ||
    prodName.includes('bún')
  ) {
    return [
      { id: 'top_egg', name: 'Trứng ốp la lòng đào', price: 10000 },
      { id: 'top_cha', name: 'Thêm chả lụa / Chả bì', price: 12000 },
      { id: 'top_meat', name: 'Thêm thịt / Nạm gầu / Sườn', price: 20000 },
      { id: 'top_quay', name: 'Quẩy giòn ăn kèm', price: 5000 },
    ];
  }

  // 2. Đồ ăn nhanh & Món nhẹ
  if (
    product.categoryId === 2 ||
    catName.includes('nhanh') ||
    catName.includes('nhẹ') ||
    prodName.includes('bánh mì') ||
    prodName.includes('nem') ||
    prodName.includes('gà')
  ) {
    return [
      { id: 'top_cheese', name: 'Thêm phô mai kéo sợi', price: 10000 },
      { id: 'top_pate', name: 'Thêm pate gan béo ngậy', price: 10000 },
      { id: 'top_sausage', name: 'Thêm xúc xích nướng', price: 12000 },
      { id: 'top_spicy_sauce', name: 'Sốt cay đặc biệt quán', price: 5000 },
    ];
  }

  // 3. Đồ uống & Tráng miệng
  if (
    product.categoryId === 3 ||
    catName.includes('uống') ||
    catName.includes('trà') ||
    catName.includes('cà phê') ||
    prodName.includes('trà') ||
    prodName.includes('cà phê')
  ) {
    return [
      { id: 'top_pearl', name: 'Trân châu đường đen', price: 8000 },
      { id: 'top_peach', name: 'Thạch đào giòn sần sật', price: 8000 },
      { id: 'top_cream', name: 'Kem muối béo ngậy', price: 10000 },
      { id: 'top_less_sugar', name: 'Ít ngọt (50% đường)', price: 0 },
      { id: 'top_less_ice', name: 'Ít đá (50% đá)', price: 0 },
    ];
  }

  // 4. Default / Món đặc biệt
  return [
    { id: 'top_large', name: 'Nâng cấp suất lớn (Thêm 30% món)', price: 15000 },
    { id: 'top_egg_gen', name: 'Trứng ốp la lòng đào', price: 10000 },
    { id: 'top_sauce_gen', name: 'Nước sốt đặc biệt ăn kèm', price: 5000 },
  ];
}

interface ProductOptionsModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
}

export default function ProductOptionsModal({
  product,
  isOpen,
  onClose,
}: ProductOptionsModalProps) {
  const router = useRouter();
  const { addToCart, setIsCartOpen } = useCart();
  const [mounted, setMounted] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [selectedToppings, setSelectedToppings] = useState<ProductTopping[]>([]);
  const [itemNote, setItemNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Available toppings for this product
  const availableToppings = getAvailableToppings(product);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset state whenever modal is opened
  useEffect(() => {
    if (isOpen) {
      setQuantity(1);
      setSelectedToppings([]);
      setItemNote('');
      setIsSubmitting(false);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!mounted || !isOpen) return null;

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
  const unitPrice = product.price + toppingsTotal;
  const totalPrice = unitPrice * quantity;

  const handleConfirmAdd = () => {
    setIsSubmitting(true);
    addToCart(product, quantity, selectedToppings, itemNote.trim());

    // Give visual feedback, then close modal and open cart drawer
    setTimeout(() => {
      setIsSubmitting(false);
      onClose();
      setIsCartOpen(true);
    }, 300);
  };

  const handleBuyNow = () => {
    setIsSubmitting(true);
    addToCart(product, quantity, selectedToppings, itemNote.trim());
    onClose();
    router.push('/checkout');
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs transition-opacity"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-lg rounded-[16px] border border-[#dddddd] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[#dddddd] bg-white sticky top-0 z-10">
          <div className="flex items-start justify-between gap-3">
            <div className="flex gap-3.5 items-center">
              {/* Product Thumbnail */}
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-[10px] overflow-hidden bg-[#fff1f2]/20 border border-[#dddddd] shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Product Basics */}
              <div className="space-y-1 min-w-0">
                <h3 className="text-[16px] sm:text-[18px] font-semibold text-[#181d26] leading-snug line-clamp-1">
                  {product.name}
                </h3>
                <div className="text-[15px] font-bold text-[#e31837]">
                  {formatVND(product.price)}
                </div>
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-[8px] text-[#9297a0] hover:text-[#181d26] hover:bg-[#f8fafc] border border-transparent hover:border-[#dddddd] transition"
              aria-label="Đóng"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {product.description && (
            <p className="text-[12px] text-[#41454d] line-clamp-2 mt-3 pt-2.5 border-t border-[#dddddd]/60">
              {product.description}
            </p>
          )}
        </div>

        {/* Modal Body: Options & Notes (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
          {/* 1. Toppings Selector */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-[13px] font-semibold text-[#181d26] flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#e31837]" />
                <span>Tùy chọn món thêm / Topping:</span>
              </h4>
              <span className="text-[11px] text-[#9297a0]">Tùy chọn không bắt buộc</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {availableToppings.map((top) => {
                const isSelected = selectedToppings.some((t) => t.id === top.id);
                return (
                  <button
                    key={top.id}
                    type="button"
                    onClick={() => toggleTopping(top)}
                    className={`flex items-center justify-between p-2.5 rounded-[8px] border text-left transition cursor-pointer text-[13px] ${
                      isSelected
                        ? 'bg-[#fff1f2]/30 border-[#e31837] text-[#181d26] shadow-2xs'
                        : 'bg-white border-[#dddddd] text-[#41454d] hover:border-[#fecdd3]'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 pr-1">
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-[#e31837] shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-gray-300 shrink-0" />
                      )}
                      <span className={`truncate ${isSelected ? 'font-semibold text-[#181d26]' : 'font-normal'}`}>
                        {top.name}
                      </span>
                    </div>
                    <span
                      className={`text-[12px] font-semibold shrink-0 ${
                        top.price > 0
                          ? isSelected
                            ? 'text-[#e31837]'
                            : 'text-[#41454d]'
                          : 'text-[#16a34a]'
                      }`}
                    >
                      {top.price > 0 ? `+${formatVND(top.price)}` : 'Miễn phí'}
                    </span>
                  </button>
                );
              })}
            </div>

            {selectedToppings.length > 0 && (
              <div className="flex items-center justify-between pt-2 text-[12px] text-[#41454d] bg-[#f8fafc] px-3 py-1.5 rounded-[6px] border border-[#dddddd]">
                <span>Đã chọn {selectedToppings.length} topping:</span>
                <span className="font-bold text-[#e31837]">
                  +{formatVND(toppingsTotal)} / phần
                </span>
              </div>
            )}
          </div>

          {/* 2. Item Culinary Note */}
          <div className="space-y-2 pt-3 border-t border-[#dddddd]">
            <label className="text-[13px] font-semibold text-[#181d26]">
              <span>Ghi chú:</span>
            </label>
            <input
              type="text"
              placeholder="Ví dụ: Ít cay, không hành lá, nước mắm riêng, nhiều mỡ hành..."
              value={itemNote}
              onChange={(e) => setItemNote(e.target.value)}
              maxLength={150}
              className="w-full h-10 px-3 bg-white border border-[#dddddd] rounded-[8px] text-[13px] text-[#181d26] placeholder-[#9297a0] focus:outline-none focus:border-[#e31837] focus:ring-1 focus:ring-[#e31837] transition"
            />
          </div>
        </div>

        {/* Modal Footer: Quantity Stepper & Action Buttons */}
        <div className="p-4 sm:p-5 border-t border-[#dddddd] bg-[#f8fafc] sticky bottom-0">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div>
              <span className="text-[11px] text-[#9297a0] block">Đơn giá một phần:</span>
              <span className="text-[14px] font-semibold text-[#181d26]">
                {formatVND(unitPrice)}
              </span>
            </div>

            {/* Quantity Stepper */}
            <div className="flex items-center border border-[#dddddd] rounded-[8px] bg-white h-10 px-1 shadow-xs">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="p-2 text-[#41454d] hover:text-[#e31837] transition cursor-pointer"
                aria-label="Giảm số lượng"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-8 text-center text-[15px] font-bold text-[#181d26]">
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
          </div>

          {/* Action Buttons: Thêm vào giỏ & Mua ngay */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleConfirmAdd}
              disabled={!product.isAvailable || isSubmitting}
              className={`flex-1 h-11 px-3 rounded-[10px] text-[13px] sm:text-[14px] font-semibold transition flex items-center justify-center gap-1.5 border border-[#dddddd] bg-white hover:bg-rose-50/60 text-[#181d26] hover:border-[#e31837] cursor-pointer disabled:opacity-50`}
            >
              {isSubmitting ? (
                <>
                  <Check className="w-4 h-4 text-[#006400]" />
                  <span>Đã thêm!</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4 text-[#e31837]" />
                  <span>Thêm vào giỏ</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleBuyNow}
              disabled={!product.isAvailable || isSubmitting}
              className={`flex-1 h-11 px-3 rounded-[10px] text-[13px] sm:text-[14px] font-semibold transition flex items-center justify-center gap-1.5 shadow-sm bg-[#e31837] hover:bg-[#be0e27] active:bg-[#a50b20] text-white cursor-pointer disabled:opacity-50`}
            >
              <Zap className="w-4 h-4" />
              <span>Mua ngay • {formatVND(totalPrice)}</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
