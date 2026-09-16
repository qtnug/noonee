'use client';

import React, { useEffect, useState } from 'react';
import { Plus, FolderPlus } from 'lucide-react';
import { Category } from '@/types';

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      if (data.success) {
        setCategories(data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setName('');
        setDescription('');
        fetchCategories();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-normal text-[#181d26]">Danh mục món ăn</h1>
        <p className="text-[14px] text-[#41454d] mt-1">
          Phân chia nhóm món ăn (Cơm món chính, Bánh mì ăn nhanh, Đồ uống giải khát...)
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Form: Add Category */}
        <div className="lg:col-span-5 bg-white p-6 rounded-[10px] border border-[#dddddd] space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[#dddddd]">
            <FolderPlus className="w-5 h-5 text-[#e31837]" />
            <h2 className="text-[15px] font-medium text-[#181d26]">Thêm danh mục mới</h2>
          </div>

          <form onSubmit={handleAddCategory} className="space-y-4 text-[13px]">
            <div className="space-y-1.5">
              <label className="font-medium text-[#181d26]">Tên danh mục *</label>
              <input
                type="text"
                required
                placeholder="Ví dụ: Món Ăn Tráng Miệng"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-10 px-3.5 bg-white border border-[#dddddd] rounded-[6px] text-[13px] text-[#181d26] focus:outline-none focus:border-[#e31837]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-medium text-[#181d26]">Mô tả ngắn</label>
              <textarea
                rows={3}
                placeholder="Mô tả nhóm món ăn..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-3.5 bg-white border border-[#dddddd] rounded-[6px] text-[13px] text-[#181d26] focus:outline-none focus:border-[#e31837]"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-10 bg-[#e31837] hover:bg-[#be0e27] active:bg-[#a60b20] text-white font-medium rounded-[6px] transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{isSubmitting ? 'Đang thêm...' : 'Tạo danh mục mới'}</span>
            </button>
          </form>
        </div>

        {/* Right Table: Categories */}
        <div className="lg:col-span-7 bg-white rounded-[10px] border border-[#dddddd] overflow-hidden">
          <div className="p-4 border-b border-[#dddddd] font-medium text-[14px] text-[#181d26]">
            Danh sách hiện có ({categories.length} danh mục)
          </div>

          {loading ? (
            <div className="p-12 text-center text-[13px] text-[#9297a0]">Đang tải...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13px]">
                <thead className="bg-[#f8fafc] border-b border-[#dddddd] text-[#9297a0] font-medium uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Tên danh mục</th>
                    <th className="py-3 px-4">Slug URL</th>
                    <th className="py-3 px-4">Mô tả</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#dddddd]">
                  {categories.map((c) => (
                    <tr key={c.id} className="hover:bg-[#f8fafc] transition">
                      <td className="py-3.5 px-4 font-medium text-[#181d26]">{c.name}</td>
                      <td className="py-3.5 px-4 font-mono text-[#9297a0] text-[12px]">{c.slug}</td>
                      <td className="py-3.5 px-4 text-[#41454d] text-[12px] max-w-xs truncate">
                        {c.description || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
