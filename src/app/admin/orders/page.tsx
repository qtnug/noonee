'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  CiShoppingBasket as ShoppingBag,
  CiSearch as Search,
  CiRedo as RefreshCw,
  CiRead as Eye,
  CiBowlNoodles as CookingPot,
  CiDeliveryTruck as Truck,
  CiCircleCheck as CheckCircle2,
  CiCircleRemove as XCircle,
  CiRedo as Loader2,
} from 'react-icons/ci';
import { Order } from '@/types';
import { formatVND, formatDate } from '@/lib/utils';
import { useAdminBranch } from '@/context/AdminBranchContext';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const { adminBranch: branchFilter, setAdminBranch: setBranchFilter } = useAdminBranch();
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Cancellation Modal state
  const [cancelModalOrder, setCancelModalOrder] = useState<Order | null>(null);
  const [cancelReasonInput, setCancelReasonInput] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState('');

  const fetchOrders = async () => {
    try {
      const query = new URLSearchParams();
      if (statusFilter !== 'all') query.set('status', statusFilter);
      if (branchFilter !== 'all') query.set('branch', branchFilter);
      const cleaned = searchQuery.trim().replace(/^#+/, '');
      if (cleaned) query.set('search', cleaned);

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
    setCurrentPage(1);
    fetchOrders();
  }, [statusFilter, branchFilter, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(orders.length / pageSize));
  const paginatedOrders = orders.slice((currentPage - 1) * pageSize, currentPage * pageSize);

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

  const handleConfirmCancel = async () => {
    if (!cancelModalOrder) return;
    if (!cancelReasonInput.trim()) {
      setCancelError('Vui lòng nhập lí do hủy đơn để thông báo cho khách hàng');
      return;
    }

    setIsCancelling(true);
    setCancelError('');
    try {
      const res = await fetch(`/api/orders/${cancelModalOrder.orderCode}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'Cancelled',
          action: 'cancel',
          cancelReason: cancelReasonInput.trim(),
        }),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || 'Lỗi khi hủy đơn hàng');
      }

      setToastMessage(
        data.refundedAmount && data.refundedAmount > 0
          ? `Đã hủy đơn #${cancelModalOrder.orderCode} & tự động hoàn ${formatVND(data.refundedAmount)} vào ví khách!`
          : `Đã hủy đơn #${cancelModalOrder.orderCode} thành công`
      );
      setTimeout(() => setToastMessage(null), 4000);
      setCancelModalOrder(null);
      setCancelReasonInput('');
      fetchOrders();
    } catch (err: any) {
      setCancelError(err.message || 'Có lỗi xảy ra khi hủy đơn');
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-normal text-[#181d26]">Quản lý đơn hàng</h1>
          <p className="text-[13px] sm:text-[14px] text-[#41454d] mt-0.5 sm:mt-1">
            Xem danh sách đơn hàng, cập nhật trạng thái chế biến và giao hàng
          </p>
        </div>

        <button
          onClick={fetchOrders}
          className="h-9 sm:h-10 px-3.5 sm:px-4 bg-white border border-[#dddddd] hover:bg-[#f8fafc] text-[#181d26] text-[12px] sm:text-[13px] font-medium rounded-[6px] flex items-center gap-2 transition self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className="w-4 h-4 text-[#9297a0]" />
          <span>Làm mới danh sách</span>
        </button>
      </div>

      {/* Branch Filter Tabs */}
      <div className="bg-white p-3 rounded-[10px] border border-[#dddddd] shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#A30029]" />
          <span className="text-[13px] font-bold text-[#181d26]">Cơ sở lọc đơn:</span>
          <span className="text-[12px] text-[#9297a0]">
            {branchFilter === 'all'
              ? '(Tất cả 2 cơ sở)'
              : branchFilter === '1'
              ? '(Chỉ CS 120 Yên Lãng)'
              : '(Chỉ CS 269 Cầu Giấy)'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-gray-100 rounded-lg">
          <button
            onClick={() => setBranchFilter('all')}
            className={`px-3 py-1.5 rounded-md text-[12px] font-bold transition cursor-pointer ${
              branchFilter === 'all'
                ? 'bg-[#A30029] text-white shadow-xs'
                : 'text-[#475569] hover:text-[#0f172a] hover:bg-white/60'
            }`}
          >
            🏢 Cả 2 cơ sở
          </button>
          <button
            onClick={() => setBranchFilter('1')}
            className={`px-3 py-1.5 rounded-md text-[12px] font-bold transition cursor-pointer ${
              branchFilter === '1'
                ? 'bg-[#A30029] text-white shadow-xs'
                : 'text-[#475569] hover:text-[#0f172a] hover:bg-white/60'
            }`}
          >
            📍 CS1: 120 Yên Lãng
          </button>
          <button
            onClick={() => setBranchFilter('2')}
            className={`px-3 py-1.5 rounded-md text-[12px] font-bold transition cursor-pointer ${
              branchFilter === '2'
                ? 'bg-[#A30029] text-white shadow-xs'
                : 'text-[#475569] hover:text-[#0f172a] hover:bg-white/60'
            }`}
          >
            📍 CS2: 269 Cầu Giấy
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-[10px] border border-[#dddddd] flex flex-col md:flex-row gap-3 sm:gap-4 items-stretch md:items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#9297a0] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Tìm theo mã đơn, khách, SĐT..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-4 text-[13px] bg-white border border-[#dddddd] rounded-[6px] focus:outline-none focus:border-[#A30029] text-[#181d26]"
          />
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full md:w-auto pb-1 md:pb-0">
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
              className={`h-8 px-3 rounded-[6px] text-[12px] font-medium shrink-0 transition border cursor-pointer ${
                statusFilter === tab.key
                  ? 'bg-[#A30029] text-white border-[#A30029] shadow-xs'
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
            <table className="w-full text-left text-[13px] min-w-[750px]">
              <thead className="bg-[#f8fafc] border-b border-[#dddddd] text-[#9297a0] font-medium uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Mã đơn</th>
                  <th className="py-3 px-4">Cơ sở</th>
                  <th className="py-3 px-4">Khách hàng & Địa chỉ</th>
                  <th className="py-3 px-4">Tổng tiền</th>
                  <th className="py-3 px-4">Phương thức</th>
                  <th className="py-3 px-4">Thanh toán</th>
                  <th className="py-3 px-4">Trạng thái bếp</th>
                  <th className="py-3 px-4 text-right">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#dddddd]">
                {paginatedOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-[#f8fafc] transition">
                    <td className="py-3.5 px-4 font-mono font-medium text-[#181d26]">
                      <Link href={`/orders/${order.orderCode}`} className="hover:underline">
                        #{order.orderCode}
                      </Link>
                      {order.groupCode && (
                        <span className="inline-block mt-0.5 text-[10px] font-semibold px-1.5 py-0.2 rounded bg-[#fee2e2] text-[#A30029] border border-[#fecdd3]">
                          Đơn nhóm #{order.groupCode}
                        </span>
                      )}
                      <span className="block text-[11px] text-[#9297a0] font-normal">
                        {formatDate(order.createdAt)}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {order.branchId === 2 ? (
                        <span className="px-2 py-0.5 rounded-[4px] bg-indigo-50 text-indigo-700 border border-indigo-200 text-[11px] font-bold">
                          CS 269 Cầu Giấy
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-[4px] bg-rose-50 text-[#A30029] border border-rose-200 text-[11px] font-bold">
                          CS 120 Yên Lãng
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="font-medium text-[#181d26]">{order.customerName}</div>
                      <div className="text-[#9297a0] text-[12px]">{order.customerPhone}</div>
                      <div className="text-[#41454d] text-[12px] truncate">{order.deliveryAddress}</div>
                      {order.notes && (
                        <div className="text-[11px] text-[#A30029] italic truncate">Ghi chú: {order.notes}</div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-[#181d26]">
                      <div>{formatVND(order.totalAmount)}</div>
                      {order.discountAmount && order.discountAmount > 0 ? (
                        <div className="text-[11px] text-[#A30029] font-normal">
                          Giảm: -{formatVND(order.discountAmount)} ({order.couponCode || 'Mã'})
                        </div>
                      ) : null}
                    </td>
                    <td className="py-3.5 px-4">
                      {(() => {
                        const methodLabels: Record<string, string> = {
                          Sepay: 'Chuyển khoản (VietQR)',
                          COD: 'Tiền mặt (COD)',
                          Wallet: 'Ví NooNee',
                        };
                        return (
                          <span className="px-2 py-0.5 rounded-[4px] bg-[#f8fafc] border border-[#dddddd] text-[#333840] text-[11px] font-medium whitespace-nowrap">
                            {methodLabels[order.paymentMethod] || order.paymentMethod || 'Chuyển khoản'}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="py-3.5 px-4">
                      <select
                        value={order.paymentStatus}
                        onChange={(e) => handleStatusChange(order.orderCode, order.status, e.target.value)}
                        className={`h-8 px-2 rounded-[6px] text-[12px] font-medium border ${
                          order.paymentStatus === 'Paid'
                            ? 'bg-white text-[#006400] border-[#39bf45]'
                            : 'bg-[#fff1f2] text-[#A30029] border-[#fecdd3]'
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
                            Pending: { label: 'Chờ tiếp nhận', cls: 'bg-[#fff1f2] text-[#A30029] border-[#fecdd3]' },
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
                            <Loader2 className="w-3 h-3 animate-spin text-[#A30029]" />
                          </span>
                        ) : order.status === 'Cancelled' ? (
                          <div className="space-y-1">
                            <span className="px-2 py-0.5 rounded-[4px] text-[11px] font-medium border bg-[#f8fafc] text-[#64748b] border-[#e2e8f0] inline-block">
                              Đã hủy
                            </span>
                            {order.cancelReason && (
                              <p className="text-[11px] text-[#A30029] max-w-[180px] truncate" title={order.cancelReason}>
                                Lý do: {order.cancelReason}
                              </p>
                            )}
                            {order.refundStatus === 'Refunded' && (
                              <span className="text-[10px] bg-[#f0fdf4] text-[#16a34a] border border-[#bbf7d0] px-1.5 py-0.5 rounded-[4px] font-semibold inline-block">
                                Đã hoàn ví
                              </span>
                            )}
                          </div>
                        ) : (
                          <>
                            {order.status === 'Pending' && (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleStatusChange(order.orderCode, 'Processing')}
                                  className="h-7 px-2.5 bg-[#A30029] hover:bg-[#850021] text-white text-[11px] font-semibold rounded-[4px] flex items-center gap-1 transition cursor-pointer shadow-xs"
                                  title="Admin xác nhận đơn và đưa vào bếp nấu"
                                >
                                  <CookingPot className="w-3.5 h-3.5" />
                                  <span>Xác nhận</span>
                                </button>
                                <button
                                  onClick={() => {
                                    setCancelModalOrder(order);
                                    setCancelReasonInput('');
                                    setCancelError('');
                                  }}
                                  className="h-7 px-2 bg-white hover:bg-[#fff1f2] text-[#A30029] border border-[#fecdd3] text-[11px] font-medium rounded-[4px] flex items-center gap-1 transition cursor-pointer"
                                  title="Hủy đơn hàng này (hoàn tiền vào ví nếu đã thanh toán)"
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                  <span>Hủy</span>
                                </button>
                              </div>
                            )}
                            {order.status === 'Processing' && (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleStatusChange(order.orderCode, 'Delivering')}
                                  className="h-7 px-2.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-[11px] font-medium rounded-[4px] flex items-center gap-1 transition cursor-pointer shadow-xs"
                                  title="Bếp nấu xong, giao Shipper"
                                >
                                  <Truck className="w-3 h-3" />
                                  <span>Giao hàng</span>
                                </button>
                                <button
                                  onClick={() => {
                                    setCancelModalOrder(order);
                                    setCancelReasonInput('');
                                    setCancelError('');
                                  }}
                                  className="h-7 px-2 bg-white hover:bg-[#fff1f2] text-[#A30029] border border-[#fecdd3] text-[11px] font-medium rounded-[4px] flex items-center gap-1 transition cursor-pointer"
                                  title="Bếp hủy đơn (Hết nguyên liệu, quá tải...)"
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                  <span>Hủy</span>
                                </button>
                              </div>
                            )}
                            {order.status === 'Delivering' && (
                              <button
                                onClick={() => handleStatusChange(order.orderCode, 'Completed', 'Paid')}
                                className="h-7 px-2.5 bg-[#16a34a] hover:bg-[#15803d] text-white text-[11px] font-medium rounded-[4px] flex items-center gap-1 transition cursor-pointer shadow-xs"
                                title="Khách đã nhận và thanh toán"
                              >
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Hoàn tất</span>
                              </button>
                            )}
                            {order.status !== 'Pending' && (
                              <select
                                value={order.status}
                                onChange={(e) => handleStatusChange(order.orderCode, e.target.value, order.paymentStatus)}
                                className="h-7 px-1 bg-white border border-[#dddddd] rounded-[4px] text-[11px] text-[#41454d] cursor-pointer hover:border-[#9297a0]"
                                title="Chuyển trạng thái bếp"
                              >
                                <option value="Processing">Nấu</option>
                                <option value="Delivering">Giao</option>
                                <option value="Completed">Xong</option>
                              </select>
                            )}
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

            {/* Pagination Controls (STT 16) */}
            {orders.length > 0 && (
              <div className="px-6 py-4 border-t border-[#dddddd] bg-[#f8fafc] flex flex-col sm:flex-row items-center justify-between gap-3 text-[13px] text-[#41454d]">
                <div>
                  Hiển thị <strong>{Math.min((currentPage - 1) * pageSize + 1, orders.length)}</strong> - <strong>{Math.min(currentPage * pageSize, orders.length)}</strong> trên tổng số <strong>{orders.length}</strong> đơn hàng
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

      {/* Floating Action Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#181d26] text-white px-4 py-3 rounded-[8px] shadow-lg flex items-center gap-2.5 text-[13px] animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-[#39bf45]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Cancellation Modal */}
      {cancelModalOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[12px] shadow-xl border border-[#dddddd] max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between pb-3 border-b border-[#dddddd]">
              <div>
                <h3 className="text-lg font-bold text-[#181d26] flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-[#A30029]" />
                  <span>Hủy đơn hàng #{cancelModalOrder.orderCode}</span>
                </h3>
                <p className="text-[13px] text-[#41454d] mt-0.5">
                  Khách: <strong>{cancelModalOrder.customerName}</strong> ({cancelModalOrder.customerPhone})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCancelModalOrder(null)}
                className="text-[#9297a0] hover:text-[#181d26] p-1 rounded hover:bg-[#f8fafc] text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* Refund info notice */}
            {cancelModalOrder.paymentStatus === 'Paid' ? (
              <div className="p-3.5 bg-[#f0fdf4] border border-[#bbf7d0] rounded-[8px] text-[13px] text-[#166534] space-y-1">
                <div className="font-semibold flex items-center gap-1.5">
                  <span>💰 Tự động hoàn tiền vào Ví ảo</span>
                </div>
                <p className="text-[12px] leading-relaxed">
                  Đơn hàng này <strong>đã thanh toán {formatVND(cancelModalOrder.totalAmount)}</strong>. Khi xác nhận hủy, toàn bộ số tiền {formatVND(cancelModalOrder.totalAmount)} sẽ được cộng ngay vào <strong>Số Dư Ví NooNee</strong> của tài khoản khách để trừ tiền cho các đơn hàng tiếp theo!
                </p>
              </div>
            ) : (
              <div className="p-3 bg-[#fff1f2] border border-[#fecdd3] rounded-[8px] text-[12px] text-[#991b1b]">
                Đơn hàng này chưa thanh toán (COD hoặc chuyển khoản chưa hoàn tất). Voucher áp dụng sẽ được hoàn trả lại cho khách.
              </div>
            )}

            {/* Reason input */}
            <div className="space-y-2">
              <label className="text-[13px] font-semibold text-[#181d26] block">
                Lí do hủy đơn <span className="text-[#A30029]">*</span>
                <span className="text-[11px] font-normal text-[#9297a0] ml-1.5">(Lí do sẽ hiển thị trên trang theo dõi của khách)</span>
              </label>
              <textarea
                rows={3}
                placeholder="Nhập lí do cụ thể..."
                value={cancelReasonInput}
                onChange={(e) => {
                  setCancelReasonInput(e.target.value);
                  setCancelError('');
                }}
                className="w-full p-3 text-[13px] bg-white border border-[#dddddd] rounded-[6px] focus:outline-none focus:border-[#A30029] focus:ring-1 focus:ring-[#A30029] text-[#181d26]"
              />

              {/* Quick tags */}
              <div className="space-y-1.5">
                <span className="text-[11px] text-[#9297a0] font-medium block">Gợi ý nhanh:</span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Hết nguyên liệu món ăn',
                    'Khách gọi yêu cầu hủy đơn',
                    'Quán quá tải đơn giờ cao điểm',
                    'Không liên lạc được với khách hàng',
                    'Địa chỉ giao ngoài phạm vi phục vụ',
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        setCancelReasonInput(preset);
                        setCancelError('');
                      }}
                      className="px-2.5 py-1 text-[11px] bg-[#f8fafc] hover:bg-[#fff1f2] hover:text-[#A30029] hover:border-[#fecdd3] text-[#41454d] border border-[#dddddd] rounded-[4px] transition cursor-pointer"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {cancelError && (
              <div className="p-2.5 bg-[#fff1f2] border border-[#fecdd3] text-[#A30029] text-[12px] rounded-[6px] font-medium">
                {cancelError}
              </div>
            )}

            {/* Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#dddddd]">
              <button
                type="button"
                disabled={isCancelling}
                onClick={() => setCancelModalOrder(null)}
                className="px-4 py-2 text-[13px] font-medium text-[#41454d] hover:bg-[#f8fafc] border border-[#dddddd] rounded-[6px] transition"
              >
                Đóng
              </button>
              <button
                type="button"
                disabled={isCancelling}
                onClick={handleConfirmCancel}
                className="px-4 py-2 bg-[#A30029] hover:bg-[#850021] text-white text-[13px] font-semibold rounded-[6px] transition flex items-center gap-1.5 disabled:opacity-50"
              >
                {isCancelling ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang xử lý...</span>
                  </>
                ) : (
                  <span>Xác nhận hủy đơn</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
