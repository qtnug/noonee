'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  DollarSign,
  ShoppingBag,
  Clock,
  Truck,
  ArrowRight,
  TrendingUp,
  UtensilsCrossed,
  Activity,
  CookingPot,
  XCircle,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { formatVND } from '@/lib/utils';
import { Order } from '@/types';

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updatingCode, setUpdatingCode] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats');
      const data = await res.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdateStatus = async (orderCode: string, newStatus: string, newPaymentStatus?: string) => {
    setUpdatingCode(orderCode);
    // Optimistic UI update
    setStats((prev: any) => {
      if (!prev) return prev;
      return {
        ...prev,
        recentOrders: prev.recentOrders?.map((o: Order) => {
          if (o.orderCode === orderCode) {
            return {
              ...o,
              status: newStatus as any,
              paymentStatus: newPaymentStatus ? (newPaymentStatus as any) : o.paymentStatus,
            };
          }
          return o;
        }),
      };
    });

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
      fetchStats();
    } catch (e) {
      console.error(e);
      fetchStats();
    } finally {
      setUpdatingCode(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Welcome & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-normal text-[#181d26]">
            Tổng quan hoạt động
          </h1>
          <p className="text-[14px] text-[#41454d] mt-1">
            Theo dõi doanh thu, trạng thái đơn hàng và hiệu suất bán hàng thời gian thực
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/products"
            className="h-10 px-4 bg-[#e31837] hover:bg-[#be0e27] active:bg-[#a60b20] text-white text-[13px] font-medium rounded-[6px] flex items-center gap-1.5 transition shadow-xs"
          >
            <UtensilsCrossed className="w-4 h-4" />
            <span>Thêm món mới</span>
          </Link>
          <Link
            href="/admin/diagnostics"
            className="h-10 px-4 bg-white hover:bg-[#f8fafc] text-[#181d26] border border-[#dddddd] text-[13px] font-medium rounded-[6px] flex items-center gap-1.5 transition"
          >
            <Activity className="w-4 h-4 text-[#006400]" />
            <span>CSDL & Chẩn đoán</span>
          </Link>
        </div>
      </div>

      {/* Floating Action Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#181d26] text-white px-4 py-3 rounded-[8px] shadow-lg flex items-center gap-2.5 text-[13px] animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-[#39bf45]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Metric Cards Grid (Airtable 10px cards, hairline borders) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Revenue */}
        <div className="bg-white p-6 rounded-[10px] border border-[#dddddd] space-y-2">
          <div className="flex items-center justify-between text-[13px] text-[#9297a0] font-medium">
            <span>Tổng doanh thu</span>
            <div className="w-8 h-8 rounded-[6px] bg-[#f8fafc] border border-[#dddddd] text-[#181d26] flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-semibold text-[#181d26]">
            {stats ? formatVND(stats.totalRevenue) : '...'}
          </div>
          <span className="text-[12px] text-[#006400] font-medium flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            Thanh toán thành công
          </span>
        </div>

        {/* Total Orders */}
        <div className="bg-white p-6 rounded-[10px] border border-[#dddddd] space-y-2">
          <div className="flex items-center justify-between text-[13px] text-[#9297a0] font-medium">
            <span>Tổng đơn hàng</span>
            <div className="w-8 h-8 rounded-[6px] bg-[#f8fafc] border border-[#dddddd] text-[#181d26] flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-semibold text-[#181d26]">
            {stats ? stats.totalOrders : '...'}
          </div>
          <span className="text-[12px] text-[#9297a0]">
            Toàn bộ đơn trong hệ thống
          </span>
        </div>

        {/* Pending Orders */}
        <div className="bg-white p-6 rounded-[10px] border border-[#dddddd] space-y-2">
          <div className="flex items-center justify-between text-[13px] text-[#9297a0] font-medium">
            <span>Đơn chờ tiếp nhận</span>
            <div className="w-8 h-8 rounded-[6px] bg-[#f8fafc] border border-[#dddddd] text-[#e31837] flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-semibold text-[#e31837]">
            {stats ? stats.pendingOrders : '...'}
          </div>
          <span className="text-[12px] text-[#e31837]">
            Cần vào bếp chế biến ngay
          </span>
        </div>

        {/* Delivering Orders */}
        <div className="bg-white p-6 rounded-[10px] border border-[#dddddd] space-y-2">
          <div className="flex items-center justify-between text-[13px] text-[#9297a0] font-medium">
            <span>Đang giao hàng</span>
            <div className="w-8 h-8 rounded-[6px] bg-[#f8fafc] border border-[#dddddd] text-[#254fad] flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-semibold text-[#254fad]">
            {stats ? stats.deliveringOrders : '...'}
          </div>
          <span className="text-[12px] text-[#254fad]">
            Shipper đang vận chuyển
          </span>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="bg-white rounded-[10px] border border-[#dddddd] p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#dddddd]">
          <h2 className="text-[16px] font-medium text-[#181d26]">Đơn hàng mới nhất</h2>
          <Link
            href="/admin/orders"
            className="text-[13px] font-medium text-[#181d26] hover:text-[#e31837] flex items-center gap-1 transition"
          >
            <span>Xem tất cả</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-[#dddddd] text-[#9297a0] uppercase tracking-wider font-medium text-[11px]">
                <th className="pb-3">Mã đơn</th>
                <th className="pb-3">Khách hàng</th>
                <th className="pb-3">Số tiền</th>
                <th className="pb-3">Phương thức</th>
                <th className="pb-3">Thanh toán</th>
                <th className="pb-3">Trạng thái bếp</th>
                <th className="pb-3 text-right">Cập nhật nhanh</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#dddddd]">
              {stats?.recentOrders?.map((order: Order) => (
                <tr key={order.id} className="hover:bg-[#f8fafc] transition">
                  <td className="py-3.5 font-mono font-medium text-[#181d26]">
                    <Link href={`/orders/${order.orderCode}`} className="hover:underline">
                      #{order.orderCode}
                    </Link>
                  </td>
                  <td className="py-3.5">
                    <span className="font-medium text-[#181d26] block">{order.customerName}</span>
                    <span className="text-[#9297a0] text-[12px]">{order.customerPhone}</span>
                  </td>
                  <td className="py-3.5 font-medium text-[#181d26]">
                    {formatVND(order.totalAmount)}
                  </td>
                  <td className="py-3.5">
                    <span className="px-2 py-0.5 rounded-[4px] bg-[#f8fafc] border border-[#dddddd] text-[#333840] text-[11px] font-medium">
                      {order.paymentMethod}
                    </span>
                  </td>
                  <td className="py-3.5">
                    <span
                      className={`px-2 py-0.5 rounded-[4px] text-[11px] font-medium border ${
                        order.paymentStatus === 'Paid'
                          ? 'bg-[#f8fafc] text-[#006400] border-[#39bf45]'
                          : 'bg-[#fff1f2] text-[#e31837] border-[#fecdd3]'
                      }`}
                    >
                      {order.paymentStatus === 'Paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                    </span>
                  </td>
                  <td className="py-3.5">
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
                        <span className={`px-2 py-0.5 rounded-[4px] text-[11px] font-medium border ${b.cls}`}>
                          {b.label}
                        </span>
                      );
                    })()}
                  </td>
                  <td className="py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {updatingCode === order.orderCode ? (
                        <span className="h-8 px-2.5 rounded-[6px] bg-[#f8fafc] border border-[#dddddd] text-[11px] text-[#9297a0] flex items-center gap-1">
                          <Loader2 className="w-3 h-3 animate-spin text-[#e31837]" />
                          Lưu...
                        </span>
                      ) : (
                        <>
                          {order.status === 'Pending' && (
                            <>
                              <button
                                onClick={() => handleUpdateStatus(order.orderCode, 'Processing')}
                                className="h-8 px-2.5 bg-[#e31837] hover:bg-[#be0e27] text-white text-[12px] font-medium rounded-[6px] flex items-center gap-1 transition shadow-xs cursor-pointer"
                                title="Tiếp nhận và bắt đầu nấu"
                              >
                                <CookingPot className="w-3.5 h-3.5" />
                                <span>Vào bếp</span>
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(order.orderCode, 'Cancelled')}
                                className="h-8 px-2 bg-white border border-[#dddddd] text-[#9297a0] hover:text-[#e31837] hover:border-[#fecdd3] text-[12px] rounded-[6px] transition cursor-pointer"
                                title="Hủy đơn này"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                          {order.status === 'Processing' && (
                            <button
                              onClick={() => handleUpdateStatus(order.orderCode, 'Delivering')}
                              className="h-8 px-2.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-[12px] font-medium rounded-[6px] flex items-center gap-1 transition shadow-xs cursor-pointer"
                              title="Bếp nấu xong, giao shipper"
                            >
                              <Truck className="w-3.5 h-3.5" />
                              <span>Giao Shipper</span>
                            </button>
                          )}
                          {order.status === 'Delivering' && (
                            <button
                              onClick={() => handleUpdateStatus(order.orderCode, 'Completed', 'Paid')}
                              className="h-8 px-2.5 bg-[#16a34a] hover:bg-[#15803d] text-white text-[12px] font-medium rounded-[6px] flex items-center gap-1 transition shadow-xs cursor-pointer"
                              title="Khách đã nhận và thanh toán"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Đã giao & Thu tiền</span>
                            </button>
                          )}
                          {order.status === 'Completed' && (
                            <span className="text-[12px] text-[#16a34a] font-semibold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Hoàn tất
                            </span>
                          )}
                          {order.status === 'Cancelled' && (
                            <span className="text-[12px] text-[#9297a0] flex items-center gap-1">
                              <XCircle className="w-3.5 h-3.5" /> Đã hủy
                            </span>
                          )}
                          <select
                            value={order.status}
                            onChange={(e) => handleUpdateStatus(order.orderCode, e.target.value)}
                            className="h-8 px-1 text-[11px] bg-white border border-[#dddddd] rounded-[6px] text-[#41454d] cursor-pointer hover:border-[#9297a0]"
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
