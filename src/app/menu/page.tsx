'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, Tag, UtensilsCrossed } from 'lucide-react';
import ProductCard from '@/components/ProductCard';
import { Product, Category } from '@/types';

function MenuPageContent() {
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
  const [sortBy, setSortBy] = useState<'default' | 'price-asc' | 'price-desc'>('default');
  const [isLoading, setIsLoading] = useState(true);

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

    if (sortBy === 'price-asc') {
      list.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
      list.sort((a, b) => b.price - a.price);
    }

    return list;
  }, [products, selectedCategory, onlyDeals, searchQuery, sortBy]);

  return (
    <div className="bg-white min-h-screen pb-24">
      {/* Category Header Band */}
      <div className="bg-[#fff1f2]/40 border-b border-[#dddddd] py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-[12px] font-semibold text-[#e31837] uppercase tracking-wider mb-1">
              Thực đơn trực tuyến NooNee
            </div>
            <h1 className="text-3xl font-normal tracking-tight text-[#181d26]">
              Khám phá tất cả món ăn & thức uống
            </h1>
          </div>
          <div className="text-[14px] text-[#41454d]">
            Đang hiển thị <strong className="text-[#e31837] font-bold">{filteredProducts.length}</strong> món ăn
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
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
                className="w-full h-11 pl-10 pr-4 text-[14px] text-[#181d26] bg-white border border-[#dddddd] rounded-[6px] focus:outline-none focus:border-[#e31837] focus:ring-1 focus:ring-[#e31837] transition"
              />
            </div>

            {/* Sort & Quick Deals */}
            <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
              <button
                onClick={() => setOnlyDeals(!onlyDeals)}
                className={`h-11 px-4 rounded-[6px] text-[13px] font-semibold transition flex items-center gap-1.5 border ${
                  onlyDeals
                    ? 'bg-[#e31837] text-white border-[#e31837] shadow-xs'
                    : 'bg-white text-[#e31837] border-[#fecdd3] hover:bg-[#fff1f2]'
                }`}
              >
                <Tag className="w-3.5 h-3.5" />
                <span>Món ưu đãi</span>
              </button>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="h-11 text-[13px] bg-white border border-[#dddddd] rounded-[6px] px-3 text-[#181d26] font-medium focus:outline-none focus:border-[#e31837]"
              >
                <option value="default">Sắp xếp: Mặc định</option>
                <option value="price-asc">Giá: Thấp đến Cao</option>
                <option value="price-desc">Giá: Cao đến Thấp</option>
              </select>
            </div>
          </div>

          {/* Category Horizontal Filter Buttons */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-2 border-t border-[#dddddd]">
            <button
              onClick={() => {
                setSelectedCategory(null);
                setOnlyDeals(false);
              }}
              className={`h-9 px-4 rounded-[6px] text-[13px] font-semibold shrink-0 transition ${
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
                className={`h-9 px-4 rounded-[6px] text-[13px] font-semibold shrink-0 transition ${
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 py-8">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div key={n} className="bg-white rounded-[10px] p-4 border border-[#dddddd] animate-pulse space-y-3">
                <div className="h-44 bg-[#f8fafc] rounded-[6px]" />
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
                <div className="h-9 bg-gray-200 rounded mt-4" />
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
              }}
              className="h-10 px-5 bg-[#e31837] hover:bg-[#be0e27] text-white text-[13px] font-semibold rounded-[6px] transition"
            >
              Xem tất cả món
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                badgeText={product.isFeatured ? 'Nổi bật' : 'Món ngon'}
              />
            ))}
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
