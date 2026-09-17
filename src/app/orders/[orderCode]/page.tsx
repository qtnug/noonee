'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Truck,
  CookingPot,
  QrCode,
  MapPin,
  FileText,
  Loader2,
  MessageSquare,
  AlertTriangle,
  Send,
  Star,
  X,
  ShieldAlert,
  Edit3,
  Users,
} from 'lucide-react';
import { Order, SupportMessage, Review } from '@/types';
import { formatVND, formatDate } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

export default function OrderTrackingPage() {
  const params = useParams();
  const orderCode = params.orderCode as string;
  const { user, getAuthHeader } = useAuth();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  // Chat & Complaint modal state
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setMessages] = useState<SupportMessage[]>([]);
  const [chatText, setChatText] = useState('');
  const [isComplaint, setIsComplaint] = useState(false);
  const [isSendingChat, setIsSendingChat] = useState(false);

  // Deduplicate items by productId so each dish is only reviewed once per order
  const uniqueReviewableItems = React.useMemo(() => {
    if (!order?.items) return [];
    const map = new Map<number, (typeof order.items)[0]>();
    for (const item of order.items) {
      if (!map.has(item.productId)) {
        map.set(item.productId, item);
      }
    }
    return Array.from(map.values());
  }, [order?.items]);

  // Per-item review state
  const [reviewRatings, setReviewRatings] = useState<{ [key: number]: number }>({});
  const [reviewComments, setReviewComments] = useState<{ [key: number]: string }>({});
  const [existingReviews, setExistingReviews] = useState<{ [key: number]: Review }>({});
  const [editingItem, setEditingItem] = useState<{ [key: number]: boolean }>({});
  const [reviewSubmitting, setReviewSubmitting] = useState<{ [key: number]: boolean }>({});

  const fetchOrder = async () => {
    try {
      const res = await fetch(`/api/orders/${orderCode}`);
      const data = await res.json();
      if (data.success) {
        setOrder(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
    const timer = setInterval(fetchOrder, 5000);
    return () => clearInterval(timer);
  }, [orderCode]);

  // Fetch reviews for unique items in this order
  const fetchOrderReviews = async () => {
    if (!uniqueReviewableItems.length || !orderCode) return;
    for (const item of uniqueReviewableItems) {
      try {
        const res = await fetch(`/api/reviews?productId=${item.productId}&orderCode=${orderCode}`);
        const data = await res.json();
        if (data.success && data.data?.userReview) {
          setExistingReviews((prev) => ({ ...prev, [item.productId]: data.data.userReview }));
          setReviewRatings((prev) => ({ ...prev, [item.productId]: data.data.userReview.rating }));
          setReviewComments((prev) => ({ ...prev, [item.productId]: data.data.userReview.comment }));
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  useEffect(() => {
    if (uniqueReviewableItems.length > 0) {
      fetchOrderReviews();
    }
  }, [order?.status, orderCode, uniqueReviewableItems]);

  // Support chat fetch
  const fetchChatMessages = async () => {
    if (!orderCode) return;
    try {
      const res = await fetch(`/api/support?orderCode=${orderCode}`);
      const data = await res.json();
      if (data.success) {
        setMessages(data.data || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (showChat) {
      fetchChatMessages();
      const interval = setInterval(fetchChatMessages, 3500);
      return () => clearInterval(interval);
    }
  }, [showChat, orderCode]);

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatText.trim()) return;

    setIsSendingChat(true);
    try {
      let customerName = order?.customerName || 'Khách hàng';
      let userId = order?.userId;
      try {
        const stored = localStorage.getItem('noonee_customer');
        if (stored) {
          const u = JSON.parse(stored);
          if (u.fullName) customerName = u.fullName;
          if (u.id) userId = u.id;
        }
      } catch {}

      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderCode,
          userId,
          senderRole: 'customer',
          senderName: customerName,
          message: chatText.trim(),
          isComplaint,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setChatText('');
        setIsComplaint(false);
        fetchChatMessages();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSendingChat(false);
    }
  };

  const handleItemReview = async (productId: number, productName: string) => {
    const rating = reviewRatings[productId] || 5;
    const comment = reviewComments[productId] || '';

    if (comment.trim().length < 5) {
      alert('Vui lòng nhập lời nhận xét có ít nhất 5 ký tự');
      return;
    }

    setReviewSubmitting((prev) => ({ ...prev, [productId]: true }));
    try {
      let customerName = user?.fullName || order?.customerName || 'Khách hàng';
      let userId = user?.id || order?.userId;
      try {
        const stored = localStorage.getItem('noonee_customer');
        if (stored) {
          const u = JSON.parse(stored);
          if (u.fullName) customerName = u.fullName;
          if (u.id) userId = u.id;
        }
      } catch {}

      const authHeaders = getAuthHeader ? getAuthHeader() : {};
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({
          productId,
          userId,
          customerName,
          rating,
          comment: comment.trim(),
          orderCode,
        }),
      });

      const data = await res.json();
      if (data.success && data.data) {
        setExistingReviews((prev) => ({ ...prev, [productId]: data.data }));
        setEditingItem((prev) => ({ ...prev, [productId]: false }));
      } else {
        alert(data.message || 'Không thể gửi đánh giá');
      }
    } catch (e) {
      console.error(e);
      alert('Có lỗi xảy ra khi gửi đánh giá');
    } finally {
      setReviewSubmitting((prev) => ({ ...prev, [productId]: false }));
    }
  };

  if (loading) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-[#e31837] mx-auto" />
        <p className="text-[14px] text-[#41454d]">Đang tải trạng thái đơn hàng...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center space-y-4">
        <h2 className="text-xl font-normal text-[#181d26]">Không tìm thấy đơn hàng</h2>
        <Link href="/orders" className="text-[13px] text-[#e31837] hover:underline">
          Quay lại danh sách đơn hàng
        </Link>
      </div>
    );
  }

  const steps = [
    { key: 'Pending', label: 'Tiếp nhận', icon: Clock, desc: 'Đã nhận đơn' },
    { key: 'Processing', label: 'Chế biến', icon: CookingPot, desc: 'Bếp đang nấu' },
    { key: 'Delivering', label: 'Đang giao', icon: Truck, desc: 'Shipper đang giao' },
    { key: 'Completed', label: 'Hoàn thành', icon: CheckCircle2, desc: 'Đã giao món' },
  ];

  const getStepIndex = (status: string) => {
    switch (status) {
      case 'Pending':
        return 0;
      case 'Processing':
        return 1;
      case 'Delivering':
        return 2;
      case 'Completed':
        return 3;
      default:
        return 0;
    }
  };

  const currentStep = getStepIndex(order.status);

  return (
    <div className="bg-white min-h-screen py-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#dddddd] gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/orders"
              className="p-2 text-[#41454d] hover:text-[#e31837] bg-white border border-[#dddddd] rounded-[6px] transition"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-normal text-[#181d26]">
                  Đơn hàng <span className="text-[#e31837] font-bold">#{order.orderCode}</span>
                </h1>
                {order.status === 'Cancelled' ? (
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-[4px] border bg-[#fff1f2] text-[#e31837] border-[#fecdd3]">
                    Đã hủy đơn
                  </span>
                ) : (
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded-[4px] border ${
                      order.paymentStatus === 'Paid'
                        ? 'bg-[#f8fafc] text-[#006400] border-[#39bf45]'
                        : 'bg-[#fff1f2] text-[#e31837] border-[#fecdd3]'
                    }`}
                  >
                    {order.paymentStatus === 'Paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                  </span>
                )}
                {order.groupCode && (
                  <Link
                    href={`/group/${order.groupCode}`}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-[4px] border bg-[#fee2e2] text-[#e31837] border-[#fecdd3] hover:bg-[#fecdd3] transition"
                  >
                    <Users className="w-3 h-3" /> Đơn nhóm #{order.groupCode}
                  </Link>
                )}
              </div>
              <p className="text-[13px] text-[#41454d] mt-0.5">
                Thời gian đặt: {formatDate(order.createdAt)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowChat(true)}
              className="h-10 px-3.5 bg-white border border-[#e31837] text-[#e31837] hover:bg-[#fff1f2] rounded-[6px] text-[13px] font-semibold flex items-center gap-1.5 transition shadow-xs cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Khiếu nại / Chat Quán</span>
            </button>

            {order.status !== 'Cancelled' && order.paymentStatus === 'Unpaid' && order.paymentMethod === 'Sepay' && (
              <Link
                href={`/payment/${order.orderCode}`}
                className="h-10 px-4 bg-[#e31837] hover:bg-[#be0e27] active:bg-[#a50b20] text-white rounded-[6px] text-[13px] font-semibold flex items-center gap-1.5 transition shadow-xs"
              >
                <QrCode className="w-4 h-4" />
                <span>Thanh toán VietQR</span>
              </Link>
            )}
          </div>
        </div>

        {/* Realtime Progress Stepper or Cancellation Banner */}
        {order.status === 'Cancelled' ? (
          <div className="bg-[#fff1f2] rounded-[10px] p-6 sm:p-8 border border-[#fecdd3] space-y-4 shadow-xs">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-[8px] bg-[#e31837] text-white flex items-center justify-center shrink-0 shadow-xs">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="flex-1 space-y-1.5">
                <h2 className="text-lg font-bold text-[#e31837]">
                  Đơn hàng này đã bị hủy
                </h2>
                {order.cancelReason ? (
                  <p className="text-[14px] text-[#181d26]">
                    <strong>Lý do từ quán:</strong> {order.cancelReason}
                  </p>
                ) : (
                  <p className="text-[13px] text-[#41454d]">
                    Đơn hàng đã được hủy bởi nhà hàng hoặc theo yêu cầu của quý khách.
                  </p>
                )}

                {order.refundStatus === 'Refunded' && (
                  <div className="mt-3 p-3 bg-white rounded-[6px] border border-[#fecdd3] text-[13px] text-[#166534] font-medium flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#16a34a] shrink-0" />
                    <span>
                      Số tiền {formatVND(order.totalAmount + (order.walletAmountUsed || 0))} đã được hoàn trả 100% vào <strong>Số Dư Ví NooNee</strong> của bạn. Bạn có thể sử dụng trừ thẳng cho các đơn hàng tiếp theo!
                    </span>
                  </div>
                )}

                {order.couponCode && (
                  <p className="text-[12px] text-[#41454d] mt-1">
                    * Voucher ưu đãi <strong>{order.couponCode}</strong> đã được hoàn lại tài khoản của bạn.
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-[10px] p-6 sm:p-8 border border-[#dddddd] space-y-6 shadow-xs">
            <h2 className="text-[16px] font-semibold text-[#181d26]">
              Tiến độ giao hàng thời gian thực
            </h2>

            <div className="grid grid-cols-4 gap-2 sm:gap-4 relative">
              {steps.map((s, idx) => {
                const Icon = s.icon;
                const isFinished = idx <= currentStep;
                const isCurrent = idx === currentStep;

                return (
                  <div key={s.key} className="flex flex-col items-center text-center space-y-2">
                    <div
                      className={`w-11 h-11 rounded-[6px] flex items-center justify-center transition shadow-xs ${
                        isCurrent
                          ? 'bg-[#e31837] text-white animate-pulse'
                          : isFinished
                          ? 'bg-[#fff1f2] border border-[#fecdd3] text-[#e31837]'
                          : 'bg-[#f8fafc] border border-[#dddddd] text-[#9297a0]'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4
                        className={`text-[13px] font-medium ${
                          isCurrent
                            ? 'text-[#e31837] font-bold'
                            : isFinished
                            ? 'text-[#181d26]'
                            : 'text-[#9297a0]'
                        }`}
                      >
                        {s.label}
                      </h4>
                      <p className="text-[11px] text-[#9297a0] hidden sm:block mt-0.5">
                        {s.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Recipient info */}
          <div className="bg-white rounded-[10px] p-6 border border-[#dddddd] space-y-4 text-[13px] shadow-xs">
            <h3 className="text-[14px] font-semibold text-[#181d26] flex items-center gap-2 pb-2 border-b border-[#dddddd]">
              <MapPin className="w-4 h-4 text-[#e31837]" />
              <span>Địa chỉ nhận món</span>
            </h3>
            <div className="space-y-2 text-[#41454d]">
              <div>
                <span className="text-[#9297a0] text-[12px] block">Người nhận:</span>
                <strong className="text-[#181d26] font-semibold">{order.customerName}</strong>
              </div>
              <div>
                <span className="text-[#9297a0] text-[12px] block">Số điện thoại:</span>
                <strong className="text-[#181d26] font-semibold">{order.customerPhone}</strong>
              </div>
              <div>
                <span className="text-[#9297a0] text-[12px] block">Địa chỉ giao:</span>
                <span className="text-[#181d26]">{order.deliveryAddress}</span>
              </div>
              {order.notes && (
                <div>
                  <span className="text-[#9297a0] text-[12px] block">Ghi chú của khách:</span>
                  <span className="text-[#e31837] bg-[#fff1f2] p-2 rounded-[4px] block border border-[#fecdd3] mt-1 font-medium">
                    {order.notes}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Payment info */}
          <div className="bg-white rounded-[10px] p-6 border border-[#dddddd] space-y-4 text-[13px] shadow-xs">
            <h3 className="text-[14px] font-semibold text-[#181d26] flex items-center gap-2 pb-2 border-b border-[#dddddd]">
              <FileText className="w-4 h-4 text-[#e31837]" />
              <span>Thông tin thanh toán</span>
            </h3>
            <div className="space-y-2.5 text-[#41454d]">
              <div className="flex justify-between">
                <span>Phương thức:</span>
                <strong className="text-[#181d26] font-semibold">
                  {order.paymentMethod === 'Sepay' ? 'Chuyển khoản Ngân hàng (Mã VietQR)' : 'Tiền mặt khi nhận hàng (COD)'}
                </strong>
              </div>
              <div className="flex justify-between">
                <span>Trạng thái:</span>
                <strong className={order.paymentStatus === 'Paid' ? 'text-[#006400] font-semibold' : 'text-[#e31837] font-semibold'}>
                  {order.paymentStatus === 'Paid' ? 'Đã thanh toán thành công' : 'Chưa thanh toán'}
                </strong>
              </div>
              {order.discountAmount && order.discountAmount > 0 ? (
                <>
                  <div className="flex justify-between">
                    <span>Tạm tính món:</span>
                    <span className="text-[#181d26] font-medium">{formatVND(order.totalAmount + order.discountAmount)}</span>
                  </div>
                  <div className="flex justify-between text-[#e31837]">
                    <span>Ưu đãi ({order.couponCode || 'Giảm giá'}):</span>
                    <span className="font-semibold">- {formatVND(order.discountAmount)}</span>
                  </div>
                </>
              ) : null}
              {order.walletAmountUsed && order.walletAmountUsed > 0 ? (
                <div className="flex justify-between text-[#2563eb]">
                  <span>Đã trừ từ số dư ví:</span>
                  <span className="font-semibold">- {formatVND(order.walletAmountUsed)}</span>
                </div>
              ) : null}
              <div className="flex justify-between text-[15px] font-bold text-[#181d26] pt-3 border-t border-[#dddddd]">
                <span>Tổng thanh toán:</span>
                <span className="text-[#e31837] text-lg">{formatVND(order.totalAmount)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Ordered Items Table */}
        <div className="bg-white rounded-[10px] p-6 sm:p-8 border border-[#dddddd] space-y-4 shadow-xs">
          <h3 className="text-[14px] font-semibold text-[#181d26]">
            Danh sách món ăn trong đơn
          </h3>
          <div className="divide-y divide-[#dddddd] text-[13px]">
            {order.items?.map((item, idx) => (
              <div key={idx} className="py-3.5 first:pt-0 flex justify-between items-start gap-4">
                <div className="space-y-1">
                  <span className="font-semibold text-[#181d26] block text-[14px]">{item.productName}</span>

                  {item.toppings && (
                    <div className="text-[12px] text-[#41454d] flex items-center gap-1.5 flex-wrap">
                      <span className="font-semibold text-[#e31837]">Món thêm:</span>
                      <span className="bg-[#fff1f2] px-2 py-0.5 rounded border border-[#fecdd3] text-[#e31837]">
                        {item.toppings}
                      </span>
                    </div>
                  )}

                  {item.note && (
                    <div className="text-[12px] text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded border border-amber-200 inline-block">
                      <strong>Ghi chú bếp:</strong> "{item.note}"
                    </div>
                  )}

                  <span className="text-[#9297a0] block text-[12px]">
                    Đơn giá: {formatVND(item.price)}
                  </span>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[#41454d] mr-4 text-[13px]">x{item.quantity}</span>
                  <span className="font-bold text-[#e31837] text-[15px]">
                    {formatVND(item.total || item.price * item.quantity)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Customer Reviews & Ratings Section for Items in this order */}
        <div className="bg-white rounded-[10px] p-6 sm:p-8 border border-[#dddddd] space-y-6 shadow-xs">
          <div className="border-b border-[#dddddd] pb-4">
            <h3 className="text-[16px] font-semibold text-[#181d26] flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
              <span>Đánh giá món ăn sau khi nhận hàng</span>
            </h3>
            <p className="text-[13px] text-[#41454d] mt-1">
              {order.status === 'Completed'
                ? 'Bạn thấy món ăn như thế nào? Hãy chia sẻ số sao và cảm nhận của bạn để giúp quán phục vụ tốt hơn nhé!'
                : 'Mục đánh giá sẽ được mở sau khi đơn hàng được giao thành công.'}
            </p>
          </div>

          {order.status !== 'Completed' ? (
            <div className="p-6 bg-[#f8fafc] rounded-[8px] border border-[#dddddd] text-center space-y-2">
              <Clock className="w-8 h-8 text-[#9297a0] mx-auto opacity-70" />
              <h4 className="text-[14px] font-semibold text-[#181d26]">
                Đơn hàng đang được thực hiện
              </h4>
              <p className="text-[12px] text-[#41454d] max-w-md mx-auto">
                Hiện tại đơn hàng đang ở trạng thái{' '}
                <strong>
                  {order.status === 'Pending'
                    ? 'Chờ tiếp nhận'
                    : order.status === 'Processing'
                    ? 'Đang nấu'
                    : 'Đang giao hàng'}
                </strong>
                . Bạn vui lòng chờ nhận món thành công để gửi đánh giá nhé!
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#dddddd] space-y-6">
              {uniqueReviewableItems.map((item) => {
                const existing = existingReviews[item.productId];
                const isEditing = editingItem[item.productId];
                const currentRating = reviewRatings[item.productId] || 5;
                const currentComment = reviewComments[item.productId] || '';
                const isSubmitting = reviewSubmitting[item.productId];

                return (
                  <div key={item.productId} className="pt-6 first:pt-0 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 bg-[#f8fafc] rounded-[8px] border border-[#dddddd]">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-[6px] bg-[#fff1f2] border border-[#fecdd3] flex items-center justify-center text-[#e31837] shrink-0">
                          <CookingPot className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-[11px] font-medium text-[#9297a0] uppercase tracking-wider">Món ăn cần đánh giá</div>
                          <span className="font-semibold text-[#181d26] text-[15px]">
                            {item.productName}
                          </span>
                        </div>
                      </div>
                      {existing && !isEditing ? (
                        <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#006400] bg-[#f0fdf4] border border-[#bbf7d0] px-3 py-1 rounded-[4px] self-start sm:self-auto">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Đã đánh giá
                        </span>
                      ) : null}
                    </div>

                    {existing && !isEditing ? (
                      <div className="bg-[#f8fafc] p-4 rounded-[8px] border border-[#dddddd] space-y-2">
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-4 h-4 ${
                                s <= existing.rating
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                          <span className="text-[12px] font-bold text-[#e31837] ml-2">
                            {existing.rating} / 5 sao
                          </span>
                        </div>
                        <p className="text-[13px] text-[#181d26] italic">
                          "{existing.comment}"
                        </p>
                        <div className="pt-2 flex items-center justify-between">
                          <span className="text-[11px] text-[#9297a0]">
                            {formatDate(existing.createdAt)}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setReviewRatings((prev) => ({
                                ...prev,
                                [item.productId]: existing.rating,
                              }));
                              setReviewComments((prev) => ({
                                ...prev,
                                [item.productId]: existing.comment,
                              }));
                              setEditingItem((prev) => ({
                                ...prev,
                                [item.productId]: true,
                              }));
                            }}
                            className="h-7 px-3 bg-white border border-[#dddddd] hover:border-[#e31837] text-[12px] font-medium text-[#181d26] rounded-[4px] transition flex items-center gap-1 cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-[#e31837]" />
                            <span>Sửa đánh giá</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3 bg-[#f8fafc] p-4 rounded-[8px] border border-[#dddddd]">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[12px] font-medium text-[#181d26]">Số sao:</span>
                          {[1, 2, 3, 4, 5].map((s) => (
                            <button
                              key={s}
                              type="button"
                              onClick={() =>
                                setReviewRatings((prev) => ({
                                  ...prev,
                                  [item.productId]: s,
                                }))
                              }
                              className="p-1 hover:scale-110 transition cursor-pointer"
                            >
                              <Star
                                className={`w-5 h-5 ${
                                  currentRating >= s
                                    ? 'fill-amber-400 text-amber-400'
                                    : 'text-gray-300'
                                }`}
                              />
                            </button>
                          ))}
                          <span className="text-[12px] font-semibold text-[#e31837] ml-2">
                            {currentRating} sao
                          </span>
                        </div>

                        <textarea
                          rows={2}
                          placeholder={`Nhận xét về chất lượng món ${item.productName}...`}
                          value={currentComment}
                          onChange={(e) =>
                            setReviewComments((prev) => ({
                              ...prev,
                              [item.productId]: e.target.value,
                            }))
                          }
                          className="w-full p-2.5 bg-white border border-[#dddddd] rounded-[6px] text-[13px] text-[#181d26] focus:outline-none focus:border-[#e31837]"
                        />

                        <div className="flex gap-2 justify-end">
                          {existing && (
                            <button
                              type="button"
                              onClick={() =>
                                setEditingItem((prev) => ({
                                  ...prev,
                                  [item.productId]: false,
                                }))
                              }
                              className="h-8 px-3 bg-white border border-[#dddddd] text-[#41454d] text-[12px] font-medium rounded-[4px] cursor-pointer"
                            >
                              Hủy
                            </button>
                          )}
                          <button
                            onClick={() => handleItemReview(item.productId, item.productName)}
                            disabled={isSubmitting}
                            className="h-8 px-4 bg-[#e31837] hover:bg-[#be0e27] text-white text-[12px] font-medium rounded-[4px] transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                          >
                            {isSubmitting ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Send className="w-3.5 h-3.5" />
                            )}
                            <span>{existing ? 'Lưu cập nhật đánh giá' : 'Gửi nhận xét'}</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Complaint & Support Chat Modal */}
      {showChat && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-[12px] shadow-2xl border border-[#dddddd] overflow-hidden flex flex-col h-[560px]">
            {/* Modal Header */}
            <div className="p-4 border-b border-[#dddddd] bg-[#f8fafc] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-[#e31837]" />
                <div>
                  <h3 className="text-[15px] font-semibold text-[#181d26]">
                    Hỗ trợ & Khiếu nại đơn #{order.orderCode}
                  </h3>
                  <span className="text-[11px] text-[#41454d]">Trao đổi trực tiếp với quản lý quán NooNee</span>
                </div>
              </div>
              <button
                onClick={() => setShowChat(false)}
                className="p-1.5 text-[#9297a0] hover:text-[#181d26] rounded-[6px] hover:bg-[#dddddd]/40 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chat message body */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              {chatMessages.length === 0 ? (
                <div className="text-center py-12 text-[#9297a0] text-[13px] space-y-2">
                  <ShieldAlert className="w-8 h-8 text-[#9297a0] mx-auto opacity-50" />
                  <p className="font-medium text-[#181d26]">Chưa có tin nhắn nào</p>
                  <p className="text-[12px] max-w-xs mx-auto">
                    Nếu bạn có thắc mắc hoặc gặp sự cố về món ăn/giao hàng, hãy gửi tin nhắn ngay để quán hỗ trợ bạn.
                  </p>
                </div>
              ) : (
                chatMessages.map((msg) => {
                  const isCustomer = msg.senderRole === 'customer';
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isCustomer ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-1.5 mb-0.5 text-[11px] text-[#9297a0]">
                        <span className="font-semibold text-[#181d26]">{msg.senderName}</span>
                        <span>•</span>
                        <span>{formatDate(msg.createdAt)}</span>
                      </div>
                      <div
                        className={`max-w-[85%] p-3 rounded-[10px] text-[13px] leading-relaxed ${
                          isCustomer
                            ? msg.isComplaint
                              ? 'bg-[#fff1f2] border border-[#fecdd3] text-[#181d26] rounded-tr-xs'
                              : 'bg-[#e31837] text-white rounded-tr-xs'
                            : 'bg-[#f8fafc] border border-[#dddddd] text-[#181d26] rounded-tl-xs'
                        }`}
                      >
                        {msg.isComplaint && (
                          <div className="text-[11px] font-bold text-[#e31837] mb-1 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> NỘI DUNG KHIẾU NẠI:
                          </div>
                        )}
                        <p>{msg.message}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Chat input form */}
            <form onSubmit={handleSendChat} className="p-4 border-t border-[#dddddd] bg-[#f8fafc] space-y-2.5">
              <label className="flex items-center gap-2 text-[12px] text-[#e31837] font-semibold cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isComplaint}
                  onChange={(e) => setIsComplaint(e.target.checked)}
                  className="rounded text-[#e31837] focus:ring-[#e31837]"
                />
                <span>Đánh dấu đây là Khiếu nại món ăn (Bếp & Quán sẽ ưu tiên xử lý khẩn cấp)</span>
              </label>

              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  placeholder={isComplaint ? "Mô tả chi tiết vấn đề bạn đang khiếu nại..." : "Nhập câu hỏi hoặc yêu cầu hỗ trợ..."}
                  value={chatText}
                  onChange={(e) => setChatText(e.target.value)}
                  className="flex-1 h-10 px-3 bg-white border border-[#dddddd] rounded-[6px] text-[13px] text-[#181d26] focus:outline-none focus:border-[#e31837]"
                />
                <button
                  type="submit"
                  disabled={isSendingChat || !chatText.trim()}
                  className="h-10 px-4 bg-[#e31837] hover:bg-[#be0e27] text-white text-[13px] font-semibold rounded-[6px] transition flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {isSendingChat ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  <span>Gửi</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
