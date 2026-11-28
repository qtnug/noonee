'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { CiSearch as Search, CiRedo as RefreshCw } from 'react-icons/ci';
import { useAdminBranch } from '@/context/AdminBranchContext';
import type { AdminLog } from '@/types';

const ACTION_LABELS: Record<string, { label: string; cls: string }> = {
  UPDATE_ORDER_STATUS: { label: 'Cập nhật đơn', cls: 'bg-[#eff6ff] text-[#2563eb] border-[#bfdbfe]' },
  CANCEL_ORDER: { label: 'Hủy đơn', cls: 'bg-[#fff1f2] text-[#A30029] border-[#fecdd3]' },
  CREATE_DINEIN_ORDER: { label: 'Order tại bàn', cls: 'bg-[#f3e8ff] text-[#6b21a8] border-[#e9d5ff]' },
  CREATE_TABLE: { label: 'Thêm bàn', cls: 'bg-[#f0fdf4] text-[#16a34a] border-[#bbf7d0]' },
  UPDATE_TABLE: { label: 'Sửa bàn', cls: 'bg-[#f8fafc] text-[#333840] border-[#dddddd]' },
  LOCK_TABLE: { label: 'Khóa bàn', cls: 'bg-[#fff1f2] text-[#A30029] border-[#fecdd3]' },
  UNLOCK_TABLE: { label: 'Mở bàn', cls: 'bg-[#f0fdf4] text-[#16a34a] border-[#bbf7d0]' },
  REGENERATE_TABLE_QR: { label: 'Đổi mã QR', cls: 'bg-[#fefce8] text-[#a16207] border-[#fde047]' },
  DELETE_TABLE: { label: 'Xóa bàn', cls: 'bg-[#fff1f2] text-[#A30029] border-[#fecdd3]' },
  CREATE_PRODUCT: { label: 'Thêm món', cls: 'bg-[#f0fdf4] text-[#16a34a] border-[#bbf7d0]' },
  UPDATE_PRODUCT: { label: 'Sửa món', cls: 'bg-[#eff6ff] text-[#2563eb] border-[#bfdbfe]' },
  DELETE_PRODUCT: { label: 'Xóa món', cls: 'bg-[#fff1f2] text-[#A30029] border-[#fecdd3]' },
};

export default function AdminLogsPage() {
  const { adminBranch } = useAdminBranch();
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'Order' | 'Table' | 'Product'>('all');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/logs?branchId=${adminBranch}`);
      const data = await res.json();
      if (data.success) setLogs(data.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [adminBranch]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const filtered = logs.filter((l) => {
    if (typeFilter !== 'all' && l.targetType !== typeFilter) return false;
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      l.adminName.toLowerCase().includes(q) ||
      l.action.toLowerCase().includes(q) ||
      (l.targetId || '').toLowerCase().includes(q) ||
      (l.details || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-normal text-[#181d26]">Nhật ký thao tác Admin</h1>
          <p className="text-[13px] text-[#41454d] mt-1">
            Theo dõi lịch sử duyệt đơn, hủy đơn, chỉnh sửa bàn QR và thực đơn theo thời gian thực.
          </p>
        </div>
        <button
          type="button"
          onClick={fetchLogs}
          className="h-9 px-3.5 bg-white border border-[#dddddd] hover:bg-[#f8fafc] text-[#181d26] text-[13px] font-medium rounded-[6px] inline-flex items-center gap-2 self-start cursor-pointer"
        >
          <RefreshCw className="w-4 h-4 text-[#9297a0]" />
          <span>Làm mới</span>
        </button>
      </div>

      <div className="bg-white p-3.5 rounded-[10px] border border-[#dddddd] flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#9297a0] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm người thực hiện, mã đơn, chi tiết..."
            className="w-full h-10 pl-10 pr-4 text-[13px] border border-[#dddddd] rounded-[6px] focus:outline-none focus:border-[#A30029]"
          />
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {[
            { k: 'all' as const, l: 'Tất cả' },
            { k: 'Order' as const, l: 'Đơn hàng' },
            { k: 'Table' as const, l: 'Bàn & QR' },
            { k: 'Product' as const, l: 'Thực đơn' },
          ].map((t) => (
            <button
              key={t.k}
              type="button"
              onClick={() => setTypeFilter(t.k)}
              className={`h-8 px-3 rounded-[6px] text-[12px] font-medium border cursor-pointer ${
                typeFilter === t.k
                  ? 'bg-[#A30029] text-white border-[#A30029]'
                  : 'bg-white text-[#41454d] border-[#dddddd] hover:bg-[#f8fafc]'
              }`}
            >
              {t.l}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-[10px] border border-[#dddddd] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px] text-left min-w-[700px]">
            <thead className="bg-[#f8fafc] border-b border-[#dddddd] text-[#9297a0] font-medium uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-4 py-3">Thời gian</th>
                <th className="px-4 py-3">Nhân sự</th>
                <th className="px-4 py-3">Cơ sở</th>
                <th className="px-4 py-3">Thao tác</th>
                <th className="px-4 py-3">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#dddddd]">
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-[#9297a0]">Đang tải nhật ký...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-[#41454d]">Chưa có bản ghi thao tác nào phù hợp.</td></tr>
              ) : (
                filtered.map((log) => {
                  const meta = ACTION_LABELS[log.action] || { label: log.action, cls: 'bg-[#f8fafc] text-[#333840] border-[#dddddd]' };
                  return (
                    <tr key={log.id} className="hover:bg-[#f8fafc]">
                      <td className="px-4 py-3 text-[12px] text-[#64748b] whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString('vi-VN')}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="font-semibold text-[#181d26]">{log.adminName}</span>
                        <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded bg-[#f8fafc] border border-[#dddddd] text-[#41454d] uppercase">
                          {log.adminRole}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[12px] text-[#41454d] whitespace-nowrap">
                        {log.branchId === 2 ? 'CS2 · Cầu Giấy' : log.branchId === 1 ? 'CS1 · Yên Lãng' : 'Toàn hệ thống'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${meta.cls}`}>
                          {meta.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[#181d26]">{log.details}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
