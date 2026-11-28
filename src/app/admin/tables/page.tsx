'use client';

import React, { useEffect, useState, useCallback } from 'react';
import QRCode from 'qrcode';
import {
  CiRedo as RefreshCw,
  CiEdit as Edit3,
  CiTrash as Trash2,
  CiLock as Lock,
  CiUnlock as Unlock,
  CiBarcode as QrIcon,
  CiCircleRemove as X,
} from 'react-icons/ci';
import { useAdminBranch } from '@/context/AdminBranchContext';
import { useAuth } from '@/context/AuthContext';
import type { RestaurantTable } from '@/types';

export default function AdminTablesPage() {
  const { adminBranch } = useAdminBranch();
  const { user } = useAuth();
  const isManager = user?.role === 'manager';

  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [qrMap, setQrMap] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Create form
  const [tableNumber, setTableNumber] = useState('');
  const [tableName, setTableName] = useState('');
  const [capacity, setCapacity] = useState(4);
  const [branchId, setBranchId] = useState<number>(
    isManager ? user?.branchId || 1 : adminBranch === 'all' ? 1 : Number(adminBranch)
  );
  const [saving, setSaving] = useState(false);

  // Edit modal state
  const [editing, setEditing] = useState<RestaurantTable | null>(null);
  const [editBranch, setEditBranch] = useState<number>(1);
  const [editNumber, setEditNumber] = useState('');
  const [editName, setEditName] = useState('');
  const [editCap, setEditCap] = useState<number>(4);
  const [updating, setUpdating] = useState(false);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const buildUrl = useCallback((t: RestaurantTable) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return `${origin}/dine-in?branch=${t.branchId}&table=${encodeURIComponent(t.tableNumber)}&token=${encodeURIComponent(t.qrToken)}`;
  }, []);

  const fetchTables = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/tables?branchId=${adminBranch}`);
      const data = await res.json();
      if (data.success) {
        const list: RestaurantTable[] = data.data || [];
        setTables(list);
        const generated: Record<number, string> = {};
        await Promise.all(
          list.map(async (t) => {
            generated[t.id] = await QRCode.toDataURL(buildUrl(t), {
              width: 320,
              margin: 2,
              color: { dark: '#181d26', light: '#FFFFFF' },
            });
          })
        );
        setQrMap(generated);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [adminBranch, buildUrl]);

  useEffect(() => {
    fetchTables();
  }, [fetchTables]);

  useEffect(() => {
    if (isManager && user?.branchId) setBranchId(user.branchId);
    else if (adminBranch !== 'all') setBranchId(Number(adminBranch));
  }, [adminBranch, isManager, user?.branchId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!tableNumber.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branchId,
          tableNumber: tableNumber.trim(),
          tableName: tableName.trim() || `Bàn ${tableNumber.trim().toUpperCase()}`,
          capacity,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTableNumber('');
        setTableName('');
        setCapacity(4);
        showToast(`Đã tạo bàn ${data.data.tableNumber} kèm mã QR!`);
        await fetchTables();
      } else {
        setErrorMsg(data.message || 'Không thể tạo bàn');
      }
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (t: RestaurantTable) => {
    setErrorMsg(null);
    setEditing(t);
    setEditBranch(t.branchId);
    setEditNumber(t.tableNumber);
    setEditName(t.tableName);
    setEditCap(t.capacity);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setUpdating(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/admin/tables/${editing.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branchId: editBranch,
          tableNumber: editNumber.trim(),
          tableName: editName.trim(),
          capacity: editCap,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setEditing(null);
        showToast('Đã lưu thông tin bàn!');
        await fetchTables();
      } else {
        setErrorMsg(data.message || 'Không thể cập nhật bàn');
      }
    } finally {
      setUpdating(false);
    }
  };

  const handleToggle = async (t: RestaurantTable) => {
    const res = await fetch(`/api/admin/tables/${t.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !t.isActive }),
    });
    const data = await res.json();
    if (data.success) {
      showToast(t.isActive ? `Đã tạm khóa ${t.tableName}` : `Đã mở lại ${t.tableName}`);
      fetchTables();
    }
  };

  const handleRegenQr = async (t: RestaurantTable) => {
    if (!confirm(`Tạo mã QR mới cho ${t.tableName}? Mã QR cũ đã in sẽ hết hiệu lực ngay lập tức.`)) return;
    const res = await fetch(`/api/admin/tables/${t.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ regenerateQr: true }),
    });
    const data = await res.json();
    if (data.success) {
      showToast(`Đã cấp mã QR mới cho ${t.tableName}`);
      fetchTables();
    }
  };

  const handleDelete = async (t: RestaurantTable) => {
    if (!confirm(`Xóa vĩnh viễn ${t.tableName} (${t.tableNumber})?`)) return;
    const res = await fetch(`/api/admin/tables/${t.id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      showToast(`Đã xóa ${t.tableName}`);
      fetchTables();
    }
  };

  const handlePrintQr = (t: RestaurantTable) => {
    const qrSrc = qrMap[t.id];
    if (!qrSrc) return;
    const branchLabel = t.branchId === 2 ? 'Cơ sở 2 · 269 Cầu Giấy' : 'Cơ sở 1 · 120 Yên Lãng';
    const w = window.open('', '_blank', 'width=420,height=560');
    if (!w) return;
    w.document.write(`
      <!doctype html>
      <html lang="vi"><head><meta charset="utf-8"><title>QR ${t.tableNumber}</title>
      <style>
        body { font-family: system-ui, sans-serif; margin: 0; padding: 24px; text-align: center; color: #181d26; }
        .card { border: 2px solid #181d26; border-radius: 16px; padding: 24px 20px; max-width: 320px; margin: 0 auto; }
        .brand { color: #A30029; font-weight: 800; font-size: 22px; letter-spacing: 0.5px; }
        .branch { font-size: 12px; color: #41454d; margin-top: 4px; }
        .table { font-size: 26px; font-weight: 900; margin: 14px 0 4px; }
        img { width: 220px; height: 220px; margin: 10px auto; display: block; }
        .hint { font-size: 13px; color: #41454d; line-height: 1.4; margin-top: 8px; }
      </style></head><body>
      <div class="card">
        <div class="brand">NOONEE FOOD</div>
        <div class="branch">${branchLabel}</div>
        <div class="table">${t.tableNumber} · ${t.tableName}</div>
        <img src="${qrSrc}" alt="QR" />
        <div class="hint">Quét mã QR bằng Camera hoặc Zalo<br/>để xem thực đơn &amp; gọi món tại bàn</div>
      </div>
      <script>window.onload = () => { window.print(); };</script>
      </body></html>
    `);
    w.document.close();
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#181d26] text-white text-[13px] px-4 py-2.5 rounded-[8px] shadow-lg">
          {toast}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-normal text-[#181d26]">Quản lý Bàn &amp; Mã QR Tại Bàn</h1>
          <p className="text-[13px] text-[#41454d] mt-1">
            Thêm, sửa, khóa/mở bàn và in phiếu mã QR gọi món riêng cho từng bàn theo cơ sở.
          </p>
        </div>
        <button
          type="button"
          onClick={fetchTables}
          className="h-9 px-3.5 bg-white border border-[#dddddd] hover:bg-[#f8fafc] text-[#181d26] text-[13px] font-medium rounded-[6px] inline-flex items-center gap-2 self-start cursor-pointer"
        >
          <RefreshCw className="w-4 h-4 text-[#9297a0]" />
          <span>Làm mới</span>
        </button>
      </div>

      {/* Add Table Form */}
      <form
        onSubmit={handleCreate}
        className="bg-white p-4 rounded-[10px] border border-[#dddddd] space-y-3"
      >
        <div className="text-[13px] font-semibold text-[#181d26]">Thêm bàn mới</div>
        {errorMsg && !editing && (
          <div className="text-[12px] text-[#A30029] bg-[#fff1f2] border border-[#fecdd3] px-3 py-2 rounded-[6px]">
            {errorMsg}
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-end">
          <div>
            <label className="block text-[12px] font-medium text-[#41454d] mb-1">Cơ sở</label>
            <select
              value={branchId}
              disabled={isManager}
              onChange={(e) => setBranchId(Number(e.target.value))}
              className="w-full h-10 px-3 border border-[#dddddd] rounded-[6px] text-[13px] bg-white disabled:bg-gray-50"
            >
              <option value={1}>CS1 · 120 Yên Lãng</option>
              <option value={2}>CS2 · 269 Cầu Giấy</option>
            </select>
          </div>
          <div>
            <label className="block text-[12px] font-medium text-[#41454d] mb-1">Mã bàn *</label>
            <input
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              placeholder="VD: B05"
              required
              className="w-full h-10 px-3 border border-[#dddddd] rounded-[6px] text-[13px]"
            />
          </div>
          <div>
            <label className="block text-[12px] font-medium text-[#41454d] mb-1">Tên bàn hiển thị</label>
            <input
              value={tableName}
              onChange={(e) => setTableName(e.target.value)}
              placeholder="VD: Bàn 05 - Tầng 2"
              className="w-full h-10 px-3 border border-[#dddddd] rounded-[6px] text-[13px]"
            />
          </div>
          <div>
            <label className="block text-[12px] font-medium text-[#41454d] mb-1">Số ghế</label>
            <input
              type="number"
              min={1}
              max={30}
              value={capacity}
              onChange={(e) => setCapacity(Number(e.target.value))}
              className="w-full h-10 px-3 border border-[#dddddd] rounded-[6px] text-[13px]"
            />
          </div>
          <button
            disabled={saving}
            type="submit"
            className="h-10 px-4 bg-[#A30029] hover:bg-[#850021] text-white font-semibold rounded-[6px] text-[13px] disabled:opacity-50 cursor-pointer"
          >
            {saving ? 'Đang tạo...' : '+ Tạo bàn & QR'}
          </button>
        </div>
      </form>

      {/* Tables Grid */}
      {loading ? (
        <div className="bg-white rounded-[10px] border border-[#dddddd] p-12 text-center text-[13px] text-[#9297a0]">
          Đang tải danh sách bàn...
        </div>
      ) : tables.length === 0 ? (
        <div className="bg-white rounded-[10px] border border-[#dddddd] p-12 text-center text-[13px] text-[#41454d]">
          Chưa có bàn nào tại cơ sở này. Hãy thêm bàn đầu tiên ở khung bên trên.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {tables.map((t) => (
            <div
              key={t.id}
              className={`bg-white rounded-[10px] border p-4 flex flex-col justify-between transition ${
                t.isActive ? 'border-[#dddddd]' : 'border-[#fecdd3] bg-[#fff1f2]/20'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-[#f8fafc] border border-[#dddddd] text-[#333840]">
                      {t.branchId === 2 ? 'CS2 · Cầu Giấy' : 'CS1 · Yên Lãng'}
                    </span>
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${
                        t.isActive
                          ? 'bg-[#f0fdf4] text-[#16a34a] border-[#bbf7d0]'
                          : 'bg-[#fff1f2] text-[#A30029] border-[#fecdd3]'
                      }`}
                    >
                      {t.isActive ? 'Đang hoạt động' : 'Tạm khóa'}
                    </span>
                  </div>
                  <h3 className="text-[17px] font-bold text-[#181d26] truncate pt-0.5">
                    {t.tableNumber} · {t.tableName}
                  </h3>
                  <p className="text-[12px] text-[#64748b]">Sức chứa: {t.capacity} khách</p>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(buildUrl(t));
                      showToast(`Đã sao chép link QR bàn ${t.tableNumber}`);
                    }}
                    className="text-[11px] text-[#A30029] hover:underline font-medium cursor-pointer"
                  >
                    Sao chép link quét QR
                  </button>
                </div>

                {qrMap[t.id] && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={qrMap[t.id]}
                    alt={t.tableName}
                    className="w-24 h-24 border border-[#dddddd] rounded-[8px] bg-white p-1 shrink-0"
                  />
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-[#dddddd] flex flex-wrap items-center gap-1.5 text-[12px]">
                <button
                  type="button"
                  onClick={() => handlePrintQr(t)}
                  className="h-8 px-2.5 bg-[#181d26] hover:bg-[#333840] text-white rounded-[6px] font-medium cursor-pointer"
                >
                  In phiếu QR
                </button>
                {qrMap[t.id] && (
                  <a
                    href={qrMap[t.id]}
                    download={`QR-CS${t.branchId}-${t.tableNumber}.png`}
                    className="h-8 px-2.5 bg-white border border-[#dddddd] hover:bg-[#f8fafc] text-[#181d26] rounded-[6px] font-medium inline-flex items-center"
                  >
                    Tải ảnh
                  </a>
                )}
                <a
                  href={buildUrl(t)}
                  target="_blank"
                  rel="noreferrer"
                  className="h-8 px-2.5 bg-[#fff1f2] border border-[#fecdd3] text-[#A30029] rounded-[6px] font-medium inline-flex items-center"
                >
                  Mở thử
                </a>
                <button
                  type="button"
                  onClick={() => openEdit(t)}
                  className="h-8 px-2 bg-white border border-[#dddddd] hover:bg-[#f8fafc] text-[#41454d] rounded-[6px] inline-flex items-center gap-1 cursor-pointer"
                  title="Sửa thông tin bàn"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Sửa</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleRegenQr(t)}
                  className="h-8 px-2 bg-white border border-[#dddddd] hover:bg-[#f8fafc] text-[#41454d] rounded-[6px] inline-flex items-center gap-1 cursor-pointer"
                  title="Đổi mã QR mới (vô hiệu hóa mã cũ)"
                >
                  <QrIcon className="w-3.5 h-3.5" />
                  <span>Đổi QR</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleToggle(t)}
                  className="h-8 px-2 bg-white border border-[#dddddd] hover:bg-[#f8fafc] text-[#41454d] rounded-[6px] inline-flex items-center gap-1 cursor-pointer"
                >
                  {t.isActive ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                  <span>{t.isActive ? 'Khóa' : 'Mở'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(t)}
                  className="h-8 px-2 bg-white border border-[#fecdd3] hover:bg-[#fff1f2] text-[#A30029] rounded-[6px] inline-flex items-center ml-auto cursor-pointer"
                  title="Xóa bàn"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveEdit}
            className="bg-white rounded-[12px] border border-[#dddddd] w-full max-w-md p-5 space-y-4 shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-[#dddddd] pb-3">
              <h3 className="text-[16px] font-bold text-[#181d26]">Chỉnh sửa bàn {editing.tableNumber}</h3>
              <button type="button" onClick={() => setEditing(null)} className="p-1 text-[#9297a0] hover:text-[#181d26] cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            {errorMsg && (
              <div className="text-[12px] text-[#A30029] bg-[#fff1f2] border border-[#fecdd3] px-3 py-2 rounded-[6px]">
                {errorMsg}
              </div>
            )}
            <div className="space-y-3">
              <div>
                <label className="block text-[12px] font-medium text-[#41454d] mb-1">Cơ sở</label>
                <select
                  value={editBranch}
                  disabled={isManager}
                  onChange={(e) => setEditBranch(Number(e.target.value))}
                  className="w-full h-10 px-3 border border-[#dddddd] rounded-[6px] text-[13px] bg-white disabled:bg-gray-50"
                >
                  <option value={1}>CS1 · 120 Yên Lãng</option>
                  <option value={2}>CS2 · 269 Cầu Giấy</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-medium text-[#41454d] mb-1">Mã bàn *</label>
                  <input
                    value={editNumber}
                    onChange={(e) => setEditNumber(e.target.value)}
                    required
                    className="w-full h-10 px-3 border border-[#dddddd] rounded-[6px] text-[13px]"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-[#41454d] mb-1">Số ghế</label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={editCap}
                    onChange={(e) => setEditCap(Number(e.target.value))}
                    className="w-full h-10 px-3 border border-[#dddddd] rounded-[6px] text-[13px]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[12px] font-medium text-[#41454d] mb-1">Tên bàn hiển thị *</label>
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                  className="w-full h-10 px-3 border border-[#dddddd] rounded-[6px] text-[13px]"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-[#dddddd]">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="h-9 px-4 bg-white border border-[#dddddd] rounded-[6px] text-[13px] font-medium text-[#41454d] cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={updating}
                className="h-9 px-4 bg-[#A30029] hover:bg-[#850021] text-white rounded-[6px] text-[13px] font-semibold disabled:opacity-50 cursor-pointer"
              >
                {updating ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
