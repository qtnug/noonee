'use client';

import React from 'react';
import {
  CiHeart as Heart,
} from 'react-icons/ci';
import { useFavorites } from '@/context/FavoritesContext';

interface FavoriteButtonProps {
  productId: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export default function FavoriteButton({
  productId,
  className = '',
  size = 'md',
  showText = false,
}: FavoriteButtonProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const favorited = isFavorite(productId);

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleFavorite(productId);
      }}
      className={`inline-flex items-center gap-1.5 transition cursor-pointer ${
        favorited
          ? 'text-[#A30029] bg-white border-[#fecdd3] shadow-xs'
          : 'text-[#9297a0] hover:text-[#A30029] bg-white/90 hover:bg-white border-[#dddddd]'
      } ${className}`}
      aria-label={favorited ? 'Bỏ thích món' : 'Thêm vào yêu thích'}
      title={favorited ? 'Đã yêu thích món ăn này' : 'Yêu thích món ăn này'}
    >
      <Heart
        className={`${iconSizes[size]} transition-transform active:scale-125 ${
          favorited ? 'fill-[#A30029] text-[#A30029]' : ''
        }`}
      />
      {showText && (
        <span className="text-[12px] font-medium">
          {favorited ? 'Đã yêu thích' : 'Yêu thích'}
        </span>
      )}
    </button>
  );
}
