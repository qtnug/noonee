'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Search, Tag, UtensilsCrossed, Gift, Users, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import ProductCard from '@/components/ProductCard';
import { Product, Category } from '@/types';
import { useAuth } from '@/context/AuthContext';

const ITEMS_PER_PAGE = 12;

function MenuPageContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get('categoryId');
  const initialSearch = searchParams.get('search') || '';
  const initialDeal = searchParams.get('deal') === 'true';

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(
    initialCategory ? parseInt(initialCategory) : null
  );
  const [onlyDeals, setOnlyDeals] = useState(initialDeal);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [sortBy, setSortBy] = useState<'best-seller' | 'price-asc' | 'price-desc'>('best-seller');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(true);
  const [showGuestPrompt, setShowGuestPrompt] = useState(false);

  useEffect(() => {
    if (!user) {
      const dismissed = typeof window !== 'undefined' ? sessionStorage.getItem('noonee_dismiss_guest_prompt') : null;
      if (!dismissed) {
        setShowGuestPrompt(true);
      }
    } else {
      setShowGuestPrompt(false);
    }
  }, [user]);

  useEffect(() => {
    async function loadData() {
      try {
        const [prodRes, catRes] = await Promise.all([
          fetch('/api/products?limit=200').then((r) => r.json()),
          fetch('/api/categories').then((r) => r.json()),
        ]);
        if (prodRes.success) setProducts(prodRes.data);
        if (catRes.success) setCategories(catRes.data);
      } catch (e) {
        console.error('Failed to load menu:', e);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    if (initialCategory) setSelectedCategory(parseInt(initialCategory));
    if (initialSearch) setSearchQuery(initialSearch);
    if (initialDeal) setOnlyDeals(true);
  }, [initialCategory, initialSearch, initialDeal]);

  const filteredProducts = useMemo(() => {
    let list = [...products];

    if (onlyDeals) {
      list = list.filter((p) => p.isFeatured);
    }

    if (selectedCategory !== null) {
      list = list.filter((p) => p.categoryId === selectedCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      );
    }

    if (sortBy === 'best-seller') {
      list.sort((a, b) => {
        if (a.isFeatured !== b.isFeatured) return b.isFeatured ? 1 : -1;
        return (b.rating || 0) - (a.rating || 0);
      });
    } else if (sortBy === 'price-asc') {
      list.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
      list.sort((a, b) => b.price - a.price);
    }

    return list;
  }, [products, selectedCategory, onlyDeals, searchQuery, sortBy]);

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [filteredProducts.length, totalPages, currentPage]);

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, filteredProducts.length);
  const currentProducts = useMemo(() => {
    return filteredProducts.slice(startIndex, endIndex);
  }, [filteredProducts, startIndex, endIndex]);

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    setCurrentPage(page);
    const gridElem = document.getElementById('menu-product-grid');
    if (gridElem) {
      gridElem.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="bg-white min-h-screen pb-24">
      {/* Category Header Band */}
      <div className="bg-gradient-to-b from-[#fff1f2]/60 to-white border-b border-[#dddddd] py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#181d26]">
              Khám phá thực đơn NooNee
            </h1>
            <p className="text-[14px] text-[#41454d] max-w-2xl leading-relaxed">
              Thực đơn phong phú hơn 50+ món cơm rang vàng ruộm, cơm tấm sườn bì chả, phở bò gia truyền, đồ ăn vặt và đồ uống mát lạnh chuẩn vị.
            </p>
          </div>

          {/* Group order banner & counter (STT 9) */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              href="/group"
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 hover:border-[#e31837] rounded-[6px] text-[13px] font-semibold text-[#e31837] shadow-xs transition hover:scale-[1.02]"
            >
              <Users className="w-4 h-4" />
              <span>Đặt theo nhóm tiết kiệm</span>
              <span className="px-1.5 py-0.5 bg-[#e31837] text-white text-[10px] font-extrabold rounded-full">
                -10%
              </span>
            </Link>

            <div className="px-4 py-2.5 bg-white rounded-[6px] border border-[#dddddd] text-[13px] text-[#41454d] shadow-2xs font-medium">
              Đang hiển thị <strong className="text-[#e31837] font-bold">{filteredProducts.length}</strong> món ăn
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Early Login Promotion Banner for Guests (STT 11) */}
        {!user && showGuestPrompt && (
          <div className="bg-gradient-to-r from-red-50 via-rose-50 to-amber-50 border border-red-200 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm animate-in fade-in duration-300">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-10 h-10 rounded-full bg-[#e31837] text-white flex items-center justify-center shrink-0 shadow-xs">
                <Gift className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold text-[#181d26]">Chào bạn mới! Nhận ngay ưu đãi:</span>
                  <span className="text-xs font-extrabold px-2 py-0.5 bg-[#e31837] text-white rounded-full">
                    Giảm 20.000đ
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-[#41454d] mt-0.5">
                  Đăng nhập tài khoản sớm để áp dụng voucher ưu đãi cho đơn hàng đầu tiên, tích điểm hạng thành viên và lưu địa chỉ nhận hàng.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
              <Link
                href="/login?redirect=/menu"
                className="px-4 py-2 bg-[#e31837] hover:bg-[#be0e27] text-white text-xs sm:text-sm font-semibold rounded-lg shadow-xs transition hover:scale-105 active:scale-95 cursor-pointer"
              >
                Đăng nhập ngay
              </Link>
              <button
                type="button"
                onClick={() => {
                  setShowGuestPrompt(false);
                  sessionStorage.setItem('noonee_dismiss_guest_prompt', 'true');
                }}
                className="px-3 py-2 text-xs sm:text-sm text-[#9297a0] hover:text-[#181d26] transition font-medium cursor-pointer"
              >
                Để sau
              </button>
            </div>
          </div>
        )}
        {/* Search & Filter Bar */}
        <div className="bg-white rounded-[10px] border border-[#dddddd] p-5 space-y-4 shadow-xs">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search Input */}
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9297a0]" />
              <input
                type="text"
                placeholder="Tìm món ăn, cơm tấm, bún phở, trà..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full h-11 pl-10 pr-4 text-[14px] text-[#181d26] bg-white border border-[#dddddd] rounded-[6px] focus:outline-none focus:border-[#e31837] focus:ring-1 focus:ring-[#e31837] transition"
              />
            </div>

            {/* Sort & Quick Deals */}
            <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
              <button
                onClick={() => {
                  setOnlyDeals(!onlyDeals);
                  setCurrentPage(1);
                }}
                className={`h-11 px-4 rounded-[6px] text-[13px] font-semibold transition flex items-center gap-1.5 border cursor-pointer ${
                  onlyDeals
                    ? 'bg-[#e31837] text-white border-[#e31837] shadow-xs'
                    : 'bg-white text-[#e31837] border-[#fecdd3] hover:bg-[#fff1f2]'
                }`}
              >
                <Tag className="w-3.5 h-3.5" />
                <span>Món nổi bật</span>
              </button>

              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value as any);
                  setCurrentPage(1);
                }}
                className="h-11 text-[13px] bg-white border border-[#dddddd] rounded-[6px] px-3 text-[#181d26] font-medium focus:outline-none focus:border-[#e31837] cursor-pointer"
              >
                <option value="best-seller">Sắp xếp: Bán chạy nhất ⭐</option>
                <option value="price-asc">Giá: Thấp đến Cao</option>
                <option value="price-desc">Giá: Cao đến Thấp</option>
              </select>
            </div>
          </div>

          {/* Category Horizontal Filter Buttons - Swipable on mobile, Centered on desktop */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 sm:py-2 px-0.5 sm:justify-center sm:flex-wrap border-t border-[#dddddd]">
            <button
              onClick={() => {
                setSelectedCategory(null);
                setOnlyDeals(false);
                setCurrentPage(1);
              }}
              className={`h-9 px-3.5 sm:px-4 rounded-lg text-xs sm:text-[13px] font-semibold shrink-0 transition cursor-pointer ${
                selectedCategory === null && !onlyDeals
                  ? 'bg-[#e31837] text-white shadow-xs'
                  : 'bg-white border border-[#dddddd] text-[#333840] hover:bg-[#fff1f2] hover:border-[#fecdd3]'
              }`}
            >
              Tất cả món ({products.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat.id);
                  setOnlyDeals(false);
                  setCurrentPage(1);
                }}
                className={`h-9 px-3.5 sm:px-4 rounded-lg text-xs sm:text-[13px] font-semibold shrink-0 transition cursor-pointer ${
                  selectedCategory === cat.id && !onlyDeals
                    ? 'bg-[#e31837] text-white shadow-xs'
                    : 'bg-white border border-[#dddddd] text-[#333840] hover:bg-[#fff1f2] hover:border-[#fecdd3]'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-6 py-4 sm:py-8">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => (
              <div key={n} className="bg-white rounded-[10px] p-3 sm:p-4 border border-[#dddddd] animate-pulse space-y-2 sm:space-y-3">
                <div className="aspect-square bg-[#f8fafc] rounded-[6px]" />
                <div className="h-3 sm:h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-2.5 sm:h-3 bg-gray-100 rounded w-1/2" />
                <div className="h-7 sm:h-9 bg-gray-200 rounded mt-2 sm:mt-4" />
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-white rounded-[12px] border border-[#dddddd] p-12 text-center space-y-4 my-8">
            <div className="w-12 h-12 rounded-[10px] bg-[#fff1f2] border border-[#fecdd3] text-[#e31837] flex items-center justify-center mx-auto">
              <UtensilsCrossed className="w-6 h-6" />
            </div>
            <h3 className="text-[18px] font-semibold text-[#181d26]">Không tìm thấy món ăn phù hợp</h3>
            <p className="text-[14px] text-[#41454d] max-w-sm mx-auto">
              Vui lòng thử tìm kiếm với từ khóa khác hoặc bấm nút bên dưới để xem lại toàn bộ thực đơn.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory(null);
                setOnlyDeals(false);
                setCurrentPage(1);
              }}
              className="h-10 px-5 bg-[#e31837] hover:bg-[#be0e27] text-white text-[13px] font-semibold rounded-[6px] transition"
            >
              Xem tất cả món
            </button>
          </div>
        ) : (
          <div id="menu-product-grid" className="scroll-mt-8 space-y-8">
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-6">
              {currentProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  badgeText={product.isFeatured ? 'Nổi bật' : 'Món ngon'}
                />
              ))}
            </div>

            {/* Pagination Controls Bar */}
            {totalPages > 1 && (
              <div className="pt-6 pb-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[#dddddd]">
                <div className="text-[13px] text-[#555a64]">
                  Hiển thị <strong className="text-[#181d26]">{startIndex + 1} - {endIndex}</strong> trong tổng số <strong className="text-[#e31837]">{filteredProducts.length}</strong> món ăn
                </div>

                <div className="flex items-center gap-1.5 flex-wrap justify-center">
                  <button
                    type="button"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="h-9 px-3 bg-white border border-[#dddddd] text-[#181d26] text-[13px] font-medium rounded-[6px] hover:bg-[#f8fafc] disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1 cursor-pointer"
                    aria-label="Trang trước"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span className="hidden sm:inline">Trước</span>
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                    const isCurrent = pageNum === currentPage;
                    const isNearCurrent = Math.abs(pageNum - currentPage) <= 1;
                    const isFirst = pageNum === 1;
                    const isLast = pageNum === totalPages;

                    if (!isNearCurrent && !isFirst && !isLast) {
                      if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                        return (
                          <span key={pageNum} className="w-7 text-center text-gray-400 text-xs">
                            ...
                          </span>
                        );
                      }
                      return null;
                    }

                    return (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => handlePageChange(pageNum)}
                        className={`min-w-9 h-9 px-2.5 rounded-[6px] text-[13px] font-semibold transition cursor-pointer ${
                          isCurrent
                            ? 'bg-[#e31837] text-white shadow-xs'
                            : 'bg-white border border-[#dddddd] text-[#333840] hover:bg-[#fff1f2] hover:border-[#fecdd3]'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="h-9 px-3 bg-white border border-[#dddddd] text-[#181d26] text-[13px] font-medium rounded-[6px] hover:bg-[#f8fafc] disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1 cursor-pointer"
                    aria-label="Trang sau"
                  >
                    <span className="hidden sm:inline">Sau</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function MenuPage() {
  return (
    <Suspense fallback={<div className="p-16 text-center text-[14px] text-[#9297a0]">Đang tải thực đơn...</div>}>
      <MenuPageContent />
    </Suspense>
  );
}
