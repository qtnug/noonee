'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  CiRedo as RefreshCw,
  CiClock2 as Clock,
  CiLock as Lock,
} from 'react-icons/ci';
import { useAdminBranch } from '@/context/AdminBranchContext';
import { formatVND } from '@/lib/utils';
import type { Order, OrderStatus } from '@/types';

function minutesSince(iso: string): number {
  const ms = Date.now() - new Date(iso).getTime();
  return Math.max(0, Math.floor(ms / 60000));
}

export default function AdminKitchenPage() {
  const { adminBranch } = useAdminBranch();
  const [orders, setOrders] = useState<Order[]>([]);
  const [soundOn, setSoundOn] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'dinein' | 'online'>('all');
  const [busyCode, setBusyCode] = useState<string | null>(null);
  const knownPendingCodes = useRef<Set<string>>(new Set());
  const initialized = useRef(false);

  const playBeep = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(1174, ctx.currentTime + 0.14);
      gain.gain.setValueAtTime(0.14, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.42);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.42);
    } catch { }
  };

  const fetchOrders = useCallback(async () => {
    try {
      const q = new URLSearchParams({ limit: '60', includeItems: '1' });
      if (adminBranch !== 'all') q.set('branch', String(adminBranch));
      if (filterType !== 'all') q.set('orderType', filterType);

      const res = await fetch(`/api/orders?${q.toString()}`);
      const data = await res.json();
      if (data.success) {
        const list: Order[] = (data.data || []).filter((o: Order) => o.status !== 'Cancelled');
        const pendingCodes = list.filter((o) => o.status === 'Pending').map((o) => o.orderCode);
        if (initialized.current && soundOn && pendingCodes.some((code) => !knownPendingCodes.current.has(code))) {
          playBeep();
        }
        knownPendingCodes.current = new Set(pendingCodes);
        initialized.current = true;
        setOrders(list);
      }
    } catch (e) {
      console.error(e);
    }
  }, [adminBranch, filterType, soundOn]);

  useEffect(() => {
    fetchOrders();
    const id = setInterval(fetchOrders, 4000);
    return () => clearInterval(id);
  }, [fetchOrders]);

  const advanceStatus = async (order: Order, nextStatus: OrderStatus) => {
    if (order.status === 'Completed') return;
    setBusyCode(order.orderCode);
    try {
      const body: Record<string, string> = { status: nextStatus };
      if (nextStatus === 'Completed') body.paymentStatus = 'Paid';
      await fetch(`/api/orders/${order.orderCode}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      await fetchOrders();
    } finally {
      setBusyCode(null);
    }
  };

  const pendingList = orders.filter((o) => o.status === 'Pending');
  const cookingList = orders.filter((o) => o.status === 'Processing');
  const readyList = orders.filter((o) => o.status === 'Delivering');
  const completedList = orders.filter((o) => o.status === 'Completed').slice(0, 6);

  const renderCard = (o: Order) => {
    const mins = minutesSince(o.createdAt);
    const isDineIn = o.orderType === 'dinein';
    const nextAction =
      o.status === 'Pending'
        ? { next: 'Processing' as OrderStatus, label: 'Nhận vào bếp', cls: 'bg-[#A30029] hover:bg-[#850021]' }
        : o.status === 'Processing'
          ? { next: 'Delivering' as OrderStatus, label: isDineIn ? 'Xong món · Ra bàn' : 'Xong món · Giao Ship', cls: 'bg-[#2563eb] hover:bg-[#1d4ed8]' }
          : o.status === 'Delivering'
            ? { next: 'Completed' as OrderStatus, label: 'Thu tiền & Hoàn tất', cls: 'bg-[#16a34a] hover:bg-[#15803d]' }
            : null;

    return (
      <div
        key={o.orderCode}
        className={`bg-white rounded-[10px] border p-3.5 space-y-3 shadow-xs ${o.status === 'Pending' ? 'border-2 border-[#A30029]' : 'border-[#dddddd]'
          }`}
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-mono font-bold text-[15px] text-[#181d26]">#{o.orderCode}</span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded border ${isDineIn
                  ? 'bg-[#f3e8ff] text-[#6b21a8] border-[#e9d5ff]'
                  : 'bg-[#eff6ff] text-[#2563eb] border-[#bfdbfe]'
                  }`}
              >
                {isDineIn ? `TẠI BÀN · ${o.tableName || ''}` : 'ONLINE'}
              </span>
            </div>
            <div className="text-[12px] text-[#64748b] mt-0.5">{o.customerName}</div>
          </div>

          <span
            className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded ${mins >= 15 ? 'bg-[#fff1f2] text-[#A30029]' : 'bg-[#f8fafc] text-[#41454d]'
              }`}
          >
            <Clock className="w-3.5 h-3.5" />
            {mins === 0 ? 'Vừa xong' : `${mins}p`}
          </span>
        </div>

        <ul className="space-y-1.5 border-t border-b border-[#f1f5f9] py-2.5 text-[13px]">
          {(o.items || []).length === 0 ? (
            <li className="text-[#9297a0] text-[12px]">Đang đồng bộ danh sách món...</li>
          ) : (
            (o.items || []).map((it, idx) => (
              <li key={idx} className="space-y-0.5">
                <div className="font-semibold text-[#181d26]">
                  <span className="text-[#A30029] font-bold mr-1.5">{it.quantity}×</span>
                  {it.productName}
                </div>
                {it.toppings && <div className="text-[11px] text-[#41454d] pl-5">+ {it.toppings}</div>}
                {it.note && <div className="text-[11px] text-[#A30029] italic pl-5">Ghi chú: {it.note}</div>}
              </li>
            ))
          )}
        </ul>

        {o.notes && (
          <div className="text-[12px] bg-[#fffbeb] border border-[#fde68a] text-[#92400e] px-2.5 py-1.5 rounded-[6px]">
            Ghi chú đơn: {o.notes}
          </div>
        )}

        <div className="flex items-center justify-between gap-2 pt-0.5">
          <div className="text-[12px]">
            <span className="font-bold text-[#181d26]">{formatVND(o.totalAmount)}</span>
            <span
              className={`ml-1.5 text-[11px] font-semibold ${o.paymentStatus === 'Paid' ? 'text-[#16a34a]' : 'text-[#A30029]'
                }`}
            >
              · {o.paymentStatus === 'Paid' ? 'Đã TT' : o.paymentMethod === 'Sepay' ? 'Chờ QR' : 'Thu COD'}
            </span>
          </div>

          {nextAction && (
            <button
              type="button"
              disabled={busyCode === o.orderCode}
              onClick={() => advanceStatus(o, nextAction.next)}
              className={`h-8 px-3 text-white text-[12px] font-semibold rounded-[6px] disabled:opacity-50 cursor-pointer ${nextAction.cls}`}
            >
              {busyCode === o.orderCode ? '...' : nextAction.label}
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-normal text-[#181d26]">Màn hình Bếp &amp; Thu ngân (KDS)</h1>
          <p className="text-[13px] text-[#41454d] mt-1">
            Tự động đồng bộ mỗi 4 giây · Phát chuông khi có đơn mới · Tách luồng Tại bàn &amp; Online.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {([
            { k: 'all' as const, l: 'Tất cả' },
            { k: 'dinein' as const, l: 'Tại bàn (QR/POS)' },
            { k: 'online' as const, l: 'Đơn Online' },
          ]).map((t) => (
            <button
              key={t.k}
              type="button"
              onClick={() => setFilterType(t.k)}
              className={`h-9 px-3 rounded-[6px] text-[12px] font-semibold border cursor-pointer ${filterType === t.k
                ? 'bg-[#181d26] text-white border-[#181d26]'
                : 'bg-white text-[#41454d] border-[#dddddd]'
                }`}
            >
              {t.l}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setSoundOn((s) => !s)}
            className={`h-9 px-3 rounded-[6px] text-[12px] font-semibold border cursor-pointer ${soundOn ? 'bg-[#f0fdf4] text-[#16a34a] border-[#bbf7d0]' : 'bg-white text-[#64748b] border-[#dddddd]'
              }`}
          >
            {soundOn ? 'Chuông báo: BẬT' : 'Chuông báo: TẮT'}
          </button>
          <button
            type="button"
            onClick={fetchOrders}
            className="h-9 px-3 bg-white border border-[#dddddd] rounded-[6px] text-[#41454d] hover:bg-[#f8fafc] cursor-pointer"
            title="Làm mới ngay"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 3-Stage KDS Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        <div className="bg-[#f8fafc] border border-[#dddddd] rounded-[10px] p-3.5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-[13px] font-bold uppercase tracking-wider text-[#A30029]">
              1. Chờ tiếp nhận ({pendingList.length})
            </h2>
          </div>
          {pendingList.length === 0 ? (
            <p className="text-[12px] text-[#9297a0] py-8 text-center">Không có đơn chờ mới</p>
          ) : (
            pendingList.map(renderCard)
          )}
        </div>

        <div className="bg-[#f8fafc] border border-[#dddddd] rounded-[10px] p-3.5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-[13px] font-bold uppercase tracking-wider text-[#2563eb]">
              2. Đang chế biến ({cookingList.length})
            </h2>
          </div>
          {cookingList.length === 0 ? (
            <p className="text-[12px] text-[#9297a0] py-8 text-center">Bếp đang trống</p>
          ) : (
            cookingList.map(renderCard)
          )}
        </div>

        <div className="bg-[#f8fafc] border border-[#dddddd] rounded-[10px] p-3.5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-[13px] font-bold uppercase tracking-wider text-[#16a34a]">
              3. Sẵn sàng / Đang giao ({readyList.length})
            </h2>
          </div>
          {readyList.length === 0 ? (
            <p className="text-[12px] text-[#9297a0] py-8 text-center">Chưa có đơn chờ giao / ra bàn</p>
          ) : (
            readyList.map(renderCard)
          )}
        </div>
      </div>

      {completedList.length > 0 && (
        <div className="bg-white border border-[#dddddd] rounded-[10px] p-4 space-y-3">
          <div className="text-[12px] font-bold text-[#64748b] uppercase tracking-wider flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5" />
            <span>Vừa hoàn tất gần đây (Đã khóa trạng thái)</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {completedList.map((o) => (
              <div key={o.orderCode} className="bg-[#f8fafc] border border-[#dddddd] rounded-[8px] p-2.5 text-[12px]">
                <div className="font-mono font-bold text-[#181d26]">#{o.orderCode}</div>
                <div className="text-[#64748b] truncate text-[11px]">
                  {o.orderType === 'dinein' ? o.tableName : o.customerName}
                </div>
                <div className="mt-1 font-semibold text-[#16a34a] text-[11px]">{formatVND(o.totalAmount)} · Đã khóa</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
