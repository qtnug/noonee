'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Plus, Check, Star } from 'lucide-react';
import { Product } from '@/types';
import { formatVND } from '@/lib/utils';
import { useCart } from '@/context/CartContext';

export default function ProductCard({
  product,
  badgeText = 'Nổi bật',
}: {
  product: Product;
  badgeText?: string;
}) {
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  };

  return (
    <div className="bg-white rounded-[10px] border border-[#dddddd] hover:border-[#fecdd3] hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden relative">
      {/* Red Highlight Badge */}
      {product.isFeatured && (
        <div className="absolute top-3 left-3 z-10">
          <span className="bg-[#e31837] text-white text-[11px] font-bold px-2 py-0.5 rounded-[4px] shadow-xs">
            {badgeText}
          </span>
        </div>
      )}

      {/* Product Image Container */}
      <Link
        href={`/product/${product.slug}`}
        className="relative h-48 w-full overflow-hidden bg-[#fdf2f2]/30 border-b border-[#dddddd] flex items-center justify-center p-2 block group"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover rounded-[6px] group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
      </Link>

      {/* Product Information */}
      <div className="p-4 flex-1 flex flex-col justify-between bg-white">
        <div>
          {/* Category & Rating */}
          <div className="flex items-center justify-between text-[12px] text-[#9297a0] mb-1.5">
            <span className="uppercase tracking-wider font-semibold text-[11px] text-[#e31837]">
              {product.categoryName || 'Món ăn'}
            </span>
            <span className="flex items-center gap-1 text-[#333840] font-medium">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>{product.rating ? product.rating.toFixed(1) : '5.0'}</span>
            </span>
          </div>

          {/* Title */}
          <Link href={`/product/${product.slug}`}>
            <h3 className="font-semibold text-[#181d26] text-[15px] leading-snug line-clamp-1 mb-1.5 hover:text-[#e31837] transition-colors">
              {product.name}
            </h3>
          </Link>

          {/* Description */}
          <p className="text-[13px] text-[#41454d] line-clamp-2 leading-relaxed mb-4">
            {product.description}
          </p>
        </div>

        {/* Price & Action Button (Red Button) */}
        <div className="pt-3 border-t border-[#dddddd] flex items-center justify-between gap-2">
          <div>
            <span className="text-[16px] font-bold text-[#e31837] block leading-tight">
              {formatVND(product.price)}
            </span>
            <span className="text-[11px] text-[#9297a0] block mt-0.5">
              Giá cơ bản
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Link
              href={`/product/${product.slug}`}
              className="h-8 px-2.5 rounded-[6px] text-[11px] font-semibold text-[#e31837] bg-[#fff1f2] hover:bg-[#ffe4e6] border border-[#fecdd3] transition flex items-center"
            >
              Tùy chọn
            </Link>
            <button
              onClick={handleAdd}
              disabled={!product.isAvailable}
              className={`h-8 px-3 rounded-[6px] text-[12px] font-semibold transition flex items-center gap-1 ${
                !product.isAvailable
                  ? 'bg-[#f8fafc] text-[#9297a0] border border-[#dddddd] cursor-not-allowed'
                  : added
                  ? 'bg-[#006400] text-white'
                  : 'bg-[#e31837] hover:bg-[#be0e27] active:bg-[#a50b20] text-white shadow-xs'
              }`}
              title={product.isAvailable ? 'Thêm nhanh suất cơ bản' : 'Tạm hết hàng'}
            >
              {added ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Đã thêm</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
