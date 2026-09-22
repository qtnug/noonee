'use client';

import React, { useState, useEffect, useMemo, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Search,
  Tag,
  UtensilsCrossed,
  Gift,
  Users,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  X,
  ArrowUp,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import ProductCard from '@/components/ProductCard';
import { Product, Category } from '@/types';
import { useAuth } from '@/context/AuthContext';

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
  const [visibleCount, setVisibleCount] = useState<number>(12);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showGuestPrompt, setShowGuestPrompt] = useState(false);
  const observerRef = useRef<HTMLDivElement>(null);

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

  // Reset visibleCount when filters change
  useEffect(() => {
    setVisibleCount(12);
  }, [selectedCategory, onlyDeals, searchQuery, sortBy]);

  // Track window scroll for back-to-top button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Infinite Scroll Trigger via IntersectionObserver
  useEffect(() => {
    if (isLoadingMore || visibleCount >= filteredProducts.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && visibleCount < filteredProducts.length) {
          setIsLoadingMore(true);
          setTimeout(() => {
            setVisibleCount((prev) => Math.min(prev + 8, filteredProducts.length));
            setIsLoadingMore(false);
          }, 350);
        }
      },
      { threshold: 0.1, rootMargin: '150px' }
    );

    const el = observerRef.current;
    if (el) observer.observe(el);

    return () => {
      if (el) observer.unobserve(el);
    };
  }, [visibleCount, filteredProducts.length, isLoadingMore]);

  const displayedProducts = useMemo(() => {
    return filteredProducts.slice(0, visibleCount);
  }, [filteredProducts, visibleCount]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="bg-[#FFFAF0] min-h-screen pb-24">
      {/* Category Header Band */}
      <div className="bg-gradient-to-b from-[#fff1f2]/60 to-[#FFFAF0] border-b border-[#ebdcd0] py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0f172a]">
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
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-11 pl-10 pr-10 text-[14px] text-[#181d26] bg-white border border-[#dddddd] rounded-[6px] focus:outline-none focus:border-[#e31837] focus:ring-1 focus:ring-[#e31837] transition"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition cursor-pointer"
                  aria-label="Xóa tìm kiếm"
                  title="Xóa tìm kiếm"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Sort & Quick Deals */}
            <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
              <button
                onClick={() => setOnlyDeals(!onlyDeals)}
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
                onChange={(e) => setSortBy(e.target.value as any)}
                className="h-11 text-[13px] bg-white border border-[#dddddd] rounded-[6px] px-3 text-[#181d26] font-medium focus:outline-none focus:border-[#e31837] cursor-pointer shadow-2xs"
              >
                <option value="best-seller">🔥 Sắp xếp: Bán chạy & Đánh giá</option>
                <option value="price-asc">💰 Giá: Thấp đến cao</option>
                <option value="price-desc">💎 Giá: Cao đến thấp</option>
              </select>
            </div>
          </div>

          {/* Category Horizontal Filter Buttons - Swipable on mobile, Centered on desktop */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 sm:py-2 px-0.5 sm:justify-center sm:flex-wrap border-t border-[#dddddd]">
            <button
              onClick={() => {
                setSelectedCategory(null);
                setOnlyDeals(false);
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
                setVisibleCount(12);
              }}
              className="h-10 px-5 bg-[#e31837] hover:bg-[#be0e27] text-white text-[13px] font-semibold rounded-[6px] transition"
            >
              Xem tất cả món
            </button>
          </div>
        ) : (
          <div id="menu-product-grid" className="scroll-mt-8 space-y-8">
            {/* Status bar: displaying count */}
            <div className="flex items-center justify-between text-[12px] sm:text-[13px] text-[#475569] px-1">
              <span>
                Hiển thị <strong className="text-[#0f172a] font-bold">{displayedProducts.length}</strong> / {filteredProducts.length} món ăn
              </span>
              {onlyDeals && (
                <span className="text-[#e31837] font-semibold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  Đang lọc món nổi bật
                </span>
              )}
            </div>

            {/* Grid with smooth progressive card entrance */}
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-6">
              {displayedProducts.map((product) => (
                <div
                  key={product.id}
                  className="animate-in fade-in slide-in-from-bottom-2 duration-300 fill-mode-forwards"
                >
                  <ProductCard
                    product={product}
                    badgeText={product.isFeatured ? 'Nổi bật' : 'Món ngon'}
                  />
                </div>
              ))}
            </div>

            {/* Loading more skeletons when scrolling down */}
            {isLoadingMore && (
              <div className="pt-4 space-y-4">
                <div className="flex items-center justify-center gap-2 text-[#e31837] text-[13px] font-semibold">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang tải thêm món ngon NooNee...</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-6">
                  {[1, 2, 3, 4].map((n) => (
                    <div key={n} className="bg-white rounded-[10px] p-3 sm:p-4 border border-[#dddddd] animate-pulse space-y-2 sm:space-y-3">
                      <div className="aspect-square bg-[#f8fafc] rounded-[6px]" />
                      <div className="h-3 sm:h-4 bg-gray-200 rounded w-3/4" />
                      <div className="h-2.5 sm:h-3 bg-gray-100 rounded w-1/2" />
                      <div className="h-7 sm:h-9 bg-gray-200 rounded mt-2" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sentinel element for infinite scroll observer */}
            {visibleCount < filteredProducts.length && (
              <div ref={observerRef} className="pt-4 pb-2 flex flex-col items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setVisibleCount((prev) => Math.min(prev + 8, filteredProducts.length))}
                  className="px-5 py-2.5 bg-white hover:bg-[#fff1f2] text-[#e31837] border border-[#fecdd3] hover:border-[#e31837] rounded-lg text-[13px] font-bold shadow-2xs transition cursor-pointer"
                >
                  Xem thêm món (+{filteredProducts.length - visibleCount} món còn lại)
                </button>
              </div>
            )}

            {/* Reached the end of menu */}
            {visibleCount >= filteredProducts.length && filteredProducts.length > 0 && (
              <div className="pt-8 pb-4 flex justify-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#fdf2f2] border border-[#fecdd3] text-[12px] sm:text-[13px] font-medium text-[#e31837]">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Đã hiển thị toàn bộ {filteredProducts.length} món ăn trong thực đơn. Chúc bạn ngon miệng!</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Floating Scroll To Top Button (Placed on left to avoid Chatbot on right) */}
      {showScrollTop && (
        <button
          type="button"
          onClick={scrollToTop}
          className="fixed bottom-20 sm:bottom-6 left-4 sm:left-6 z-40 p-3 rounded-full bg-[#181d26] text-white hover:bg-[#e31837] shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer animate-in fade-in"
          aria-label="Cuộn lên đầu trang"
          title="Cuộn lên đầu trang"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}
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
