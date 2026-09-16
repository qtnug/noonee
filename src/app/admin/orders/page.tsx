'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShoppingBag, Search, RefreshCw, Eye, CookingPot, Truck, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { Order } from '@/types';
import { formatVND, formatDate } from '@/lib/utils';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const query = new URLSearchParams();
      if (statusFilter !== 'all') query.set('status', statusFilter);
      if (searchQuery) query.set('search', searchQuery);

      const res = await fetch(`/api/orders?${query.toString()}`);
      const data = await res.json();
      if (data.success) {
        setOrders(data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter, searchQuery]);

  const [updatingCode, setUpdatingCode] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleStatusChange = async (orderCode: string, newStatus: string, newPaymentStatus?: string) => {
    setUpdatingCode(orderCode);
    // Optimistic update
    setOrders((prev) =>
      prev.map((o) =>
        o.orderCode === orderCode
          ? {
              ...o,
              status: newStatus as any,
              paymentStatus: newPaymentStatus ? (newPaymentStatus as any) : o.paymentStatus,
            }
          : o
      )
    );

    try {
      const res = await fetch(`/api/orders/${orderCode}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, paymentStatus: newPaymentStatus }),
      });
      const data = await res.json();
      if (data.success) {
        const labels: Record<string, string> = {
          Pending: 'Chờ tiếp nhận',
          Processing: 'Đang nấu',
          Delivering: 'Đang giao hàng',
          Completed: 'Đã hoàn thành',
          Cancelled: 'Đã hủy đơn',
        };
        setToastMessage(`Đã cập nhật đơn #${orderCode} sang [${labels[newStatus] || newStatus}]`);
        setTimeout(() => setToastMessage(null), 3000);
      }
      fetchOrders();
    } catch (e) {
      console.error(e);
      fetchOrders();
    } finally {
      setUpdatingCode(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-normal text-[#181d26]">Quản lý đơn hàng</h1>
          <p className="text-[14px] text-[#41454d] mt-1">
            Xem danh sách đơn hàng, cập nhật trạng thái chế biến và giao hàng
          </p>
        </div>

        <button
          onClick={fetchOrders}
          className="h-10 px-4 bg-white border border-[#dddddd] hover:bg-[#f8fafc] text-[#181d26] text-[13px] font-medium rounded-[6px] flex items-center gap-2 transition self-start"
        >
          <RefreshCw className="w-4 h-4 text-[#9297a0]" />
          <span>Làm mới danh sách</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-[10px] border border-[#dddddd] flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#9297a0] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo mã đơn, khách, SĐT..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-4 text-[13px] bg-white border border-[#dddddd] rounded-[6px] focus:outline-none focus:border-[#e31837] text-[#181d26]"
          />
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {[
            { key: 'all', label: 'Tất cả' },
            { key: 'Pending', label: 'Chờ tiếp nhận' },
            { key: 'Processing', label: 'Đang nấu' },
            { key: 'Delivering', label: 'Đang giao' },
            { key: 'Completed', label: 'Hoàn thành' },
            { key: 'Cancelled', label: 'Đã hủy' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`h-8 px-3 rounded-[6px] text-[12px] font-medium shrink-0 transition border ${
                statusFilter === tab.key
                  ? 'bg-[#e31837] text-white border-[#e31837] shadow-xs'
                  : 'bg-white text-[#333840] border-[#dddddd] hover:bg-[#f8fafc]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-[10px] border border-[#dddddd] overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-[13px] text-[#9297a0]">Đang tải...</div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <ShoppingBag className="w-8 h-8 text-[#9297a0] mx-auto opacity-50" />
            <p className="text-[13px] text-[#41454d]">Không có đơn hàng nào.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead className="bg-[#f8fafc] border-b border-[#dddddd] text-[#9297a0] font-medium uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Mã đơn</th>
                  <th className="py-3 px-4">Khách hàng & Địa chỉ</th>
                  <th className="py-3 px-4">Tổng tiền</th>
                  <th className="py-3 px-4">Phương thức</th>
                  <th className="py-3 px-4">Thanh toán</th>
                  <th className="py-3 px-4">Trạng thái bếp</th>
                  <th className="py-3 px-4 text-right">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#dddddd]">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-[#f8fafc] transition">
                    <td className="py-3.5 px-4 font-mono font-medium text-[#181d26]">
                      <Link href={`/orders/${order.orderCode}`} className="hover:underline">
                        #{order.orderCode}
                      </Link>
                      <span className="block text-[11px] text-[#9297a0] font-normal">
                        {formatDate(order.createdAt)}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="font-medium text-[#181d26]">{order.customerName}</div>
                      <div className="text-[#9297a0] text-[12px]">{order.customerPhone}</div>
                      <div className="text-[#41454d] text-[12px] truncate">{order.deliveryAddress}</div>
                      {order.notes && (
                        <div className="text-[11px] text-[#e31837] italic truncate">Ghi chú: {order.notes}</div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-[#181d26]">
                      <div>{formatVND(order.totalAmount)}</div>
                      {order.discountAmount && order.discountAmount > 0 ? (
                        <div className="text-[11px] text-[#e31837] font-normal">
                          Giảm: -{formatVND(order.discountAmount)} ({order.couponCode || 'Mã'})
                        </div>
                      ) : null}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-[4px] bg-[#f8fafc] border border-[#dddddd] text-[#333840] text-[11px] font-medium">
                        {order.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <select
                        value={order.paymentStatus}
                        onChange={(e) => handleStatusChange(order.orderCode, order.status, e.target.value)}
                        className={`h-8 px-2 rounded-[6px] text-[12px] font-medium border ${
                          order.paymentStatus === 'Paid'
                            ? 'bg-white text-[#006400] border-[#39bf45]'
                            : 'bg-[#fff1f2] text-[#e31837] border-[#fecdd3]'
                        }`}
                      >
                        <option value="Unpaid">Chưa thu tiền</option>
                        <option value="Paid">Đã thanh toán</option>
                      </select>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        {(() => {
                          const badges: Record<string, { label: string; cls: string }> = {
                            Pending: { label: 'Chờ tiếp nhận', cls: 'bg-[#fff1f2] text-[#e31837] border-[#fecdd3]' },
                            Processing: { label: 'Đang nấu', cls: 'bg-[#eff6ff] text-[#2563eb] border-[#bfdbfe]' },
                            Delivering: { label: 'Đang giao', cls: 'bg-[#faf5ff] text-[#7c3aed] border-[#e9d5ff]' },
                            Completed: { label: 'Hoàn thành', cls: 'bg-[#f0fdf4] text-[#16a34a] border-[#bbf7d0]' },
                            Cancelled: { label: 'Đã hủy', cls: 'bg-[#f8fafc] text-[#64748b] border-[#e2e8f0]' },
                          };
                          const b = badges[order.status] || { label: order.status, cls: 'bg-[#f8fafc] text-[#64748b] border-[#dddddd]' };
                          return (
                            <span className={`px-2 py-0.5 rounded-[4px] text-[11px] font-medium border shrink-0 ${b.cls}`}>
                              {b.label}
                            </span>
                          );
                        })()}

                        {updatingCode === order.orderCode ? (
                          <span className="h-8 px-2 rounded-[6px] bg-[#f8fafc] border border-[#dddddd] text-[11px] text-[#9297a0] flex items-center gap-1">
                            <Loader2 className="w-3 h-3 animate-spin text-[#e31837]" />
                          </span>
                        ) : (
                          <>
                            {order.status === 'Pending' && (
                              <button
                                onClick={() => handleStatusChange(order.orderCode, 'Processing')}
                                className="h-7 px-2 bg-[#e31837] hover:bg-[#be0e27] text-white text-[11px] font-medium rounded-[4px] flex items-center gap-1 transition cursor-pointer shadow-xs"
                                title="Bắt đầu nấu"
                              >
                                <CookingPot className="w-3 h-3" />
                                <span>Vào bếp</span>
                              </button>
                            )}
                            {order.status === 'Processing' && (
                              <button
                                onClick={() => handleStatusChange(order.orderCode, 'Delivering')}
                                className="h-7 px-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-[11px] font-medium rounded-[4px] flex items-center gap-1 transition cursor-pointer shadow-xs"
                                title="Bếp nấu xong, giao Shipper"
                              >
                                <Truck className="w-3 h-3" />
                                <span>Giao hàng</span>
                              </button>
                            )}
                            {order.status === 'Delivering' && (
                              <button
                                onClick={() => handleStatusChange(order.orderCode, 'Completed', 'Paid')}
                                className="h-7 px-2 bg-[#16a34a] hover:bg-[#15803d] text-white text-[11px] font-medium rounded-[4px] flex items-center gap-1 transition cursor-pointer shadow-xs"
                                title="Khách đã nhận và thanh toán"
                              >
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Hoàn tất</span>
                              </button>
                            )}
                            <select
                              value={order.status}
                              onChange={(e) => handleStatusChange(order.orderCode, e.target.value, order.paymentStatus)}
                              className="h-7 px-1 bg-white border border-[#dddddd] rounded-[4px] text-[11px] text-[#41454d] cursor-pointer hover:border-[#9297a0]"
                              title="Tùy chỉnh trạng thái bất kỳ"
                            >
                              <option value="Pending">Chờ</option>
                              <option value="Processing">Nấu</option>
                              <option value="Delivering">Giao</option>
                              <option value="Completed">Xong</option>
                              <option value="Cancelled">Hủy</option>
                            </select>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/orders/${order.orderCode}`}
                        className="p-1.5 text-[#41454d] hover:text-[#181d26] hover:bg-[#f8fafc] rounded-[6px] inline-flex items-center transition border border-[#dddddd]"
                        title="Xem chi tiết đơn hàng"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Floating Action Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#181d26] text-white px-4 py-3 rounded-[8px] shadow-lg flex items-center gap-2.5 text-[13px] animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-[#39bf45]" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
