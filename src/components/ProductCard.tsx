'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { CiStar, CiHeart, CiCirclePlus } from 'react-icons/ci';
import { Product } from '@/types';
import { formatVND } from '@/lib/utils';
import { useFavorites } from '@/context/FavoritesContext';
import ProductOptionsModal from './ProductOptionsModal';

export default function ProductCard({
  product,
  badgeText = 'Nổi bật',
}: {
  product: Product;
  badgeText?: string;
}) {
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [heartPop, setHeartPop] = useState(false);
  const { isFavorite, toggleFavorite } = useFavorites();
  const favorited = isFavorite(product.id);

  return (
    <div className="bg-white rounded-[14px] border border-[#e6dcd2] hover:border-[#fda4af] hover:-translate-y-1.5 hover:shadow-[0_14px_32px_-8px_rgba(163,0,41,0.14)] transition-all duration-300 flex flex-col overflow-hidden relative group/card h-full">
      {/* Red Highlight Badge */}
      {product.isFeatured && (
        <div className="absolute top-3 left-3 z-10 pointer-events-none">
          <span className="bg-[#A30029]/95 backdrop-blur-xs text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-sm">
            {badgeText}
          </span>
        </div>
      )}

      {/* Favorite Heart Button */}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setHeartPop(true);
          toggleFavorite(product.id);
          setTimeout(() => setHeartPop(false), 380);
        }}
        className={`absolute top-3 right-3 z-10 p-1.5 rounded-full backdrop-blur-md border shadow-xs transition-all duration-200 cursor-pointer active:scale-90 ${
          favorited
            ? 'bg-white text-[#A30029] border-[#fecdd3] shadow-sm'
            : 'bg-white/85 hover:bg-white text-[#64748b] hover:text-[#A30029] border-white/60'
        } ${heartPop ? 'animate-heart-pop' : ''}`}
        aria-label={favorited ? 'Bỏ thích món' : 'Yêu thích món'}
        title={favorited ? 'Đã yêu thích' : 'Thêm vào yêu thích'}
      >
        <CiHeart className={`w-4 h-4 stroke-1 ${favorited ? 'text-[#A30029] fill-[#A30029]' : ''}`} />
      </button>

      {/* Product Image Container (Full-bleed 1:1 Square) */}
      <Link
        href={`/product/${product.slug}`}
        className="relative aspect-square w-full overflow-hidden bg-[#f8f4ef] block"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.image}
          alt={product.name}
          className={`w-full h-full object-cover group-hover/card:scale-[1.07] transition-transform duration-500 ease-out ${
            !product.isAvailable ? 'grayscale-[40%] opacity-80' : ''
          }`}
          loading="lazy"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-300" />
        {!product.isAvailable && (
          <div className="absolute inset-0 bg-black/35 backdrop-blur-[1px] flex items-center justify-center">
            <span className="px-3 py-1 rounded-full bg-white/95 text-[#181d26] text-[11px] font-bold shadow-sm">
              Tạm hết hàng
            </span>
          </div>
        )}
      </Link>

      {/* Product Information */}
      <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between bg-white">
        <div>
          {/* Title & Rating */}
          <div className="flex items-start justify-between gap-1.5 mb-1">
            <Link href={`/product/${product.slug}`} className="flex-1 min-w-0">
              <h3 className="font-bold text-[#0f172a] text-[14px] sm:text-[15px] leading-snug line-clamp-1 group-hover/card:text-[#A30029] transition-colors">
                {product.name}
              </h3>
            </Link>
            <span className="flex items-center gap-0.5 bg-amber-50 border border-amber-200/70 px-1.5 py-0.5 rounded-md text-[#333840] font-semibold text-[11px] shrink-0">
              <CiStar className="w-3.5 h-3.5 fill-amber-400 text-amber-400 stroke-1" />
              <span>{product.rating ? product.rating.toFixed(1) : '5.0'}</span>
            </span>
          </div>

          {/* Description */}
          <p className="text-[11px] sm:text-[13px] text-[#475569] line-clamp-1 sm:line-clamp-2 leading-relaxed mb-2.5 sm:mb-4">
            {product.description}
          </p>
        </div>

        {/* Price & Action Button (Red Button) */}
        <div className="pt-2.5 sm:pt-3 border-t border-[#f1ece6] flex items-center justify-between gap-1 sm:gap-2">
          <div className="min-w-0">
            <span className="text-[14px] sm:text-[16px] font-extrabold text-[#A30029] block leading-tight truncate">
              {formatVND(product.price)}
            </span>
            {typeof product.soldCount === 'number' && product.soldCount > 0 && (
              <span className="text-[10px] sm:text-[11px] font-medium text-[#64748b] block mt-0.5">
                Đã bán {product.soldCount}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsOptionsOpen(true);
            }}
            disabled={!product.isAvailable}
            className={`h-8 sm:h-[34px] px-2.5 sm:px-3.5 rounded-[8px] text-[11px] sm:text-[12px] font-semibold transition-all duration-200 flex items-center gap-1 shrink-0 ${
              !product.isAvailable
                ? 'bg-[#f8fafc] text-[#9297a0] border border-[#dddddd] cursor-not-allowed'
                : 'btn-shine bg-[#A30029] hover:bg-[#850021] active:scale-95 text-white shadow-xs hover:shadow-md hover:shadow-red-500/20 cursor-pointer'
            }`}
            title={product.isAvailable ? 'Chọn món & Tùy chọn khẩu vị' : 'Tạm hết hàng'}
          >
            <CiCirclePlus className="w-4 h-4 stroke-1" />
            <span>Thêm</span>
          </button>
        </div>
      </div>

      {/* Quick Customization & Options Modal */}
      <ProductOptionsModal
        product={product}
        isOpen={isOptionsOpen}
        onClose={() => setIsOptionsOpen(false)}
      />
    </div>
  );
}
