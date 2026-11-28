'use client';

import React, { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import {
  CiCirclePlus as Plus,
  CiEdit as Edit2,
  CiTrash as Trash2,
  CiCircleRemove as X,
  CiSearch as Search,
  CiSaveUp1 as UploadCloud,
  CiRedo as Loader2,
  CiCircleCheck as CheckCircle2,
  CiCircleAlert as AlertCircle,
  CiClock2 as Clock,
  CiSaveDown1 as Download,
  CiReceipt as FileSpreadsheet,
  CiFileOn as FileUp,
  CiUndo as RotateCcw,
} from 'react-icons/ci';
import { Product, Category, ProductTopping } from '@/types';
import { formatVND } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useAdminBranch } from '@/context/AdminBranchContext';

export default function AdminProductsPage() {
  const { isAdmin } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter & Sorting State
  const { adminBranch } = useAdminBranch();
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<number | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'out_of_stock' | 'featured'>('all');
  const [sortOrder, setSortOrder] = useState<'default' | 'price_asc' | 'price_desc' | 'name_asc'>('default');

  // Excel Import State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [parsedImportData, setParsedImportData] = useState<any[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importFileName, setImportFileName] = useState('');
  const [importStatusMessage, setImportStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formCategoryId, setFormCategoryId] = useState<number>(1);
  const [formBranchId, setFormBranchId] = useState<number | null>(null);
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
    setFormBranchId(adminBranch === 'all' ? null : Number(adminBranch));
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
    setFormBranchId(p.branchId !== undefined && p.branchId !== null ? Number(p.branchId) : null);
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
            branchId: formBranchId,
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
            branchId: formBranchId,
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

  const handleExportExcel = () => {
    try {
      const dataToExport = filtered.map((p) => {
        const cat = categories.find((c) => c.id === p.categoryId);
        return {
          'Mã món (ID)': p.id,
          'Tên món ăn': p.name,
          'Danh mục': cat?.name || p.categoryName || 'Khác',
          'Giá bán (VNĐ)': p.price,
          'Thời gian chế biến (phút)': p.prepTime || 15,
          'Còn hàng': p.isAvailable ? 'Có' : 'Không',
          'Món nổi bật': p.isFeatured ? 'Có' : 'Không',
          'Đánh giá': p.rating || 5.0,
          'Mô tả': p.description || '',
          'Link ảnh': p.image || '',
        };
      });

      const ws = XLSX.utils.json_to_sheet(dataToExport);
      ws['!cols'] = [
        { wch: 10 },
        { wch: 30 },
        { wch: 20 },
        { wch: 15 },
        { wch: 15 },
        { wch: 12 },
        { wch: 12 },
        { wch: 10 },
        { wch: 40 },
        { wch: 40 },
      ];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Thực đơn NooNee');
      const dateStr = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(wb, `NooNee_ThucDon_${dateStr}.xlsx`);
    } catch (err) {
      console.error('Export error:', err);
      alert('Không thể xuất file Excel. Vui lòng thử lại!');
    }
  };

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'Tên món ăn': 'Cơm tấm sườn bì chả đặc biệt',
        'Danh mục': 'Cơm',
        'Giá bán': 55000,
        'Thời gian chế biến': 15,
        'Còn hàng': 'Có',
        'Nổi bật': 'Có',
        'Mô tả': 'Sườn cốt lết nướng than hoa đậm đà, chả trứng bùi béo và bì heo giòn thơm',
        'Link ảnh': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
      },
      {
        'Tên món ăn': 'Phở bò tái nạm gia truyền',
        'Danh mục': 'Bún & Phở',
        'Giá bán': 50000,
        'Thời gian chế biến': 12,
        'Còn hàng': 'Có',
        'Nổi bật': 'Có',
        'Mô tả': 'Nước hầm xương ống bò 18 tiếng ngọt thanh, nạm giòn sần sật',
        'Link ảnh': 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?auto=format&fit=crop&w=800&q=80',
      },
      {
        'Tên món ăn': 'Trà đào cam sả thanh nhiệt',
        'Danh mục': 'Đồ uống',
        'Giá bán': 35000,
        'Thời gian chế biến': 5,
        'Còn hàng': 'Có',
        'Nổi bật': 'Không',
        'Mô tả': 'Trà đào thơm nức hòa quyện sả tươi và cam vàng mọng nước',
        'Link ảnh': 'https://images.unsplash.com/photo-1558857563-b371033873b8?auto=format&fit=crop&w=800&q=80',
      },
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    ws['!cols'] = [
      { wch: 30 },
      { wch: 18 },
      { wch: 15 },
      { wch: 18 },
      { wch: 12 },
      { wch: 12 },
      { wch: 40 },
      { wch: 40 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Mau_Nhap_Mon');
    XLSX.writeFile(wb, 'Mau_Nhap_Mon_NooNee.xlsx');
  };

  const handleFileImportChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFileName(file.name);
    setImportStatusMessage(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rawJson: any[] = XLSX.utils.sheet_to_json(ws);

        if (!rawJson || rawJson.length === 0) {
          setImportStatusMessage({ type: 'error', text: 'File Excel không có dữ liệu dòng nào.' });
          setParsedImportData([]);
          return;
        }

        setParsedImportData(rawJson);
      } catch (err: any) {
        setImportStatusMessage({ type: 'error', text: 'Không thể đọc file: ' + err.message });
        setParsedImportData([]);
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  const handleConfirmImport = async () => {
    if (parsedImportData.length === 0) return;
    setIsImporting(true);
    setImportStatusMessage(null);

    try {
      const res = await fetch('/api/admin/products/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products: parsedImportData }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Nhập file thất bại');
      }

      setImportStatusMessage({
        type: 'success',
        text: `Đã nhập thành công ${data.count}/${parsedImportData.length} món ăn vào thực đơn!`,
      });
      fetchData();
      setTimeout(() => {
        setIsImportModalOpen(false);
        setParsedImportData([]);
        setImportFileName('');
        setImportStatusMessage(null);
      }, 1500);
    } catch (err: any) {
      setImportStatusMessage({ type: 'error', text: err.message || 'Lỗi khi nhập món ăn' });
    } finally {
      setIsImporting(false);
    }
  };

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const filtered = products
    .filter((p) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesDesc = p.description && p.description.toLowerCase().includes(q);
        if (!matchesName && !matchesDesc) return false;
      }
      if (selectedCategoryFilter !== 'all' && p.categoryId !== selectedCategoryFilter) {
        return false;
      }
      if (adminBranch === '1' && p.branchId === 2) return false;
      if (adminBranch === '2' && p.branchId === 1) return false;
      if (statusFilter === 'available' && !p.isAvailable) return false;
      if (statusFilter === 'out_of_stock' && p.isAvailable) return false;
      if (statusFilter === 'featured' && !p.isFeatured) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortOrder === 'price_asc') return a.price - b.price;
      if (sortOrder === 'price_desc') return b.price - a.price;
      if (sortOrder === 'name_asc') return a.name.localeCompare(b.name, 'vi');
      return 0;
    });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-normal text-[#181d26]">Thực đơn & Món ăn</h1>
          <p className="text-[13px] sm:text-[14px] text-[#41454d] mt-0.5 sm:mt-1">
            Tổng cộng {filtered.length} món ăn đang hiển thị
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          {/* Export Excel Button */}
          <button
            type="button"
            onClick={handleExportExcel}
            className="h-9 sm:h-10 px-3 sm:px-3.5 bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-300 hover:border-emerald-500 font-medium text-[12px] sm:text-[13px] rounded-[6px] flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
            title="Xuất toàn bộ hoặc kết quả lọc ra file Excel (.xlsx)"
          >
            <Download className="w-4 h-4" />
            <span>Xuất Excel</span>
          </button>

          {/* Import Excel Button (Super Admin only) */}
          {isAdmin && (
            <button
              type="button"
              onClick={() => {
                setParsedImportData([]);
                setImportFileName('');
                setImportStatusMessage(null);
                setIsImportModalOpen(true);
              }}
              className="h-9 sm:h-10 px-3 sm:px-3.5 bg-white hover:bg-blue-50 text-blue-700 border border-blue-300 hover:border-blue-500 font-medium text-[12px] sm:text-[13px] rounded-[6px] flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
              title="Tải lên file Excel (.xlsx / .csv) để nhập món ăn hàng loạt"
            >
              <FileUp className="w-4 h-4" />
              <span>Nhập Excel</span>
            </button>
          )}

          {/* Add Product Button */}
          <button
            onClick={openAddModal}
            className="h-9 sm:h-10 px-3.5 sm:px-4 bg-[#A30029] hover:bg-[#850021] active:bg-[#a60b20] text-white font-medium text-[12px] sm:text-[13px] rounded-[6px] flex items-center gap-1.5 transition shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm món mới</span>
          </button>
        </div>
      </div>

      {/* Advanced Search & Filter Bar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-[10px] border border-[#dddddd] space-y-3 shadow-2xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 sm:gap-3">
          {/* Search Input */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 text-[#9297a0] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Tìm món theo tên hoặc mô tả..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full h-10 pl-10 pr-9 text-[13px] bg-white border border-[#dddddd] rounded-[6px] focus:outline-none focus:border-[#A30029] text-[#181d26]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setCurrentPage(1);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition cursor-pointer"
                title="Xóa tìm kiếm"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategoryFilter}
              onChange={(e) => {
                setSelectedCategoryFilter(e.target.value === 'all' ? 'all' : Number(e.target.value));
                setCurrentPage(1);
              }}
              className="w-full h-10 px-3 text-[13px] bg-white border border-[#dddddd] rounded-[6px] text-[#181d26] focus:outline-none focus:border-[#A30029] cursor-pointer"
            >
              <option value="all">Tất cả danh mục ({products.length})</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="w-full h-10 px-3 text-[13px] bg-white border border-[#dddddd] rounded-[6px] text-[#181d26] focus:outline-none focus:border-[#A30029] cursor-pointer"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="available">Đang phục vụ</option>
              <option value="out_of_stock">Tạm hết hàng</option>
              <option value="featured">Món nổi bật</option>
            </select>
          </div>

          {/* Sort Filter */}
          <div>
            <select
              value={sortOrder}
              onChange={(e) => {
                setSortOrder(e.target.value as any);
                setCurrentPage(1);
              }}
              className="w-full h-10 px-3 text-[13px] bg-white border border-[#dddddd] rounded-[6px] text-[#181d26] focus:outline-none focus:border-[#A30029] cursor-pointer"
            >
              <option value="default">Sắp xếp: Mặc định</option>
              <option value="price_asc">Giá: Thấp đến cao</option>
              <option value="price_desc">Giá: Cao đến thấp</option>
              <option value="name_asc">Tên: A - Z</option>
            </select>
          </div>
        </div>

        {/* Filter status summary & Reset button */}
        {(searchQuery || selectedCategoryFilter !== 'all' || statusFilter !== 'all' || sortOrder !== 'default') && (
          <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[12px] text-gray-500">
            <span>
              Tìm thấy <strong className="text-[#A30029] font-bold">{filtered.length}</strong> món phù hợp với bộ lọc
            </span>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategoryFilter('all');
                setStatusFilter('all');
                setSortOrder('default');
                setCurrentPage(1);
              }}
              className="inline-flex items-center gap-1 text-[#A30029] hover:underline font-semibold cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Đặt lại bộ lọc</span>
            </button>
          </div>
        )}
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-[10px] border border-[#dddddd] overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-[13px] text-[#41454d] flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-[#A30029]" />
            <span>Đang tải danh sách món ăn...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-[13px] text-[#41454d]">Không tìm thấy món ăn nào.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px] min-w-[700px]">
              <thead className="bg-[#f8fafc] border-b border-[#dddddd] text-[#9297a0] font-medium uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Món ăn</th>
                  <th className="py-3 px-4">Danh mục</th>
                  {adminBranch === 'all' && <th className="py-3 px-4">Cơ sở phục vụ</th>}
                  <th className="py-3 px-4">Đơn giá</th>
                  <th className="py-3 px-4">Nổi bật</th>
                  <th className="py-3 px-4">Trạng thái bán</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#dddddd]">
                {paginated.map((p) => (
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
                        <Clock className="w-3 h-3 text-[#A30029]" />
                        <span>{p.prepTime || 15} phút</span>
                      </div>
                    </td>
                    {adminBranch === 'all' && (
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {p.branchId === 1 ? (
                          <span className="px-2 py-0.5 rounded-[4px] bg-[#f8fafc] text-[#333840] border border-[#dddddd] text-[11px] font-medium">
                            120 Yên Lãng
                          </span>
                        ) : p.branchId === 2 ? (
                          <span className="px-2 py-0.5 rounded-[4px] bg-[#f8fafc] text-[#333840] border border-[#dddddd] text-[11px] font-medium">
                            269 Cầu Giấy
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-[4px] bg-[#f8fafc] text-[#333840] border border-[#dddddd] text-[11px] font-medium">
                            Cả 2 cơ sở
                          </span>
                        )}
                      </td>
                    )}
                    <td className="py-3.5 px-4 font-semibold text-[#181d26]">
                      {formatVND(p.price)}
                    </td>
                    <td className="py-3.5 px-4">
                      {p.isFeatured ? (
                        <div className="space-y-0.5">
                          <span className="inline-block px-2 py-0.5 rounded-[4px] text-[11px] font-medium bg-[#fff1f2] text-[#A30029] border border-[#fecdd3]">
                            Nổi bật
                          </span>
                          <div className="text-[11px] text-[#41454d] font-medium">
                            Đã bán: {p.soldCount || 0}
                          </div>
                        </div>
                      ) : (
                        <span className="text-[#9297a0] text-[12px]">
                          {p.soldCount ? `Đã bán: ${p.soldCount}` : 'Chưa có lượt mua'}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => handleToggleAvailable(p)}
                        className={`h-7 px-2.5 rounded-[4px] text-[11px] font-medium transition border ${
                          p.isAvailable
                            ? 'bg-white text-[#006400] border-[#39bf45] hover:bg-[#f8fafc]'
                            : 'bg-[#fff1f2] text-[#A30029] border-[#fecdd3] hover:bg-[#ffe4e6]'
                        }`}
                      >
                        {p.isAvailable ? 'Đang phục vụ' : 'Tạm hết'}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => openEditModal(p)}
                        className="p-1.5 text-[#41454d] hover:text-[#181d26] hover:bg-[#f8fafc] rounded-[4px] transition border border-[#dddddd] cursor-pointer"
                        title="Chỉnh sửa món"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      {isAdmin && (
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="p-1.5 text-[#A30029] hover:bg-[#fff1f2] rounded-[4px] transition border border-[#dddddd] cursor-pointer"
                          title="Xóa món"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination Controls (STT 16) */}
            {filtered.length > 0 && (
              <div className="px-6 py-4 border-t border-[#dddddd] bg-[#f8fafc] flex flex-col sm:flex-row items-center justify-between gap-3 text-[13px] text-[#41454d]">
                <div>
                  Hiển thị <strong>{Math.min((currentPage - 1) * pageSize + 1, filtered.length)}</strong> - <strong>{Math.min(currentPage * pageSize, filtered.length)}</strong> trên tổng số <strong>{filtered.length}</strong> món ăn
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 bg-white border border-[#dddddd] rounded-lg text-xs font-semibold hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                  >
                    Trước
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                    .map((page, idx, arr) => {
                      const prevPage = arr[idx - 1];
                      return (
                        <React.Fragment key={page}>
                          {prevPage && page - prevPage > 1 && <span className="px-1 text-[#9297a0]">...</span>}
                          <button
                            onClick={() => setCurrentPage(page)}
                            className={`w-8 h-8 rounded-lg text-xs font-semibold transition cursor-pointer ${
                              currentPage === page
                                ? 'bg-[#A30029] text-white'
                                : 'bg-white border border-[#dddddd] text-[#181d26] hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        </React.Fragment>
                      );
                    })}
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 bg-white border border-[#dddddd] rounded-lg text-xs font-semibold hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                  >
                    Sau
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal Add / Edit Product */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-[#181d26]/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-[12px] max-w-lg w-full p-4 sm:p-8 max-h-[92vh] overflow-y-auto shadow-xl border border-[#dddddd] space-y-4">
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
                  className="w-full h-10 px-3.5 bg-white border border-[#dddddd] rounded-[6px] text-[13px] text-[#181d26] focus:outline-none focus:border-[#A30029]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-medium text-[#181d26]">Danh mục *</label>
                  <select
                    value={formCategoryId}
                    onChange={(e) => setFormCategoryId(Number(e.target.value))}
                    className="w-full h-10 px-3 bg-white border border-[#dddddd] rounded-[6px] text-[13px] text-[#181d26] focus:outline-none focus:border-[#A30029]"
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
                    className="w-full h-10 px-3.5 bg-white border border-[#dddddd] rounded-[6px] text-[13px] text-[#181d26] focus:outline-none focus:border-[#A30029]"
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
                    className="w-full h-10 px-3.5 bg-white border border-[#dddddd] rounded-[6px] text-[13px] text-[#181d26] focus:outline-none focus:border-[#A30029]"
                  />
                </div>
              </div>

              {/* Branch Assignment Field as Dropdown (Locked for Branch Manager) */}
              {isAdmin && (
                <div className="space-y-1">
                  <label className="font-medium text-[#181d26]">Cơ sở phục vụ</label>
                  <select
                    value={formBranchId === null ? '' : formBranchId}
                    onChange={(e) => setFormBranchId(e.target.value === '' ? null : Number(e.target.value))}
                    className="w-full h-10 px-3 bg-white border border-[#dddddd] rounded-[6px] text-[13px] text-[#181d26] focus:outline-none focus:border-[#A30029]"
                  >
                    <option value="">Cả 2 cơ sở</option>
                    <option value="1">Cơ sở 1: 120 Yên Lãng</option>
                    <option value="2">Cơ sở 2: 269 Cầu Giấy</option>
                  </select>
                </div>
              )}

              {/* Image Upload & URL input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-medium text-[#181d26]">Hình ảnh món ăn *</label>
                  <span className="text-[11px] text-[#9297a0]">Tải ảnh lên Cloudinary hoặc dán URL</span>
                </div>

                {/* Upload Button Box */}
                <div className="flex flex-wrap gap-2.5 items-center">
                  <label className="cursor-pointer inline-flex items-center gap-2 px-3.5 py-2 bg-[#f8fafc] hover:bg-[#fff1f2] border border-[#dddddd] hover:border-[#A30029] text-[#181d26] rounded-[6px] text-[12px] font-medium transition shadow-xs">
                    {isUploading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-[#A30029]" />
                        <span>Đang tải lên Cloudinary...</span>
                      </>
                    ) : (
                      <>
                        <UploadCloud className="w-4 h-4 text-[#A30029]" />
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
                    <span className="text-[12px] text-[#A30029] flex items-center gap-1">
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
                    className="flex-1 h-10 px-3.5 bg-white border border-[#dddddd] rounded-[6px] text-[13px] text-[#181d26] focus:outline-none focus:border-[#A30029]"
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
                  className="w-full p-3.5 bg-white border border-[#dddddd] rounded-[6px] text-[13px] text-[#181d26] focus:outline-none focus:border-[#A30029]"
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
                        <span className="text-[#A30029] font-semibold">
                          +{formatVND(top.price)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveTopping(top.id)}
                          className="text-[#9297a0] hover:text-[#A30029] ml-0.5 cursor-pointer"
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
                    className="flex-1 h-9 px-3 bg-white border border-[#dddddd] rounded-[6px] text-[12px] text-[#181d26] focus:outline-none focus:border-[#A30029]"
                  />
                  <input
                    type="number"
                    step={1000}
                    min={0}
                    placeholder="Giá thêm (VNĐ)"
                    value={newTopPrice}
                    onChange={(e) => setNewTopPrice(Number(e.target.value))}
                    className="w-28 h-9 px-2.5 bg-white border border-[#dddddd] rounded-[6px] text-[12px] text-[#181d26] focus:outline-none focus:border-[#A30029]"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomTopping}
                    className="h-9 px-3 bg-[#f8fafc] hover:bg-[#fff1f2] border border-[#dddddd] hover:border-[#A30029] text-[#A30029] text-[12px] font-semibold rounded-[6px] transition cursor-pointer shrink-0"
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
                    className="accent-[#A30029]"
                  />
                  <span className="font-medium text-[#333840]">Đang phục vụ</span>
                </label>

                <span className="text-[12px] text-[#64748b] italic">
                  * Nhãn &ldquo;Nổi bật&rdquo; được tự động xét theo Top món có lượt mua thực tế cao nhất
                </span>
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
                  className="h-10 px-5 bg-[#A30029] hover:bg-[#850021] active:bg-[#a60b20] text-white font-medium rounded-[6px] transition shadow-xs cursor-pointer"
                >
                  {isSaving ? 'Đang lưu...' : 'Lưu món ăn'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Nhập Sản Phẩm từ Excel / CSV */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-[#181d26]/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-[12px] max-w-2xl w-full p-5 sm:p-7 max-h-[92vh] overflow-y-auto shadow-2xl border border-[#dddddd] space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#dddddd]">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <h2 className="text-lg font-bold text-[#181d26]">Nhập món ăn từ file Excel / CSV</h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsImportModalOpen(false);
                  setParsedImportData([]);
                  setImportFileName('');
                  setImportStatusMessage(null);
                }}
                className="p-1.5 text-[#9297a0] hover:text-[#181d26] rounded-[6px] hover:bg-gray-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Instruction & Download Template */}
            <div className="bg-emerald-50/60 border border-emerald-200 p-3.5 rounded-[8px] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[13px]">
              <div>
                <p className="font-semibold text-emerald-900">Mẹo nhập dữ liệu chuẩn:</p>
                <p className="text-emerald-700 text-[12px] mt-0.5">
                  Tải file mẫu để xem các cột: Tên món ăn, Danh mục, Giá bán, Mô tả, Link ảnh...
                </p>
              </div>
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-[6px] text-[12px] font-bold shrink-0 transition cursor-pointer shadow-2xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Tải file Excel mẫu</span>
              </button>
            </div>

            {/* Upload Box */}
            <div className="border-2 border-dashed border-gray-300 hover:border-[#A30029] rounded-[10px] p-6 text-center transition bg-gray-50/50 relative">
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileImportChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center justify-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-red-50 text-[#A30029] flex items-center justify-center">
                  <FileUp className="w-6 h-6" />
                </div>
                <div className="text-[14px] font-medium text-[#181d26]">
                  {importFileName ? (
                    <span className="text-emerald-600 font-bold">Đã chọn: {importFileName}</span>
                  ) : (
                    <span>Kéo thả hoặc bấm để chọn file .xlsx, .xls, .csv</span>
                  )}
                </div>
                <p className="text-[12px] text-gray-500">Hỗ trợ file Excel bảng tính (.xlsx) hoặc tệp CSV</p>
              </div>
            </div>

            {/* Status Message */}
            {importStatusMessage && (
              <div
                className={`p-3 rounded-[6px] text-[13px] flex items-center gap-2 ${
                  importStatusMessage.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {importStatusMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{importStatusMessage.text}</span>
              </div>
            )}

            {/* Preview Table */}
            {parsedImportData.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[13px]">
                  <span className="font-semibold text-[#181d26]">
                    Xem trước dữ liệu ({parsedImportData.length} món ăn):
                  </span>
                  <span className="text-xs text-gray-500">Hiển thị tối đa 5 dòng đầu</span>
                </div>
                <div className="border border-gray-200 rounded-lg overflow-x-auto max-h-48 text-[12px]">
                  <table className="w-full text-left">
                    <thead className="bg-gray-100 text-gray-700 font-semibold border-b border-gray-200 sticky top-0">
                      <tr>
                        <th className="p-2">STT</th>
                        <th className="p-2">Tên món</th>
                        <th className="p-2">Danh mục</th>
                        <th className="p-2">Giá bán</th>
                        <th className="p-2">Mô tả</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {parsedImportData.slice(0, 5).map((row, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="p-2 text-gray-500">{idx + 1}</td>
                          <td className="p-2 font-medium text-gray-900">
                            {row['Tên món ăn'] || row['Tên món'] || row.name || '---'}
                          </td>
                          <td className="p-2 text-gray-600">
                            {row['Danh mục'] || row['Tên danh mục'] || row.categoryName || '---'}
                          </td>
                          <td className="p-2 font-bold text-[#A30029]">
                            {formatVND(Number(row['Giá bán'] || row['Đơn giá'] || row.price || 0))}
                          </td>
                          <td className="p-2 text-gray-500 truncate max-w-xs">
                            {row['Mô tả'] || row.description || '---'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="pt-3 border-t border-[#dddddd] flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setIsImportModalOpen(false);
                  setParsedImportData([]);
                  setImportFileName('');
                  setImportStatusMessage(null);
                }}
                className="h-10 px-4 border border-[#dddddd] text-[#181d26] font-medium rounded-[6px] hover:bg-[#f8fafc] transition cursor-pointer text-[13px]"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={parsedImportData.length === 0 || isImporting}
                onClick={handleConfirmImport}
                className="h-10 px-5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 text-white font-semibold rounded-[6px] transition shadow-xs cursor-pointer flex items-center gap-1.5 text-[13px]"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang nhập dữ liệu...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Xác nhận nhập ({parsedImportData.length}) món</span>
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
