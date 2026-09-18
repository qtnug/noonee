import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Star, ShieldCheck, Clock, Utensils, ChevronRight } from 'lucide-react';
import { getProductBySlug, getProducts } from '@/lib/db';
import { formatVND } from '@/lib/utils';
import ProductDetailActions from './ProductDetailActions';
import ProductCard from '@/components/ProductCard';
import ProductReviewsSection from '@/components/ProductReviewsSection';
import FavoriteButton from '@/components/FavoriteButton';

export const revalidate = 0;

export default async function ProductDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const product = await getProductBySlug(params.slug);
  if (!product) {
    notFound();
  }

  const relatedProducts = await getProducts({ categoryId: product.categoryId });
  const filteredRelated = relatedProducts.filter((p) => p.id !== product.id).slice(0, 4);

  return (
    <div className="bg-[#FFFAF0] min-h-screen py-6 sm:py-10 pb-20 md:pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-12">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[12px] sm:text-[13px] text-[#41454d]">
          <Link href="/" className="hover:text-[#e31837] transition">
            Trang chủ
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-[#9297a0]" />
          <Link href="/menu" className="hover:text-[#e31837] transition">
            Thực đơn
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-[#9297a0]" />
          <span className="text-[#e31837] font-semibold truncate">{product.name}</span>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 bg-white rounded-[16px] border border-[#dddddd] p-6 sm:p-8 lg:p-10 shadow-xs">
          {/* Left: Product Image */}
          <div className="md:col-span-6 relative aspect-square rounded-[12px] overflow-hidden bg-[#fdf2f2]/30 border border-[#dddddd]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover"
            />
            <span className="absolute top-3 left-3 sm:top-4 sm:left-4 bg-white text-[#e31837] text-[11px] sm:text-[12px] font-bold px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-[4px] border border-[#fecdd3] shadow-xs">
              {product.categoryName || 'Món ăn'}
            </span>
            <FavoriteButton
              productId={product.id}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10 p-2 sm:p-2.5 rounded-full border"
              size="md"
            />
          </div>

          {/* Right: Details & Order CTA */}
          <div className="md:col-span-6 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <h1 className="text-2xl sm:text-4xl font-extrabold text-[#0f172a] tracking-tight">
                {product.name}
              </h1>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-[#333840]">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span className="text-[13px] font-bold text-[#181d26]">
                    {product.rating ? product.rating.toFixed(1) : '5.0'}
                  </span>
                </div>
              </div>

              <div className="flex items-baseline gap-2.5">
                <span className="text-2xl sm:text-3xl font-bold text-[#e31837]">
                  {formatVND(product.price)}
                </span>
              </div>

              <div className="border-t border-b border-[#dddddd] py-4 sm:py-5 space-y-2">
                <h3 className="text-[12px] font-semibold uppercase text-[#e31837] tracking-wider">
                  Mô tả món ăn
                </h3>
                <p className="text-[13px] sm:text-[14px] text-[#41454d] leading-relaxed">
                  {product.description}
                </p>
              </div>

              {/* Prep time badge */}
              <div>
                <div className="inline-flex items-center gap-2 p-2.5 sm:p-3 rounded-[6px] bg-[#fff1f2]/50 border border-[#fecdd3] text-[12px] sm:text-[13px] text-[#41454d]">
                  <Clock className="w-4 h-4 text-[#e31837] shrink-0" />
                  <span>Chuẩn bị trong {product.prepTime || 15} phút</span>
                </div>
              </div>
            </div>

            {/* Client Action Component */}
            <ProductDetailActions product={product} />
          </div>
        </div>

        {/* Product Reviews & Rating Section */}
        <ProductReviewsSection productId={product.id} productName={product.name} />

        {/* Related Products */}
        {filteredRelated.length > 0 && (
          <div className="space-y-4 sm:space-y-6 pt-4 sm:pt-6">
            <h2 className="text-xl sm:text-2xl font-normal text-[#181d26]">Món ăn cùng danh mục</h2>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-6">
              {filteredRelated.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
