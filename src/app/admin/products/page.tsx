'use client';

import React, { useEffect, useState } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  X,
  Search,
  UploadCloud,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { Product, Category, ProductTopping } from '@/types';
import { formatVND } from '@/lib/utils';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formCategoryId, setFormCategoryId] = useState<number>(1);
  const [formPrice, setFormPrice] = useState<number>(50000);
  const [formPrepTime, setFormPrepTime] = useState<number>(15);
  const [formImage, setFormImage] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formAvailable, setFormAvailable] = useState(true);
  const [formFeatured, setFormFeatured] = useState(false);
  const [formToppings, setFormToppings] = useState<ProductTopping[]>([]);
  const [newTopName, setNewTopName] = useState('');
  const [newTopPrice, setNewTopPrice] = useState<number>(10000);
  const [isSaving, setIsSaving] = useState(false);

  const handleAddCustomTopping = () => {
    if (!newTopName.trim()) return;
    const newId = 'top_' + Date.now();
    setFormToppings((prev) => [
      ...prev,
      { id: newId, name: newTopName.trim(), price: Number(newTopPrice) || 0 },
    ]);
    setNewTopName('');
    setNewTopPrice(10000);
  };

  const handleRemoveTopping = (id: string | number) => {
    setFormToppings((prev) => prev.filter((t) => t.id !== id));
  };

  // Image Upload State
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError('');
    setUploadSuccess('');

    try {
      const fd = new FormData();
      fd.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: fd,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Tải ảnh lên thất bại');
      }

      setFormImage(data.url);
      setUploadSuccess('Đã tải ảnh lên Cloudinary và tự động điền link!');
      setTimeout(() => setUploadSuccess(''), 4000);
    } catch (err: any) {
      setUploadError(err.message || 'Có lỗi khi tải ảnh lên Cloudinary');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const fetchData = async () => {
    try {
      const [prodRes, catRes] = await Promise.all([
        fetch('/api/products').then((r) => r.json()),
        fetch('/api/categories').then((r) => r.json()),
      ]);
      if (prodRes.success) setProducts(prodRes.data);
      if (catRes.success) {
        setCategories(catRes.data);
        if (catRes.data.length > 0) setFormCategoryId(catRes.data[0].id);
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

  const openAddModal = () => {
    setEditingProduct(null);
    setFormName('');
    setFormPrice(50000);
    setFormPrepTime(15);
    setFormImage('https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80');
    setFormDesc('');
    setFormAvailable(true);
    setFormFeatured(false);
    setFormToppings([]);
    setNewTopName('');
    setNewTopPrice(10000);
    if (categories.length > 0) setFormCategoryId(categories[0].id);
    setIsModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setFormName(p.name);
    setFormCategoryId(p.categoryId);
    setFormPrice(p.price);
    setFormPrepTime(p.prepTime || 15);
    setFormImage(p.image);
    setFormDesc(p.description);
    setFormAvailable(p.isAvailable);
    setFormFeatured(p.isFeatured);
    setFormToppings(p.toppings || []);
    setNewTopName('');
    setNewTopPrice(10000);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (editingProduct) {
        await fetch(`/api/products/${editingProduct.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formName,
            categoryId: formCategoryId,
            price: formPrice,
            prepTime: formPrepTime || 15,
            image: formImage,
            description: formDesc,
            isAvailable: formAvailable,
            isFeatured: formFeatured,
            toppings: formToppings,
          }),
        });
      } else {
        await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formName,
            categoryId: formCategoryId,
            price: formPrice,
            prepTime: formPrepTime || 15,
            image: formImage,
            description: formDesc,
            isAvailable: formAvailable,
            isFeatured: formFeatured,
            toppings: formToppings,
          }),
        });
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa món ăn này không?')) return;
    try {
      await fetch(`/api/products/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleAvailable = async (product: Product) => {
    try {
      await fetch(`/api/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAvailable: !product.isAvailable }),
      });
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const filtered = products.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-normal text-[#181d26]">Thực đơn & Món ăn</h1>
          <p className="text-[14px] text-[#41454d] mt-1">
            Tổng cộng {products.length} món ăn đang có trong thực đơn quán
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="h-10 px-4 bg-[#e31837] hover:bg-[#be0e27] active:bg-[#a60b20] text-white font-medium text-[13px] rounded-[6px] flex items-center gap-1.5 transition self-start shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm món ăn mới</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-[10px] border border-[#dddddd] flex items-center">
        <div className="relative w-full max-w-sm">
          <Search className="w-4 h-4 text-[#9297a0] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm kiếm món theo tên hoặc mô tả..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-4 text-[13px] bg-white border border-[#dddddd] rounded-[6px] focus:outline-none focus:border-[#e31837] text-[#181d26]"
          />
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-[10px] border border-[#dddddd] overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-[13px] text-[#9297a0]">Đang tải danh sách món ăn...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-[13px] text-[#41454d]">Không tìm thấy món ăn nào.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead className="bg-[#f8fafc] border-b border-[#dddddd] text-[#9297a0] font-medium uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Món ăn</th>
                  <th className="py-3 px-4">Danh mục</th>
                  <th className="py-3 px-4">Đơn giá</th>
                  <th className="py-3 px-4">Nổi bật</th>
                  <th className="py-3 px-4">Trạng thái bán</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#dddddd]">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-[#f8fafc] transition">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={p.image}
                          alt={p.name}
                          className="w-12 h-12 aspect-square rounded-[6px] object-cover border border-[#dddddd] shrink-0 bg-white"
                        />
                        <div>
                          <div className="font-medium text-[#181d26]">{p.name}</div>
                          <div className="text-[#9297a0] text-[12px] line-clamp-1 max-w-xs">
                            {p.description}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-[4px] bg-[#f8fafc] border border-[#dddddd] text-[#333840] font-medium text-[11px]">
                        {p.categoryName || 'Món chính'}
                      </span>
                      <div className="text-[11px] text-[#9297a0] flex items-center gap-1 mt-1">
                        <Clock className="w-3 h-3 text-[#e31837]" />
                        <span>{p.prepTime || 15} phút</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-[#181d26]">
                      {formatVND(p.price)}
                    </td>
                    <td className="py-3.5 px-4">
                      {p.isFeatured ? (
                        <span className="px-2 py-0.5 rounded-[4px] text-[11px] font-medium bg-[#fff1f2] text-[#e31837] border border-[#fecdd3]">
                          Nổi bật
                        </span>
                      ) : (
                        <span className="text-[#9297a0] text-[12px]">Thường</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => handleToggleAvailable(p)}
                        className={`h-7 px-2.5 rounded-[4px] text-[11px] font-medium transition border ${
                          p.isAvailable
                            ? 'bg-white text-[#006400] border-[#39bf45] hover:bg-[#f8fafc]'
                            : 'bg-[#fff1f2] text-[#e31837] border-[#fecdd3] hover:bg-[#ffe4e6]'
                        }`}
                      >
                        {p.isAvailable ? 'Đang phục vụ' : 'Tạm hết'}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => openEditModal(p)}
                        className="p-1.5 text-[#41454d] hover:text-[#181d26] hover:bg-[#f8fafc] rounded-[4px] transition border border-[#dddddd]"
                        title="Chỉnh sửa món"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="p-1.5 text-[#e31837] hover:bg-[#fff1f2] rounded-[4px] transition border border-[#dddddd]"
                        title="Xóa món"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Add / Edit Product */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-[#181d26]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[12px] max-w-lg w-full p-6 sm:p-8 shadow-xl border border-[#dddddd] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#dddddd]">
              <h2 className="text-lg font-normal text-[#181d26]">
                {editingProduct ? 'Chỉnh sửa món ăn' : 'Thêm món ăn mới'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-[#9297a0] hover:text-[#181d26] rounded-[6px]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-[13px]">
              <div className="space-y-1">
                <label className="font-medium text-[#181d26]">Tên món ăn *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Phở Bò Tái Nạm"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full h-10 px-3.5 bg-white border border-[#dddddd] rounded-[6px] text-[13px] text-[#181d26] focus:outline-none focus:border-[#e31837]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-medium text-[#181d26]">Danh mục *</label>
                  <select
                    value={formCategoryId}
                    onChange={(e) => setFormCategoryId(Number(e.target.value))}
                    className="w-full h-10 px-3 bg-white border border-[#dddddd] rounded-[6px] text-[13px] text-[#181d26] focus:outline-none focus:border-[#e31837]"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-[#181d26]">Giá bán (VNĐ) *</label>
                  <input
                    type="number"
                    required
                    min={1000}
                    step={1000}
                    value={formPrice}
                    onChange={(e) => setFormPrice(Number(e.target.value))}
                    className="w-full h-10 px-3.5 bg-white border border-[#dddddd] rounded-[6px] text-[13px] text-[#181d26] focus:outline-none focus:border-[#e31837]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-[#181d26]">Thời gian nấu (phút) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={180}
                    placeholder="15"
                    value={formPrepTime}
                    onChange={(e) => setFormPrepTime(Number(e.target.value))}
                    className="w-full h-10 px-3.5 bg-white border border-[#dddddd] rounded-[6px] text-[13px] text-[#181d26] focus:outline-none focus:border-[#e31837]"
                  />
                </div>
              </div>

              {/* Image Upload & URL input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-medium text-[#181d26]">Hình ảnh món ăn *</label>
                  <span className="text-[11px] text-[#9297a0]">Tải ảnh lên Cloudinary hoặc dán URL</span>
                </div>

                {/* Upload Button Box */}
                <div className="flex flex-wrap gap-2.5 items-center">
                  <label className="cursor-pointer inline-flex items-center gap-2 px-3.5 py-2 bg-[#f8fafc] hover:bg-[#fff1f2] border border-[#dddddd] hover:border-[#e31837] text-[#181d26] rounded-[6px] text-[12px] font-medium transition shadow-xs">
                    {isUploading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-[#e31837]" />
                        <span>Đang tải lên Cloudinary...</span>
                      </>
                    ) : (
                      <>
                        <UploadCloud className="w-4 h-4 text-[#e31837]" />
                        <span>Tải ảnh từ máy tính</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      disabled={isUploading}
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>

                  {uploadError && (
                    <span className="text-[12px] text-[#e31837] flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      {uploadError}
                    </span>
                  )}

                  {uploadSuccess && (
                    <span className="text-[12px] text-[#16a34a] flex items-center gap-1 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      {uploadSuccess}
                    </span>
                  )}
                </div>

                {/* Direct Image URL input & Preview */}
                <div className="flex gap-2.5 items-center">
                  <input
                    type="url"
                    required
                    placeholder="https://res.cloudinary.com/... hoặc link ảnh bất kỳ"
                    value={formImage}
                    onChange={(e) => setFormImage(e.target.value)}
                    className="flex-1 h-10 px-3.5 bg-white border border-[#dddddd] rounded-[6px] text-[13px] text-[#181d26] focus:outline-none focus:border-[#e31837]"
                  />
                  {formImage && (
                    <div className="w-10 h-10 aspect-square rounded-[6px] border border-[#dddddd] overflow-hidden shrink-0 bg-[#f8fafc]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={formImage}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-medium text-[#181d26]">Mô tả món ăn</label>
                <textarea
                  rows={3}
                  placeholder="Nguyên liệu, hương vị, khẩu phần..."
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full p-3.5 bg-white border border-[#dddddd] rounded-[6px] text-[13px] text-[#181d26] focus:outline-none focus:border-[#e31837]"
                />
              </div>

              {/* Toppings Management */}
              <div className="space-y-2.5 pt-2 border-t border-[#dddddd]">
                <div className="flex items-center justify-between">
                  <label className="font-medium text-[#181d26]">
                    Tùy chọn Topping / Món ăn kèm
                  </label>
                  <span className="text-[11px] text-[#9297a0]">
                    {formToppings.length} tùy chọn
                  </span>
                </div>

                {/* Toppings Chips List */}
                {formToppings.length > 0 && (
                  <div className="flex flex-wrap gap-2 p-3 bg-[#f8fafc] rounded-[6px] border border-[#dddddd]">
                    {formToppings.map((top) => (
                      <span
                        key={top.id}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] bg-white border border-[#dddddd] text-[12px] font-medium text-[#181d26] shadow-xs"
                      >
                        <span>{top.name}</span>
                        <span className="text-[#e31837] font-semibold">
                          +{formatVND(top.price)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveTopping(top.id)}
                          className="text-[#9297a0] hover:text-[#e31837] ml-0.5 cursor-pointer"
                          title="Xóa topping này"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Add Topping Input Row */}
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    placeholder="Tên topping (ví dụ: Trứng ốp la, Thêm sườn...)"
                    value={newTopName}
                    onChange={(e) => setNewTopName(e.target.value)}
                    className="flex-1 h-9 px-3 bg-white border border-[#dddddd] rounded-[6px] text-[12px] text-[#181d26] focus:outline-none focus:border-[#e31837]"
                  />
                  <input
                    type="number"
                    step={1000}
                    min={0}
                    placeholder="Giá thêm (VNĐ)"
                    value={newTopPrice}
                    onChange={(e) => setNewTopPrice(Number(e.target.value))}
                    className="w-28 h-9 px-2.5 bg-white border border-[#dddddd] rounded-[6px] text-[12px] text-[#181d26] focus:outline-none focus:border-[#e31837]"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomTopping}
                    className="h-9 px-3 bg-[#f8fafc] hover:bg-[#fff1f2] border border-[#dddddd] hover:border-[#e31837] text-[#e31837] text-[12px] font-semibold rounded-[6px] transition cursor-pointer shrink-0"
                  >
                    + Thêm
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-6 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formAvailable}
                    onChange={(e) => setFormAvailable(e.target.checked)}
                    className="accent-[#e31837]"
                  />
                  <span className="font-medium text-[#333840]">Đang phục vụ</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formFeatured}
                    onChange={(e) => setFormFeatured(e.target.checked)}
                    className="accent-[#e31837]"
                  />
                  <span className="font-medium text-[#333840]">Món ăn nổi bật (Trang chủ)</span>
                </label>
              </div>

              <div className="pt-4 border-t border-[#dddddd] flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="h-10 px-4 border border-[#dddddd] text-[#181d26] font-medium rounded-[6px] hover:bg-[#f8fafc] transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="h-10 px-5 bg-[#e31837] hover:bg-[#be0e27] active:bg-[#a60b20] text-white font-medium rounded-[6px] transition shadow-xs cursor-pointer"
                >
                  {isSaving ? 'Đang lưu...' : 'Lưu món ăn'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
