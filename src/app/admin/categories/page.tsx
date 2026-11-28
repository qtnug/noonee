'use client';

import React, { useEffect, useState, useMemo } from 'react';
import {
  CiCirclePlus as Plus,
  CiFolderOn as FolderPlus,
  CiEdit as Pencil,
  CiTrash as Trash2,
  CiSearch as Search,
  CiCircleRemove as X,
  CiCircleCheck as Check,
  CiCircleAlert as AlertCircle,
  CiRedo as Loader2,
  CiGrid31 as Layers,
} from 'react-icons/ci';
import { Category, Product } from '@/types';
import { generateSlug } from '@/lib/utils';

const POPULAR_ICONS = [
  { id: 'BowlFood', label: 'Cơm / Bún / Phở' },
  { id: 'Sandwich', label: 'Bánh mì / Ăn nhanh' },
  { id: 'Coffee', label: 'Đồ uống / Cà phê' },
  { id: 'Sparkles', label: 'Đặc biệt / Bán chạy' },
  { id: 'Flame', label: 'Món cay / Món nướng' },
  { id: 'Utensils', label: 'Món ăn chung' },
];

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Form states
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('Utensils');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Delete modal state
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchData = async () => {
    try {
      const [catRes, prodRes] = await Promise.all([
        fetch('/api/categories'),
        fetch('/api/products'),
      ]);
      const catData = await catRes.json();
      const prodData = await prodRes.json();

      if (catData.success && Array.isArray(catData.data)) {
        setCategories(catData.data);
      }
      if (prodData.success && Array.isArray(prodData.data)) {
        setProducts(prodData.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Compute product count per category
  const productCountMap = useMemo(() => {
    const map: Record<number, number> = {};
    for (const p of products) {
      if (p.categoryId) {
        map[p.categoryId] = (map[p.categoryId] || 0) + 1;
      }
    }
    return map;
  }, [products]);

  // Filtered categories
  const filteredCategories = useMemo(() => {
    if (!searchTerm.trim()) return categories;
    const q = searchTerm.toLowerCase().trim();
    return categories.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.slug.toLowerCase().includes(q) ||
        (c.description && c.description.toLowerCase().includes(q))
    );
  }, [categories, searchTerm]);

  // Auto-generate slug when name changes (only in Create mode or when slug hasn't been custom modified)
  const handleNameChange = (val: string) => {
    setName(val);
    if (!editingCategory) {
      setSlug(generateSlug(val));
    }
  };

  // Switch to edit mode
  const handleStartEdit = (cat: Category) => {
    setEditingCategory(cat);
    setName(cat.name);
    setSlug(cat.slug);
    setDescription(cat.description || '');
    setIcon(cat.icon || 'Utensils');
    setMessage(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Cancel edit mode
  const handleCancelEdit = () => {
    setEditingCategory(null);
    setName('');
    setSlug('');
    setDescription('');
    setIcon('Utensils');
    setMessage(null);
  };

  // Submit create or update
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    setMessage(null);

    const finalSlug = slug.trim() || generateSlug(name.trim());
    const payload = {
      name: name.trim(),
      slug: finalSlug,
      description: description.trim(),
      icon,
    };

    try {
      if (editingCategory) {
        // Update existing category
        const res = await fetch(`/api/categories/${editingCategory.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (data.success) {
          setMessage({ type: 'success', text: `Đã cập nhật danh mục "${payload.name}" thành công!` });
          handleCancelEdit();
          fetchData();
        } else {
          setMessage({ type: 'error', text: data.message || 'Lỗi khi cập nhật danh mục' });
        }
      } else {
        // Create new category
        const res = await fetch('/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (data.success) {
          setMessage({ type: 'success', text: `Đã tạo mới danh mục "${payload.name}" thành công!` });
          setName('');
          setSlug('');
          setDescription('');
          setIcon('Utensils');
          fetchData();
        } else {
          setMessage({ type: 'error', text: data.message || 'Lỗi khi tạo danh mục' });
        }
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Có lỗi xảy ra, vui lòng thử lại' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete category
  const handleDeleteConfirm = async () => {
    if (!deletingCategory) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/categories/${deletingCategory.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: `Đã xoá danh mục "${deletingCategory.name}" thành công!` });
        if (editingCategory?.id === deletingCategory.id) {
          handleCancelEdit();
        }
        setDeletingCategory(null);
        fetchData();
      } else {
        setMessage({ type: 'error', text: data.message || 'Lỗi khi xoá danh mục' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Có lỗi xảy ra khi xoá' });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-normal text-[#181d26]">Quản lý danh mục món ăn</h1>
          <p className="text-[13px] sm:text-[14px] text-[#41454d] mt-0.5 sm:mt-1">
            Thêm, xem, chỉnh sửa và quản lý phân loại món ăn (CRUD danh mục)
          </p>
        </div>
        <div className="flex items-center gap-2 text-[12px] sm:text-[13px] text-[#41454d] bg-white px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-[8px] border border-[#dddddd] self-start sm:self-auto">
          <Layers className="w-4 h-4 text-[#A30029]" />
          <span>Tổng số: <strong>{categories.length} danh mục</strong></span>
        </div>
      </div>

      {message && (
        <div
          className={`p-3.5 rounded-[8px] border text-[13px] font-medium flex items-center justify-between ${
            message.type === 'success'
              ? 'bg-[#f0fdf4] border-[#bbf7d0] text-[#15803d]'
              : 'bg-[#fff1f2] border-[#fecdd3] text-[#A30029]'
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{message.text}</span>
          </div>
          <button
            onClick={() => setMessage(null)}
            className="p-1 text-gray-400 hover:text-gray-600 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
        {/* Left Form: Create / Edit Category */}
        <div className="lg:col-span-5 bg-white p-4 sm:p-6 rounded-[10px] border border-[#dddddd] space-y-4 sm:space-y-5 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-[#dddddd]">
            <div className="flex items-center gap-2">
              {editingCategory ? (
                <Pencil className="w-5 h-5 text-amber-600" />
              ) : (
                <FolderPlus className="w-5 h-5 text-[#A30029]" />
              )}
              <h2 className="text-[15px] font-semibold text-[#181d26]">
                {editingCategory ? 'Chỉnh sửa danh mục' : 'Thêm danh mục mới'}
              </h2>
            </div>
            {editingCategory && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="text-[12px] text-gray-500 hover:text-[#A30029] font-medium transition"
              >
                Hủy sửa
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-[13px]">
            <div className="space-y-1.5">
              <label className="font-medium text-[#181d26]">
                Tên danh mục <span className="text-[#A30029]">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ví dụ: Cơm & Bún Phở, Món Đặc Biệt..."
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                className="w-full h-10 px-3.5 bg-white border border-[#dddddd] rounded-[6px] text-[13px] text-[#181d26] focus:outline-none focus:border-[#A30029] focus:ring-1 focus:ring-[#A30029] transition"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-medium text-[#181d26]">
                Đường dẫn URL (Slug) <span className="text-[#A30029]">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="com-bun-pho"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full h-10 px-3.5 bg-white border border-[#dddddd] rounded-[6px] text-[13px] font-mono text-[#181d26] focus:outline-none focus:border-[#A30029] transition"
              />
              <span className="text-[11px] text-[#9297a0]">
                Được tạo tự động theo tên hoặc có thể chỉnh tay
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="font-medium text-[#181d26]">Biểu tượng (Icon)</label>
              <div className="grid grid-cols-2 gap-2">
                {POPULAR_ICONS.map((it) => (
                  <button
                    key={it.id}
                    type="button"
                    onClick={() => setIcon(it.id)}
                    className={`px-2.5 py-1.5 rounded-[6px] border text-[11px] text-left transition flex items-center gap-1.5 ${
                      icon === it.id
                        ? 'border-[#A30029] bg-[#fff1f2] text-[#A30029] font-semibold'
                        : 'border-[#dddddd] hover:bg-gray-50 text-[#41454d]'
                    }`}
                  >
                    <span>{it.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-medium text-[#181d26]">Mô tả nhóm món</label>
              <textarea
                rows={3}
                placeholder="Mô tả các món ăn trong nhóm này..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-3 bg-white border border-[#dddddd] rounded-[6px] text-[13px] text-[#181d26] focus:outline-none focus:border-[#A30029] transition"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 h-10 bg-[#A30029] hover:bg-[#850021] active:bg-[#a60b20] text-white font-medium rounded-[6px] transition flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang lưu...</span>
                  </>
                ) : editingCategory ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Lưu thay đổi</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Tạo danh mục mới</span>
                  </>
                )}
              </button>

              {editingCategory && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="h-10 px-4 bg-white border border-[#dddddd] hover:bg-gray-50 text-[#41454d] rounded-[6px] transition font-medium"
                >
                  Hủy
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Right Table: Categories List */}
        <div className="lg:col-span-7 bg-white rounded-[10px] border border-[#dddddd] overflow-hidden shadow-2xs space-y-0">
          <div className="p-4 border-b border-[#dddddd] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="font-semibold text-[14px] text-[#181d26]">
              Danh sách hiện có ({filteredCategories.length} danh mục)
            </div>

            {/* Search filter */}
            <div className="relative w-full sm:w-60">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                placeholder="Tìm danh mục..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-9 pl-9 pr-3 text-[12px] bg-white border border-[#dddddd] rounded-[6px] focus:outline-none focus:border-[#A30029]"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-[13px] text-[#9297a0] flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-[#A30029]" />
              <span>Đang tải danh sách danh mục...</span>
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="p-12 text-center text-[13px] text-[#9297a0]">
              {searchTerm ? 'Không tìm thấy danh mục phù hợp' : 'Chưa có danh mục nào'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13px] min-w-[500px]">
                <thead className="bg-[#f8fafc] border-b border-[#dddddd] text-[#9297a0] font-medium uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Tên danh mục</th>
                    <th className="py-3 px-4">Slug</th>
                    <th className="py-3 px-4 text-center">Số món</th>
                    <th className="py-3 px-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#dddddd]">
                  {filteredCategories.map((c) => {
                    const count = productCountMap[c.id] || 0;
                    const isSelected = editingCategory?.id === c.id;

                    return (
                      <tr
                        key={c.id}
                        className={`transition ${
                          isSelected ? 'bg-[#fff1f2]/40' : 'hover:bg-[#f8fafc]'
                        }`}
                      >
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-[#181d26] flex items-center gap-2">
                            <span>{c.name}</span>
                            {isSelected && (
                              <span className="text-[10px] bg-[#A30029] text-white px-1.5 py-0.5 rounded font-normal">
                                Đang sửa
                              </span>
                            )}
                          </div>
                          {c.description && (
                            <p className="text-[12px] text-[#41454d] truncate max-w-xs mt-0.5">
                              {c.description}
                            </p>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[#9297a0] text-[12px]">
                          {c.slug}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium ${
                              count > 0
                                ? 'bg-[#f0fdf4] text-[#15803d] border border-[#bbf7d0]'
                                : 'bg-gray-100 text-gray-500'
                            }`}
                          >
                            {count} món
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleStartEdit(c)}
                              title="Chỉnh sửa danh mục"
                              className="p-1.5 rounded-[6px] text-gray-500 hover:text-amber-700 hover:bg-amber-50 border border-transparent hover:border-amber-200 transition"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingCategory(c)}
                              title="Xóa danh mục"
                              className="p-1.5 rounded-[6px] text-gray-500 hover:text-[#A30029] hover:bg-[#fff1f2] border border-transparent hover:border-[#fecdd3] transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deletingCategory && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-[12px] max-w-md w-full p-6 space-y-4 border border-[#dddddd] shadow-xl">
            <div className="flex items-center gap-3 text-[#A30029]">
              <div className="p-2 bg-[#fff1f2] rounded-full border border-[#fecdd3]">
                <AlertCircle className="w-5 h-5" />
              </div>
              <h3 className="text-[16px] font-bold text-[#181d26]">Xác nhận xoá danh mục?</h3>
            </div>

            <div className="text-[13px] text-[#41454d] space-y-2">
              <p>
                Bạn có chắc chắn muốn xoá danh mục{' '}
                <strong className="text-[#181d26]">&quot;{deletingCategory.name}&quot;</strong>?
              </p>
              {(productCountMap[deletingCategory.id] || 0) > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-[6px] text-[12px] text-amber-800 space-y-1">
                  <strong>Cảnh báo:</strong> Danh mục này hiện đang chứa{' '}
                  <strong>{productCountMap[deletingCategory.id]} món ăn</strong>. Sau khi xoá, các món này sẽ chuyển sang trạng thái chưa phân loại danh mục.
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeletingCategory(null)}
                className="px-4 py-2 bg-white border border-[#dddddd] hover:bg-gray-50 text-[#181d26] text-[13px] font-medium rounded-[6px] transition"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-[#A30029] hover:bg-[#850021] text-white text-[13px] font-medium rounded-[6px] transition flex items-center gap-1.5 disabled:opacity-50 shadow-xs"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang xoá...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Xác nhận xoá</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
