'use client';

import React, { useState, useEffect } from 'react';
import { Star, MessageSquare, CheckCircle2, Loader2, Award } from 'lucide-react';
import { Review } from '@/types';
import { formatDate } from '@/lib/utils';

interface ProductReviewsSectionProps {
  productId: number;
  productName: string;
}

export default function ProductReviewsSection({
  productId,
  productName,
}: ProductReviewsSectionProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState<number>(5.0);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadReviews() {
      try {
        const res = await fetch(`/api/reviews?productId=${productId}`);
        const data = await res.json();
        if (isMounted && data.success && data.data) {
          setReviews(data.data.reviews || []);
          setAverageRating(data.data.averageRating || 5.0);
          setTotal(data.data.total || 0);
        }
      } catch (e) {
        console.error('Lỗi tải đánh giá món:', e);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadReviews();
    return () => {
      isMounted = false;
    };
  }, [productId]);

  // Star breakdown calculation
  const starCounts = [5, 4, 3, 2, 1].map((s) => {
    const count = reviews.filter((r) => Math.round(r.rating) === s).length;
    const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
    return { star: s, count, percentage };
  });

  return (
    <div className="bg-white rounded-[12px] p-6 sm:p-10 border border-[#dddddd] space-y-8 shadow-xs">
      {/* Header & Rating Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#dddddd] gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-normal text-[#181d26]">
              Đánh giá từ thực khách ({total})
            </h2>
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[4px] text-[11px] font-medium bg-[#f0fdf4] text-[#16a34a] border border-[#bbf7d0]">
              <CheckCircle2 className="w-3 h-3" />
              100% Đánh giá thực tế
            </span>
          </div>
          <p className="text-[13px] text-[#41454d] mt-1">
            Cảm nhận và nhận xét từ khách hàng đã đặt và thưởng thức món {productName}
          </p>
        </div>

        {/* Rating Score Badge */}
        <div className="flex items-center gap-3.5 bg-[#fff1f2] border border-[#fecdd3] px-5 py-3 rounded-[8px] self-start sm:self-auto shadow-xs">
          <div className="text-3xl font-bold text-[#e31837]">
            {averageRating.toFixed(1)}
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`w-4 h-4 ${
                    s <= Math.round(averageRating)
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-[11px] text-[#41454d] block font-medium">
              {total > 0 ? `${total} lượt đánh giá xác thực` : 'Chưa có lượt đánh giá'}
            </span>
          </div>
        </div>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="py-12 text-center text-[#9297a0] text-[13px] flex items-center justify-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-[#e31837]" />
          <span>Đang tải đánh giá từ hệ thống...</span>
        </div>
      ) : total === 0 ? (
        /* Empty State */
        <div className="p-10 text-center bg-[#f8fafc] rounded-[10px] border border-[#dddddd] text-[#9297a0] text-[13px] space-y-2">
          <div className="w-12 h-12 rounded-full bg-[#fff1f2] border border-[#fecdd3] text-[#e31837] flex items-center justify-center mx-auto mb-2">
            <MessageSquare className="w-6 h-6" />
          </div>
          <h3 className="font-semibold text-[15px] text-[#181d26]">Chưa có đánh giá nào cho món này</h3>
          <p className="max-w-md mx-auto text-[#41454d]">
            Đánh giá được ghi nhận minh bạch từ thực khách sau khi nhận và thưởng thức món ăn thành công qua đơn hàng.
          </p>
        </div>
      ) : (
        /* Reviews Content */
        <div className="space-y-6">
          {/* Star Distribution Bar */}
          <div className="bg-[#f8fafc] rounded-[10px] p-5 border border-[#dddddd] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {starCounts.map((row) => (
              <div key={row.star} className="flex items-center gap-2 text-[12px]">
                <span className="font-semibold text-[#181d26] w-12 flex items-center gap-1">
                  {row.star} <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                </span>
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all"
                    style={{ width: `${row.percentage}%` }}
                  />
                </div>
                <span className="text-[#9297a0] w-8 text-right font-medium">
                  {row.count}
                </span>
              </div>
            ))}
          </div>

          {/* Review Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {reviews.map((rev) => (
              <div
                key={rev.id}
                className="bg-white rounded-[10px] border border-[#dddddd] p-5 space-y-3 hover:border-[#e31837] transition-colors shadow-xs"
              >
                {/* Reviewer info */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-[#fff1f2] border border-[#fecdd3] text-[#e31837] text-[13px] font-bold flex items-center justify-center uppercase">
                      {rev.customerName ? rev.customerName.charAt(0) : 'K'}
                    </div>
                    <div>
                      <div className="text-[13px] font-semibold text-[#181d26] leading-tight">
                        {rev.customerName || 'Khách hàng ẩn danh'}
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-[#16a34a] font-medium mt-0.5">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Đã mua món ăn</span>
                      </div>
                    </div>
                  </div>
                  <span className="text-[11px] text-[#9297a0]">{formatDate(rev.createdAt)}</span>
                </div>

                {/* Rating Stars */}
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`w-4 h-4 ${
                        s <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'
                      }`}
                    />
                  ))}
                  <span className="text-[12px] font-semibold text-[#181d26] ml-1.5">
                    {rev.rating === 5 && 'Tuyệt vời'}
                    {rev.rating === 4 && 'Rất ngon'}
                    {rev.rating === 3 && 'Hài lòng'}
                    {rev.rating <= 2 && 'Cần cải thiện'}
                  </span>
                </div>

                {/* Comment Content */}
                <p className="text-[13px] text-[#41454d] leading-relaxed bg-[#f8fafc] p-3.5 rounded-[8px] border border-[#f1f5f9]">
                  "{rev.comment}"
                </p>
              </div>
            ))}
          </div>

          {/* Footer note */}
          <div className="flex items-center justify-center gap-2 pt-4 text-[12px] text-[#9297a0]">
            <Award className="w-4 h-4 text-[#e31837]" />
            <span>Mỗi khách hàng chỉ gửi 1 đánh giá sau khi hoàn thành đơn hàng.</span>
          </div>
        </div>
      )}
    </div>
  );
}
