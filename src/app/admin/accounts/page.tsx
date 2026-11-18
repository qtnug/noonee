'use client';

import React, { useEffect, useState } from 'react';
import {
  CiCirclePlus as Plus,
  CiEdit as Edit2,
  CiTrash as Trash2,
  CiSearch as Search,
  CiRedo as Loader2,
  CiCircleCheck as CheckCircle2,
  CiCircleAlert as AlertCircle,
  CiLock as Lock,
  CiUnlock as Unlock,
  CiCircleRemove as X,
  CiRead as Eye,
} from 'react-icons/ci';
import { User } from '@/types';
import { formatDate } from '@/lib/utils';
import { useAdminBranch } from '@/context/AdminBranchContext';

export default function AdminAccountsPage() {
  const { adminBranch } = useAdminBranch();
  const [accounts, setAccounts] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'manager' | 'staff'>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Add / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formFullName, setFormFullName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formRole, setFormRole] = useState<'manager' | 'staff'>('staff');
  const [formBranchId, setFormBranchId] = useState<number>(1);
  const [formIsActive, setFormIsActive] = useState(true);
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Delete Confirmation Modal State
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const fetchAccounts = async () => {
    try {
      const res = await fetch('/api/admin/users', { cache: 'no-store' });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setAccounts(data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const openCreateModal = () => {
    setEditingUser(null);
    setFormUsername('');
    setFormPassword('');
    setShowPassword(false);
    setFormFullName('');
    setFormPhone('');
    setFormRole('staff');
    setFormBranchId(adminBranch === '2' ? 2 : 1);
    setFormIsActive(true);
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (u: User) => {
    setEditingUser(u);
    setFormUsername(u.username);
    setFormPassword('');
    setShowPassword(false);
    setFormFullName(u.fullName || '');
    setFormPhone(u.phone || '');
    setFormRole(u.role === 'manager' ? 'manager' : 'staff');
    setFormBranchId(u.branchId === 2 ? 2 : 1);
    setFormIsActive(u.isActive !== false);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setIsSaving(true);

    try {
      if (editingUser) {
        const res = await fetch(`/api/admin/users/${editingUser.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fullName: formFullName.trim(),
            phone: formPhone.trim(),
            role: editingUser.role === 'admin' ? undefined : formRole,
            branchId: editingUser.role === 'admin' ? undefined : formBranchId,
            isActive: editingUser.role === 'admin' ? undefined : formIsActive,
            password: formPassword.trim() ? formPassword.trim() : undefined,
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.message || 'Không thể cập nhật tài khoản');
        }
        showToast(`Đã cập nhật tài khoản "${editingUser.username}"`);
      } else {
        const res = await fetch('/api/admin/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: formUsername.trim().toLowerCase(),
            password: formPassword,
            fullName: formFullName.trim(),
            phone: formPhone.trim(),
            role: formRole,
            branchId: formBranchId,
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.message || 'Không thể mở tài khoản mới');
        }
        showToast(`Đã mở tài khoản "${formUsername.trim().toLowerCase()}" thành công`);
      }

      setIsModalOpen(false);
      fetchAccounts();
    } catch (err: any) {
      setFormError(err.message || 'Có lỗi xảy ra');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (u: User) => {
    if (u.role === 'admin') return;
    const nextActive = u.isActive === false;
    try {
      const res = await fetch(`/api/admin/users/${u.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: nextActive }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(
          nextActive
            ? `Đã mở hoạt động tài khoản "${u.username}"`
            : `Đã tạm khóa tài khoản "${u.username}"`
        );
        fetchAccounts();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingUser) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/users/${deletingUser.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Đã xóa tài khoản "${deletingUser.username}"`);
        setDeletingUser(null);
        fetchAccounts();
      } else {
        alert(data.message || 'Không thể xóa tài khoản');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredAccounts = accounts.filter((u) => {
    // Isolate by top header branch dropdown
    if (adminBranch === '1') {
      if (u.role === 'admin' || u.branchId !== 1) return false;
    } else if (adminBranch === '2') {
      if (u.role === 'admin' || u.branchId !== 2) return false;
    }

    if (roleFilter !== 'all' && u.role !== roleFilter) {
      return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchUser = u.username.toLowerCase().includes(q);
      const matchName = (u.fullName || '').toLowerCase().includes(q);
      const matchPhone = (u.phone || '').toLowerCase().includes(q);
      if (!matchUser && !matchName && !matchPhone) return false;
    }

    return true;
  });

  const staffCount = filteredAccounts.filter((u) => u.role === 'staff').length;
  const managerCount = filteredAccounts.filter((u) => u.role === 'manager').length;

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-normal text-[#181d26]">Quản lý tài khoản nhân sự</h1>
          <p className="text-[13px] sm:text-[14px] text-[#41454d] mt-0.5 sm:mt-1">
            Phân quyền tài khoản Quản lý ({managerCount}) và Nhân viên ({staffCount})
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="h-9 sm:h-10 px-3.5 sm:px-4 bg-[#A30029] hover:bg-[#850021] active:bg-[#6e001b] text-white font-medium text-[12px] sm:text-[13px] rounded-[6px] flex items-center gap-1.5 transition shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Mở tài khoản mới</span>
        </button>
      </div>

      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#181d26] text-white px-4 py-3 rounded-[8px] shadow-lg flex items-center gap-2.5 text-[13px] animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-[#39bf45]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Search & Role Filter Bar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-[10px] border border-[#dddddd] flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#9297a0] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Tìm theo tài khoản, họ tên, SĐT..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-4 text-[13px] bg-white border border-[#dddddd] rounded-[6px] focus:outline-none focus:border-[#A30029] text-[#181d26]"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {[
            { key: 'all', label: 'Tất cả vai trò' },
            { key: 'manager', label: 'Quản lý cơ sở' },
            { key: 'staff', label: 'Nhân viên' },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setRoleFilter(tab.key as any)}
              className={`h-9 px-3.5 rounded-[6px] text-[12px] font-medium transition border cursor-pointer whitespace-nowrap ${
                roleFilter === tab.key
                  ? 'bg-[#A30029] text-white border-[#A30029]'
                  : 'bg-white text-[#41454d] border-[#dddddd] hover:bg-[#f8fafc]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Accounts Table */}
      <div className="bg-white rounded-[10px] border border-[#dddddd] overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-[13px] text-[#41454d] flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-[#A30029]" />
            <span>Đang tải danh sách tài khoản...</span>
          </div>
        ) : filteredAccounts.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <p className="text-[13px] text-[#41454d]">
              Chưa có tài khoản nhân viên hoặc quản lý nào trong danh sách này.
            </p>
            <button
              type="button"
              onClick={openCreateModal}
              className="px-4 py-2 bg-[#A30029] hover:bg-[#850021] text-white text-[13px] font-medium rounded-[6px] transition cursor-pointer"
            >
              + Mở tài khoản đầu tiên
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px] min-w-[760px]">
              <thead className="bg-[#f8fafc] border-b border-[#dddddd] text-[#9297a0] font-medium uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Tài khoản</th>
                  <th className="py-3 px-4">Họ tên &amp; Liên hệ</th>
                  <th className="py-3 px-4">Phân quyền</th>
                  {adminBranch === 'all' && <th className="py-3 px-4">Cơ sở làm việc</th>}
                  <th className="py-3 px-4">Trạng thái</th>
                  <th className="py-3 px-4">Ngày tạo</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#dddddd]">
                {filteredAccounts.map((u) => {
                  const isSuperAdmin = u.role === 'admin';
                  const isActive = u.isActive !== false;
                  return (
                    <tr key={u.id} className="hover:bg-[#f8fafc] transition">
                      <td className="py-3.5 px-4 font-mono font-semibold text-[#181d26]">
                        {u.username}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-[#181d26]">{u.fullName}</div>
                        {u.phone ? (
                          <div className="text-[12px] text-[#9297a0]">{u.phone}</div>
                        ) : (
                          <div className="text-[11px] text-[#9297a0] italic">Chưa cập nhật SĐT</div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {u.role === 'admin' ? (
                          <span className="px-2.5 py-0.5 rounded-[4px] bg-[#181d26] text-white text-[11px] font-semibold">
                            Tổng quản lý
                          </span>
                        ) : u.role === 'manager' ? (
                          <div>
                            <span className="px-2.5 py-0.5 rounded-[4px] bg-[#fff1f2] text-[#A30029] border border-[#fecdd3] text-[11px] font-semibold">
                              Quản lý
                            </span>
                            <span className="block text-[11px] text-[#9297a0] mt-0.5">
                              Doanh thu ngày • Thực đơn • Đơn hàng
                            </span>
                          </div>
                        ) : (
                          <div>
                            <span className="px-2.5 py-0.5 rounded-[4px] bg-[#eff6ff] text-[#2563eb] border border-[#bfdbfe] text-[11px] font-semibold">
                              Nhân viên
                            </span>
                            <span className="block text-[11px] text-[#9297a0] mt-0.5">
                              Chỉ duyệt &amp; xem đơn (che SĐT)
                            </span>
                          </div>
                        )}
                      </td>
                      {adminBranch === 'all' && (
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {isSuperAdmin ? (
                            <span className="text-[12px] font-medium text-[#41454d]">Toàn hệ thống</span>
                          ) : u.branchId === 2 ? (
                            <span className="px-2 py-0.5 rounded-[4px] bg-[#f8fafc] border border-[#dddddd] text-[#333840] text-[11px] font-medium">
                              Cơ sở 2: 269 Cầu Giấy
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-[4px] bg-[#f8fafc] border border-[#dddddd] text-[#333840] text-[11px] font-medium">
                              Cơ sở 1: 120 Yên Lãng
                            </span>
                          )}
                        </td>
                      )}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {isSuperAdmin ? (
                          <span className="px-2.5 py-0.5 rounded-[4px] bg-[#f0fdf4] text-[#16a34a] border border-[#bbf7d0] text-[11px] font-medium">
                            Đang mở
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleToggleActive(u)}
                            className={`h-7 px-2.5 rounded-[4px] text-[11px] font-medium border inline-flex items-center gap-1 transition cursor-pointer ${
                              isActive
                                ? 'bg-[#f0fdf4] text-[#16a34a] border-[#bbf7d0] hover:bg-emerald-100/60'
                                : 'bg-[#fff1f2] text-[#A30029] border-[#fecdd3] hover:bg-rose-100/60'
                            }`}
                            title={isActive ? 'Bấm để tạm khóa tài khoản' : 'Bấm để mở lại tài khoản'}
                          >
                            {isActive ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                            <span>{isActive ? 'Đang mở' : 'Tạm khóa'}</span>
                          </button>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-[12px] text-[#9297a0] whitespace-nowrap">
                        {u.createdAt ? formatDate(u.createdAt) : '—'}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-1.5">
                        <button
                          type="button"
                          onClick={() => openEditModal(u)}
                          className="p-1.5 text-[#41454d] hover:text-[#181d26] hover:bg-[#f8fafc] rounded-[4px] transition border border-[#dddddd] cursor-pointer"
                          title="Chỉnh sửa thông tin / Đặt lại mật khẩu"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {!isSuperAdmin && (
                          <button
                            type="button"
                            onClick={() => setDeletingUser(u)}
                            className="p-1.5 text-[#A30029] hover:bg-[#fff1f2] rounded-[4px] transition border border-[#dddddd] hover:border-[#fecdd3] cursor-pointer"
                            title="Xóa tài khoản"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Account Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-white rounded-[12px] border border-[#dddddd] shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-[#dddddd] flex items-center justify-between bg-[#f8fafc]">
              <h3 className="text-[16px] font-bold text-[#181d26]">
                {editingUser ? `Chỉnh sửa tài khoản: ${editingUser.username}` : 'Mở tài khoản nhân sự mới'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-[#9297a0] hover:text-[#181d26] rounded hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAccount} className="p-5 space-y-4 text-[13px]">
              {formError && (
                <div className="p-3 rounded-[8px] bg-[#fff1f2] border border-[#fecdd3] text-[#A30029] flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="font-medium text-[#181d26] block">Tên đăng nhập *</label>
                  <input
                    type="text"
                    required
                    disabled={Boolean(editingUser)}
                    value={formUsername}
                    onChange={(e) => setFormUsername(e.target.value)}
                    placeholder="vd: nv_yenlang01"
                    className="w-full h-10 px-3 bg-white disabled:bg-gray-100 disabled:text-gray-500 border border-[#dddddd] rounded-[6px] focus:outline-none focus:border-[#A30029] font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-[#181d26] block">
                    {editingUser ? 'Mật khẩu mới (để trống nếu giữ nguyên)' : 'Mật khẩu khởi tạo *'}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required={!editingUser}
                      value={formPassword}
                      onChange={(e) => setFormPassword(e.target.value)}
                      placeholder={editingUser ? '••••••••' : 'Tối thiểu 6 ký tự'}
                      className="w-full h-10 pl-3 pr-9 bg-white border border-[#dddddd] rounded-[6px] focus:outline-none focus:border-[#A30029]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 px-2.5 text-[#9297a0] hover:text-[#181d26] cursor-pointer"
                      title="Hiện / Ẩn mật khẩu"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="font-medium text-[#181d26] block">Họ và tên *</label>
                  <input
                    type="text"
                    required
                    value={formFullName}
                    onChange={(e) => setFormFullName(e.target.value)}
                    placeholder="Nguyễn Văn A"
                    className="w-full h-10 px-3 bg-white border border-[#dddddd] rounded-[6px] focus:outline-none focus:border-[#A30029]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-[#181d26] block">Số điện thoại liên hệ</label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="0987654321"
                    className="w-full h-10 px-3 bg-white border border-[#dddddd] rounded-[6px] focus:outline-none focus:border-[#A30029]"
                  />
                </div>
              </div>

              {editingUser?.role !== 'admin' && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="space-y-1">
                      <label className="font-medium text-[#181d26] block">Phân quyền vai trò *</label>
                      <select
                        value={formRole}
                        onChange={(e) => setFormRole(e.target.value as 'manager' | 'staff')}
                        className="w-full h-10 px-3 bg-white border border-[#dddddd] rounded-[6px] focus:outline-none focus:border-[#A30029] cursor-pointer"
                      >
                        <option value="staff">Nhân viên</option>
                        <option value="manager">Quản lý cơ sở</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="font-medium text-[#181d26] block">Cơ sở làm việc *</label>
                      <select
                        value={formBranchId}
                        onChange={(e) => setFormBranchId(Number(e.target.value))}
                        className="w-full h-10 px-3 bg-white border border-[#dddddd] rounded-[6px] focus:outline-none focus:border-[#A30029] cursor-pointer"
                      >
                        <option value={1}>Cơ sở 1: 120 Yên Lãng</option>
                        <option value={2}>Cơ sở 2: 269 Cầu Giấy</option>
                      </select>
                    </div>
                  </div>

                  {/* Role Permissions Summary Box */}
                  <div className="p-3 rounded-[8px] bg-[#f8fafc] border border-[#dddddd] text-[12px] text-[#41454d] space-y-1">
                    {formRole === 'staff' ? (
                      <>
                        <div className="font-semibold text-[#181d26]">Quyền hạn của Nhân viên:</div>
                        <p>• Chỉ xem và duyệt đơn hàng thuộc cơ sở được phân công.</p>
                        <p>• Chỉ thấy tên và địa chỉ nhận hàng; số điện thoại khách bị che một phần.</p>
                        <p>• Không truy cập được bất kỳ mục nào khác trong trang Admin.</p>
                      </>
                    ) : (
                      <>
                        <div className="font-semibold text-[#181d26]">Quyền hạn của Quản lý cơ sở:</div>
                        <p>• Toàn bộ quyền duyệt và xem đơn hàng tại cơ sở được phân công.</p>
                        <p>• Xem báo cáo doanh thu ngày hôm nay của cơ sở mình.</p>
                        <p>• Thêm món ăn mới và chỉnh sửa món ăn phục vụ tại cơ sở mình.</p>
                      </>
                    )}
                  </div>

                  {editingUser && (
                    <div className="flex items-center justify-between pt-1">
                      <span className="font-medium text-[#181d26]">Trạng thái tài khoản</span>
                      <button
                        type="button"
                        onClick={() => setFormIsActive(!formIsActive)}
                        className={`h-8 px-3 rounded-[6px] text-[12px] font-semibold border transition cursor-pointer ${
                          formIsActive
                            ? 'bg-[#f0fdf4] text-[#16a34a] border-[#bbf7d0]'
                            : 'bg-[#fff1f2] text-[#A30029] border-[#fecdd3]'
                        }`}
                      >
                        {formIsActive ? 'Đang mở hoạt động' : 'Đang tạm khóa'}
                      </button>
                    </div>
                  )}
                </>
              )}

              <div className="pt-3 border-t border-[#dddddd] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="h-10 px-4 bg-white border border-[#dddddd] hover:bg-gray-50 text-[#41454d] font-medium rounded-[6px] transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="h-10 px-5 bg-[#A30029] hover:bg-[#850021] text-white font-semibold rounded-[6px] transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{editingUser ? 'Lưu thay đổi' : 'Mở tài khoản'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingUser && (
        <div
          className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setDeletingUser(null)}
        >
          <div
            className="bg-white rounded-[12px] border border-[#dddddd] shadow-2xl w-full max-w-md p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-1">
              <h3 className="text-[16px] font-bold text-[#181d26]">Xác nhận xóa tài khoản</h3>
              <p className="text-[13px] text-[#41454d]">
                Bạn có chắc chắn muốn xóa tài khoản <strong>{deletingUser.username}</strong> ({deletingUser.fullName}) không? Hành động này không thể hoàn tác.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#dddddd]">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeletingUser(null)}
                className="h-9 px-4 bg-white border border-[#dddddd] hover:bg-gray-50 text-[#41454d] text-[13px] font-medium rounded-[6px] transition cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="h-9 px-4 bg-[#A30029] hover:bg-[#850021] text-white text-[13px] font-semibold rounded-[6px] transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Xóa tài khoản</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
