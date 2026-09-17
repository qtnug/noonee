'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, ShoppingBag, ArrowRight, User as UserIcon, ShieldAlert } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Order } from '@/types';
import { formatVND, formatDate } from '@/lib/utils';

export default function OrdersLookupPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOrders() {
      if (!user) {
        setLoading(false);
        setOrders([]);
        return;
      }

      setLoading(true);
      try {
        // Only load orders of the current user!
        const res = await fetch(`/api/orders?userId=${user.id}`);
        const data = await res.json();
        if (data.success) {
          setOrders(data.data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadOrders();
  }, [user]);

  const handleManualSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const q = searchQuery.trim().replace(/^#+/, '');
    if (!user) {
      router.push(`/orders/${encodeURIComponent(q)}`);
      return;
    }

    setLoading(true);
    try {
      // If user enters specific code, search that order
      const res = await fetch(`/api/orders/${q}`);
      const data = await res.json();
      if (data.success && data.data) {
        setOrders([data.data]);
      } else {
        setOrders([]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      o.orderCode.toLowerCase().includes(q) ||
      o.customerPhone.includes(q) ||
      o.customerName.toLowerCase().includes(q)
    );
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending':
        return <span className="px-2.5 py-1 rounded-[4px] text-[12px] font-semibold bg-[#fff1f2] text-[#e31837] border border-[#fecdd3]">Chờ tiếp nhận</span>;
      case 'Processing':
        return <span className="px-2.5 py-1 rounded-[4px] text-[12px] font-semibold bg-[#f8fafc] text-[#254fad] border border-[#458fff]">Đang nấu</span>;
      case 'Delivering':
        return <span className="px-2.5 py-1 rounded-[4px] text-[12px] font-semibold bg-[#fff1f2] text-[#e31837] border border-[#fecdd3]">Đang giao</span>;
      case 'Completed':
        return <span className="px-2.5 py-1 rounded-[4px] text-[12px] font-semibold bg-[#f8fafc] text-[#006400] border border-[#39bf45]">Hoàn thành</span>;
      case 'Cancelled':
        return <span className="px-2.5 py-1 rounded-[4px] text-[12px] font-semibold bg-[#f8fafc] text-[#9297a0] border border-[#dddddd]">Đã hủy</span>;
      default:
        return <span className="px-2.5 py-1 rounded-[4px] text-[12px] font-semibold bg-[#f8fafc] text-[#333840] border border-[#dddddd]">{status}</span>;
    }
  };

  return (
    <div className="bg-white min-h-screen py-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <div className="space-y-2 text-center max-w-xl mx-auto">
          <h1 className="text-3xl font-normal text-[#181d26]">Đơn hàng của bạn</h1>
          <p className="text-[14px] text-[#41454d]">
            {user
              ? `Xem danh sách lịch sử đơn hàng của tài khoản ${user.fullName} (${user.username})`
              : 'Đăng nhập tài khoản để xem lịch sử đơn hàng của bạn hoặc tra cứu theo mã đơn'}
          </p>

          {/* Search input for logged in users */}
          {user && (
            <form onSubmit={handleManualSearch} className="pt-4">
              <div className="relative max-w-md mx-auto flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9297a0]" />
                  <input
                    type="text"
                    placeholder="Tìm theo mã đơn, món ăn, SĐT..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-11 pl-11 pr-4 text-[14px] text-[#181d26] bg-white border border-[#dddddd] rounded-[6px] focus:outline-none focus:border-[#e31837] focus:ring-1 focus:ring-[#e31837] transition font-mono"
                  />
                </div>
                <button
                  type="submit"
                  className="h-11 px-5 bg-[#e31837] hover:bg-[#be0e27] text-white text-[13px] font-medium rounded-[6px] transition cursor-pointer"
                >
                  Tìm kiếm
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Not Logged In Banner with Guest Order Lookup */}
        {!user && (
          <div className="p-8 bg-white border border-[#dddddd] rounded-[12px] text-center space-y-5 max-w-lg mx-auto shadow-xs">
            <div className="w-14 h-14 rounded-full bg-[#fff1f2] text-[#e31837] flex items-center justify-center mx-auto border border-[#fecdd3]">
              <UserIcon className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-normal text-[#181d26]">Bạn chưa đăng nhập tài khoản</h3>
              <p className="text-[13px] text-[#41454d]">
                Đăng nhập để xem danh sách toàn bộ các món ăn bạn đã từng đặt, trạng thái giao nhận và viết đánh giá món ăn.
              </p>
            </div>
            <div>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#e31837] hover:bg-[#be0e27] text-white font-medium text-[13px] rounded-[8px] transition shadow-xs"
              >
                Đăng nhập ngay
              </Link>
            </div>

            <div className="pt-4 border-t border-[#dddddd] space-y-2">
              <span className="text-[12px] text-[#9297a0] block">Hoặc tra cứu nhanh đơn hàng vãng lai bằng mã:</span>
              <form onSubmit={handleManualSearch} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nhập mã đơn (VD: DH017439...)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 h-10 px-3 text-[13px] text-[#181d26] bg-white border border-[#dddddd] rounded-[6px] focus:outline-none focus:border-[#e31837] font-mono"
                />
                <button
                  type="submit"
                  className="h-10 px-4 bg-[#181d26] hover:bg-[#333840] text-white text-[13px] font-medium rounded-[6px] transition cursor-pointer"
                >
                  Tra cứu
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Orders List */}
        {loading ? (
          <div className="text-center py-16 text-[#9297a0] text-[14px]">Đang tải dữ liệu đơn hàng...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-16 space-y-3 bg-[#f8fafc] rounded-[10px] border border-[#dddddd] max-w-xl mx-auto p-8">
            <ShoppingBag className="w-10 h-10 text-[#9297a0] mx-auto opacity-50" />
            <h3 className="text-[16px] font-medium text-[#181d26]">Không tìm thấy đơn hàng nào</h3>
            <p className="text-[13px] text-[#41454d]">
              {user ? 'Bạn chưa có đơn hàng nào trong tài khoản.' : 'Vui lòng nhập đúng mã đơn hàng hoặc đăng nhập.'}
            </p>
            <div className="pt-2">
              <Link
                href="/menu"
                className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#e31837] hover:underline"
              >
                <span>Xem thực đơn đặt món ngay</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-[14px] text-[#41454d] pb-2 border-b border-[#dddddd]">
              <span>Tìm thấy <strong>{filteredOrders.length}</strong> đơn hàng</span>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {filteredOrders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white border border-[#dddddd] rounded-[10px] p-6 hover:border-[#e31837] hover:shadow-xs transition space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#dddddd]">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-[16px] text-[#181d26]">
                        #{order.orderCode}
                      </span>
                      <span className="text-[12px] text-[#9297a0]">
                        {formatDate(order.createdAt)}
                      </span>
                    </div>
                    <div>{getStatusBadge(order.status)}</div>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-[13px]">
                    <div className="space-y-1">
                      <div className="text-[#181d26]">
                        Người nhận: <span className="font-semibold">{order.customerName}</span> ({order.customerPhone})
                      </div>
                      <div className="text-[#41454d] line-clamp-1">
                        Địa chỉ: {order.deliveryAddress}
                      </div>
                      <div className="text-[#9297a0]">
                        Thanh toán: <span className="font-medium text-[#181d26]">{order.paymentMethod === 'Sepay' ? 'Chuyển khoản VietQR' : 'Tiền mặt COD'}</span> •{' '}
                        <span className={order.paymentStatus === 'Paid' ? 'text-[#006400] font-semibold' : 'text-[#e31837] font-semibold'}>
                          {order.paymentStatus === 'Paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                        </span>
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#dddddd]">
                      <div className="text-right">
                        <span className="text-[11px] text-[#9297a0] block">Tổng thanh toán</span>
                        <span className="text-[17px] font-bold text-[#e31837]">
                          {formatVND(order.totalAmount)}
                        </span>
                      </div>

                      <Link
                        href={`/orders/${order.orderCode}`}
                        className="inline-flex items-center gap-1 text-[13px] font-semibold text-white bg-[#e31837] hover:bg-[#be0e27] px-4 py-2 rounded-[6px] transition cursor-pointer"
                      >
                        <span>Xem chi tiết & Đánh giá</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
