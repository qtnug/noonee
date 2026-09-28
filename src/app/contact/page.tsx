'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  CiMapPin as MapPin,
  CiPhone as Phone,
  CiClock2 as Clock,
  CiMail as Mail,
  CiPaperplane as Send,
  CiChat1 as MessageSquare,
  CiWarning as AlertTriangle,
  CiRedo as RefreshCw,
  CiUser as User,
  CiReceipt as Receipt,
  CiEdit as Edit,
  CiDeliveryTruck as Truck,
  CiLogin as Login,
  CiRedo as Loader2,
  CiHeadphones as Headphones,
  CiCircleChevRight as ChevronRight,
  CiCircleCheck as CheckCircle,
} from 'react-icons/ci';
import { useAuth } from '@/context/AuthContext';
import { SupportMessage, Order } from '@/types';
import { formatDate, formatVND } from '@/lib/utils';

// Helper to map order status into readable Vietnamese
const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  Pending: { label: 'Chờ xác nhận', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  Processing: { label: 'Đang chế biến', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  Delivering: { label: 'Đang giao hàng', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  Completed: { label: 'Đã hoàn thành', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  Cancelled: { label: 'Đã hủy', color: 'bg-rose-50 text-rose-700 border-rose-200' },
};

function ContactChatContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const urlOrderCode = searchParams.get('orderCode') || '';

  // Order state: MUST select order before chatting
  const [orderCode, setOrderCode] = useState<string>(urlOrderCode.trim().replace(/^#+/, ''));
  const [isChangingOrder, setIsChangingOrder] = useState<boolean>(!urlOrderCode);
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [selectedDropdownCode, setSelectedDropdownCode] = useState<string>('');
  const [manualCodeInput, setManualCodeInput] = useState<string>('');
  const [manualCodeError, setManualCodeError] = useState<string>('');
  const [loadingOrders, setLoadingOrders] = useState<boolean>(false);
  const [activeOrderDetails, setActiveOrderDetails] = useState<Order | null>(null);

  // Chat State
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [inputText, setInputText] = useState<string>('');
  const [isComplaint, setIsComplaint] = useState<boolean>(false);

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Helper to scroll only the chat message box
  const scrollToBottom = (smooth = true) => {
    const el = messagesContainerRef.current;
    if (!el) return;
    if (smooth) {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    } else {
      el.scrollTop = el.scrollHeight;
    }
  };

  // If user is logged in, fetch their orders list
  useEffect(() => {
    if (user) {
      setLoadingOrders(true);
      fetch(`/api/orders?userId=${user.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && Array.isArray(data.data)) {
            setUserOrders(data.data);
          }
        })
        .catch((e) => console.error('Error loading user orders:', e))
        .finally(() => setLoadingOrders(false));
    }
  }, [user]);

  // Sync active order details when orderCode changes
  useEffect(() => {
    if (!orderCode) {
      setActiveOrderDetails(null);
      return;
    }

    // Try finding in userOrders first
    const matched = userOrders.find(
      (o) => (o.orderCode || (o as any).code || '').toLowerCase() === orderCode.toLowerCase()
    );
    if (matched) {
      setActiveOrderDetails(matched);
    } else {
      // Or fetch order info from API
      fetch(`/api/orders/${encodeURIComponent(orderCode)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data) {
            setActiveOrderDetails(data.data);
          }
        })
        .catch(() => {});
    }
  }, [orderCode, userOrders]);

  // Fetch messages from Support API for this specific orderCode
  const fetchMessages = async (isInitialOrManual = false) => {
    if (!orderCode) return;
    try {
      const res = await fetch(`/api/support?orderCode=${encodeURIComponent(orderCode)}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        const incoming: SupportMessage[] = data.data;

        setMessages((prev) => {
          if (
            prev.length === incoming.length &&
            prev.length > 0 &&
            prev[prev.length - 1].id === incoming[incoming.length - 1].id
          ) {
            return prev;
          }
          if (prev.length === 0 && incoming.length === 0) {
            return prev;
          }

          const el = messagesContainerRef.current;
          const wasNearBottom = el ? el.scrollHeight - el.scrollTop - el.clientHeight < 120 : true;

          if (isInitialOrManual || wasNearBottom) {
            setTimeout(() => {
              scrollToBottom(!isInitialOrManual);
            }, 60);
          }

          return incoming;
        });
      }
    } catch (e) {
      console.error('Error loading chat messages:', e);
    } finally {
      setLoadingMessages(false);
    }
  };

  // Initial fetch and 3.5s real-time poll when orderCode is active
  useEffect(() => {
    if (!orderCode || isChangingOrder) {
      setMessages([]);
      return;
    }
    setLoadingMessages(true);
    fetchMessages(true);
    const interval = setInterval(() => {
      fetchMessages(false);
    }, 3500);
    return () => clearInterval(interval);
  }, [orderCode, isChangingOrder]);

  // Handle selecting an order from dropdown
  const handleSelectFromDropdown = (code: string) => {
    if (!code) return;
    const clean = code.trim().replace(/^#+/, '');
    setOrderCode(clean);
    setIsChangingOrder(false);
    setManualCodeError('');
    setTimeout(() => inputRef.current?.focus(), 150);
  };

  // Handle manual code confirmation
  const handleConfirmManualCode = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = manualCodeInput.trim().replace(/^#+/, '');
    if (!clean) {
      setManualCodeError('Vui lòng nhập mã đơn hàng của bạn');
      return;
    }
    setOrderCode(clean);
    setIsChangingOrder(false);
    setManualCodeError('');
    setTimeout(() => inputRef.current?.focus(), 150);
  };

  // Handle Send Message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanMsg = inputText.trim();
    if (!cleanMsg || isSending) return;

    if (!orderCode) {
      setIsChangingOrder(true);
      return;
    }

    const senderName = user?.fullName || user?.username || 'Khách hàng';

    setIsSending(true);
    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderCode: orderCode.trim(),
          userId: user?.id || null,
          senderRole: 'customer',
          senderName,
          message: cleanMsg,
          isComplaint: Boolean(isComplaint),
        }),
      });

      const data = await res.json();
      if (data.success && data.data) {
        setMessages((prev) => [...prev, data.data]);
        setInputText('');
        setIsComplaint(false);
        setTimeout(() => {
          scrollToBottom(true);
        }, 50);
      } else {
        alert(data.message || 'Không thể gửi tin nhắn. Vui lòng kiểm tra lại mã đơn.');
      }
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFAF0] py-8 sm:py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header Band */}
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0f172a] tracking-tight">
            Tư Vấn & Hỗ Trợ Đơn Hàng NooNee
          </h1>
          <p className="text-[14px] sm:text-[15px] text-[#41454d] leading-relaxed">
            Chọn mã đơn hàng để kết nối trực tiếp với đội ngũ Chăm sóc khách hàng NooNee, giải đáp thắc mắc và xử lý đơn hàng nhanh chóng.
          </p>
        </div>

        {/* Main 2-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
          {/* Left Column: Store Info & Direct Hotline Call */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white rounded-[10px] border border-[#dddddd] p-5 sm:p-6 shadow-xs space-y-4">
              <h2 className="text-base font-bold text-[#181d26] pb-3 border-b border-[#dddddd] flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#e31837]" />
                Thông tin nhà hàng NooNee
              </h2>

              <div className="space-y-3.5 text-[13px] text-[#41454d]">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-[6px] bg-red-50 flex items-center justify-center shrink-0 mt-0.5 text-[#e31837]">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="block text-[#181d26]">Địa chỉ quán:</strong>
                    <span>120 Yên Lãng, Đống Đa, Hà Nội</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-[6px] bg-red-50 flex items-center justify-center shrink-0 mt-0.5 text-[#e31837]">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="block text-[#181d26]">Hotline khẩn cấp:</strong>
                    <a href="tel:0988888888" className="text-[#e31837] font-bold text-[14px] hover:underline">
                      0988.888.888
                    </a>
                    <span className="block text-[11px] text-[#9297a0]">Hỗ trợ nhanh các đơn gấp</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-[6px] bg-red-50 flex items-center justify-center shrink-0 mt-0.5 text-[#e31837]">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="block text-[#181d26]">Khung giờ phục vụ:</strong>
                    <span>06:00 - 24:00 (Mỗi ngày)</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-[6px] bg-red-50 flex items-center justify-center shrink-0 mt-0.5 text-[#e31837]">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="block text-[#181d26]">Hòm thư điện tử:</strong>
                    <span>hotro@nooneefood.vn</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Support Chat Area */}
          <div className="lg:col-span-8">
            <div className="bg-white rounded-[10px] border border-[#dddddd] shadow-sm overflow-hidden flex flex-col h-[600px] sm:h-[640px]">
              {/* Chat Window Top Bar */}
              <div className="p-3.5 sm:p-4 bg-gradient-to-r from-[#181d26] to-[#262c36] text-white flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-[#e31837] text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                    <Headphones className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-[14px] sm:text-[15px] !text-white text-white truncate flex items-center gap-2">
                      <span>NooNee CSKH Trực Tuyến</span>
                      {orderCode && !isChangingOrder && (
                        <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          Trực tuyến
                        </span>
                      )}
                    </h3>
                  </div>
                </div>

                {orderCode && !isChangingOrder && (
                  <button
                    type="button"
                    onClick={() => fetchMessages(true)}
                    disabled={loadingMessages}
                    className="p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-[6px] transition cursor-pointer"
                    title="Tải lại tin nhắn"
                  >
                    <RefreshCw className={`w-4 h-4 ${loadingMessages ? 'animate-spin' : ''}`} />
                  </button>
                )}
              </div>

              {/* Order Status Banner (When order is selected) */}
              {orderCode && !isChangingOrder ? (
                <div className="bg-[#f8fafc] px-4 py-2.5 border-b border-[#dddddd] flex items-center justify-between gap-3 text-[12px]">
                  <div className="flex items-center gap-2 flex-wrap min-w-0">
                    <div className="flex items-center gap-1.5 font-bold text-[#181d26]">
                      <Receipt className="w-4 h-4 text-[#e31837]" />
                      <span>Đang hỗ trợ đơn:</span>
                      <span className="text-[#e31837] font-mono text-[13px]">#{orderCode}</span>
                    </div>

                    {activeOrderDetails && (
                      <>
                        <span className="text-gray-300 hidden sm:inline">•</span>
                        <span className="font-bold text-[#0f172a] hidden sm:inline">
                          {formatVND(activeOrderDetails.totalAmount)}
                        </span>
                        {STATUS_CONFIG[activeOrderDetails.status] && (
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${STATUS_CONFIG[activeOrderDetails.status].color}`}
                          >
                            {STATUS_CONFIG[activeOrderDetails.status].label}
                          </span>
                        )}
                      </>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsChangingOrder(true)}
                    className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#e31837] hover:text-[#be0e27] hover:underline cursor-pointer shrink-0"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Đổi mã đơn</span>
                  </button>
                </div>
              ) : null}

              {/* Body: Either Order Selection Screen OR Chat Messages */}
              {isChangingOrder || !orderCode ? (
                /* ── ORDER SELECTION SCREEN (Required step before chatting) ── */
                <div className="flex-1 p-6 sm:p-8 flex flex-col items-center justify-center bg-[#fcfbf9]/80 overflow-y-auto">
                  <div className="w-full max-w-md bg-white border border-[#dddddd] rounded-xl p-6 shadow-sm space-y-5">
                    <div className="text-center space-y-1.5">
                      <div className="w-12 h-12 rounded-2xl bg-red-50 text-[#e31837] flex items-center justify-center mx-auto mb-2">
                        <Receipt className="w-6 h-6 stroke-1" />
                      </div>
                      <h3 className="text-base sm:text-lg font-extrabold text-[#0f172a]">
                        Chọn mã đơn hàng cần hỗ trợ
                      </h3>
                      <p className="text-[12px] sm:text-[13px] text-[#555a64] leading-relaxed">
                        Để nhân viên hỗ trợ đúng món và xử lý nhanh chóng, bạn vui lòng chọn đơn hàng cần trợ giúp trước khi gửi tin nhắn.
                      </p>
                    </div>

                    {/* Case 1: Logged-in user with orders */}
                    {user && userOrders.length > 0 && (
                      <div className="space-y-3 pt-1 border-t border-[#f1f1f1]">
                        <label className="block text-[12px] font-bold text-[#181d26]">
                          Đơn hàng gần đây của bạn:
                        </label>
                        <select
                          value={selectedDropdownCode}
                          onChange={(e) => {
                            setSelectedDropdownCode(e.target.value);
                            if (e.target.value) {
                              handleSelectFromDropdown(e.target.value);
                            }
                          }}
                          className="w-full h-10 px-3 bg-white border border-[#dddddd] rounded-[6px] text-[12px] text-[#181d26] focus:outline-none focus:border-[#e31837] cursor-pointer"
                        >
                          <option value="">-- Bấm vào đây để chọn đơn hàng --</option>
                          {userOrders.map((ord) => {
                            const code = ord.orderCode || (ord as any).code;
                            const statusText = STATUS_CONFIG[ord.status]?.label || ord.status;
                            return (
                              <option key={ord.id} value={code}>
                                #{code} • {formatVND(ord.totalAmount)} • {statusText} ({formatDate(ord.createdAt)})
                              </option>
                            );
                          })}
                        </select>
                      </div>
                    )}

                    {/* Case 2: Manual Order Code Input (Available for both Guests and Users) */}
                    <form onSubmit={handleConfirmManualCode} className="space-y-3 pt-2 border-t border-[#f1f1f1]">
                      <label className="block text-[12px] font-bold text-[#181d26]">
                        {user && userOrders.length > 0 ? 'Hoặc tự nhập mã đơn hàng khác:' : 'Nhập mã đơn hàng của bạn:'}
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={manualCodeInput}
                          onChange={(e) => {
                            setManualCodeInput(e.target.value);
                            setManualCodeError('');
                          }}
                          placeholder="Ví dụ: NOONEE12345678"
                          className="flex-1 h-10 px-3.5 bg-white border border-[#dddddd] rounded-[6px] text-[13px] text-[#181d26] focus:outline-none focus:border-[#e31837] focus:ring-1 focus:ring-[#e31837] font-mono uppercase placeholder:normal-case placeholder:font-sans"
                        />
                        <button
                          type="submit"
                          className="h-10 px-4 bg-[#e31837] hover:bg-[#be0e27] active:bg-[#a50b20] text-white text-[13px] font-bold rounded-[6px] transition cursor-pointer shadow-xs shrink-0"
                        >
                          Xác nhận
                        </button>
                      </div>
                      {manualCodeError && (
                        <p className="text-[12px] text-[#e31837] font-medium">{manualCodeError}</p>
                      )}
                    </form>

                    {/* Guest Helper & Login Suggestion */}
                    {!user && (
                      <div className="pt-2 text-center text-[12px] text-[#677992] border-t border-[#f1f1f1]">
                        <span>Đã có tài khoản NooNee? </span>
                        <Link href="/login" className="text-[#e31837] font-bold hover:underline inline-flex items-center gap-0.5">
                          <span>Đăng nhập</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                        <span className="block mt-0.5 text-[11px] text-[#9297a0]">
                          Đăng nhập để xem danh sách đơn hàng đã đặt
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* ── CHAT MESSAGES AREA (Active when order is confirmed) ── */
                <div ref={messagesContainerRef} className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-[#fcfbf9]/60">
                  {loadingMessages && messages.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-gray-400 text-[13px] gap-2">
                      <Loader2 className="w-5 h-5 animate-spin text-[#e31837]" />
                      <span>Đang tải tin nhắn hỗ trợ cho đơn #{orderCode}...</span>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2 text-gray-400">
                      <MessageSquare className="w-10 h-10 text-gray-300" />
                      <p className="text-[13px] text-[#555a64] font-medium">
                        Bạn đang nhắn tin hỗ trợ cho đơn hàng <strong className="text-[#0f172a]">#{orderCode}</strong>
                      </p>
                      <p className="text-[12px] text-[#9297a0] max-w-sm">
                        Hãy nhập câu hỏi, yêu cầu hoặc phản hồi chất lượng món ăn bên dưới để nhân viên NooNee hỗ trợ bạn ngay.
                      </p>
                    </div>
                  ) : (
                    messages.map((m) => {
                      const isAdmin = m.senderRole === 'admin';
                      return (
                        <div
                          key={m.id}
                          className={`flex flex-col ${isAdmin ? 'items-start' : 'items-end'}`}
                        >
                          <div className="flex items-center gap-1.5 mb-1 px-1">
                            <span className={`text-[11px] font-semibold ${isAdmin ? 'text-[#e31837]' : 'text-[#181d26]'}`}>
                              {isAdmin ? 'NooNee CSKH' : m.senderName}
                            </span>
                            <span className="text-[10px] text-gray-400">
                              {formatDate(m.createdAt)}
                            </span>
                          </div>

                          <div
                            className={`max-w-md sm:max-w-lg p-3 rounded-[8px] text-[13px] leading-relaxed shadow-2xs ${
                              isAdmin
                                ? 'bg-white border border-[#dddddd] text-[#181d26] rounded-tl-xs'
                                : m.isComplaint
                                ? 'bg-[#fff1f2] border border-[#fecdd3] text-[#e31837] rounded-tr-xs font-medium'
                                : 'bg-[#e31837] text-white rounded-tr-xs'
                            }`}
                          >
                            {m.isComplaint && (
                              <div className="flex items-center gap-1 text-[11px] font-bold text-[#e31837] mb-1">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                <span>KHIẾU NẠI ĐƠN HÀNG</span>
                              </div>
                            )}
                            <p className="whitespace-pre-wrap break-words">{m.message}</p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* Chat Input & Controls (Disabled when no orderCode is selected) */}
              <form onSubmit={handleSendMessage} className="p-3 sm:p-3.5 bg-white border-t border-[#dddddd] space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    required
                    disabled={!orderCode || isChangingOrder}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={
                      orderCode && !isChangingOrder
                        ? `Nhập nội dung cần hỗ trợ cho đơn #${orderCode}...`
                        : '⚠️ Vui lòng chọn mã đơn hàng ở trên để bắt đầu nhắn tin...'
                    }
                    className="flex-1 h-10 px-3.5 bg-white border border-[#dddddd] rounded-[6px] text-[13px] text-[#181d26] focus:outline-none focus:border-[#e31837] focus:ring-1 focus:ring-[#e31837] transition disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                  />

                  <button
                    type="submit"
                    disabled={!orderCode || isChangingOrder || isSending || !inputText.trim()}
                    className="h-10 px-4 sm:px-5 bg-[#e31837] hover:bg-[#be0e27] active:bg-[#a50b20] text-white text-[13px] font-semibold rounded-[6px] transition flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-xs shrink-0"
                  >
                    {isSending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <span>Gửi</span>
                        <Send className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>

                {/* Complaint Checkbox */}
                <div className="flex items-center justify-between text-[11px] text-[#555a64] px-1">
                  <label className={`flex items-center gap-1.5 select-none ${!orderCode || isChangingOrder ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}>
                    <input
                      type="checkbox"
                      disabled={!orderCode || isChangingOrder}
                      checked={isComplaint}
                      onChange={(e) => setIsComplaint(e.target.checked)}
                      className="accent-[#e31837] rounded"
                    />
                    <span className={isComplaint ? 'text-[#e31837] font-semibold' : ''}>
                      Đánh dấu đây là khiếu nại chất lượng món / đơn hàng
                    </span>
                  </label>

                  <span className="text-[10px] text-gray-400 hidden sm:inline">
                    {orderCode && !isChangingOrder ? 'Nhấn Enter để gửi' : 'Bắt buộc chọn mã đơn hàng trước khi gửi'}
                  </span>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ContactPage() {
  return (
    <Suspense fallback={<div className="p-16 text-center text-[14px] text-gray-400">Đang kết nối trung tâm hỗ trợ...</div>}>
      <ContactChatContent />
    </Suspense>
  );
}
