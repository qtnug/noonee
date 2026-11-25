'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { CiCircleChevRight } from 'react-icons/ci';
import { Product } from '@/types';
import { useBranch } from '@/context/BranchContext';
import { isProductAvailableAtBranch } from '@/lib/cartUtils';
import BannerSlider from '@/components/BannerSlider';
import ProductCard from '@/components/ProductCard';
import ScrollReveal from '@/components/ScrollReveal';

export default function HomeFeaturedContent({
  productsWithSales,
}: {
  productsWithSales: Product[];
}) {
  const { currentBranch } = useBranch();

  const branchBestSellers = useMemo(() => {
    return productsWithSales
      .filter((p) => (p.soldCount || 0) > 0 && isProductAvailableAtBranch(p, currentBranch.id))
      .sort((a, b) => (b.soldCount || 0) - (a.soldCount || 0))
      .slice(0, 8)
      .map((p) => ({ ...p, isFeatured: true }));
  }, [productsWithSales, currentBranch.id]);

  return (
    <>
      <ScrollReveal animation="fade-up" duration={800} threshold={0.05}>
        <BannerSlider bestSellers={branchBestSellers} />
      </ScrollReveal>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <ScrollReveal animation="fade-up" duration={600}>
          <div className="flex items-center justify-between mb-8 pb-3 border-b border-[#dddddd]">
            <div className="space-y-1">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0f172a]">
                Món ăn nổi bật
              </h2>
              <p className="text-xs sm:text-sm text-[#677992]">
                Các món ăn có lượt đặt mua thực tế cao nhất tại {currentBranch.shortName}
              </p>
            </div>
            <Link
              href="/best-seller"
              className="text-[14px] font-bold text-[#A30029] hover:underline flex items-center gap-1 transition shrink-0"
            >
              <span>Xem BXH bán chạy</span>
              <CiCircleChevRight className="w-5 h-5" />
            </Link>
          </div>
        </ScrollReveal>

        {branchBestSellers.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#e6dcd2] p-10 text-center text-[#677992] text-sm">
            Chưa có dữ liệu lượt mua thực tế cho cơ sở này.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
            {branchBestSellers.map((product, index) => (
              <ScrollReveal
                key={product.id}
                animation="fade-up"
                delay={(index % 4) * 80}
                duration={550}
              >
                <ProductCard
                  product={product}
                  badgeText={index === 0 ? '🔥 Bán chạy #1' : 'Nổi bật'}
                />
              </ScrollReveal>
            ))}
          </div>
        )}

        <ScrollReveal animation="zoom-in" delay={120} duration={600} className="mt-10 text-center">
          <Link
            href="/menu"
            className="inline-flex items-center gap-2 bg-white hover:bg-neutral-50 text-[#A30029] font-bold text-sm sm:text-base px-7 py-3.5 rounded-xl border border-[#A30029]/30 hover:border-[#A30029] shadow-xs transition duration-200 hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>Khám phá toàn bộ thực đơn</span>
            <CiCircleChevRight className="w-5 h-5" />
          </Link>
        </ScrollReveal>
      </section>
    </>
  );
}
