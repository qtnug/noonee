'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  CiMapPin as MapPin,
  CiPhone as Phone,
  CiClock2 as Clock,
  CiMail as Mail,
  CiPaperplane as Send,
  CiChat1 as MessageSquare,
  CiWarning as AlertTriangle,
  CiRedo as RefreshCw,
  CiReceipt as Receipt,
  CiEdit as Edit,
  CiRedo as Loader2,
  CiHeadphones as Headphones,
  CiCircleCheck as CheckCircle,
} from 'react-icons/ci';
import { useAuth } from '@/context/AuthContext';
import { SupportMessage, Order } from '@/types';
import { formatDate, formatVND } from '@/lib/utils';

// Sample fallback orders if user has no orders or is a guest
const SAMPLE_ORDERS = [
  { code: 'NOONEE20260901', title: 'Cơm tấm Sài Gòn đặc biệt', price: 38000, status: 'Đang giao hàng' },
  { code: 'NOONEE20260902', title: 'Phở bò tái nạm bắp hoa', price: 40000, status: 'Đang chế biến' },
  { code: 'NOONEE20260903', title: 'Bún bò Huế cố đô', price: 42000, status: 'Đã hoàn thành' },
  { code: 'NOONEE20260904', title: 'Cơm rang dương châu xá xíu', price: 35000, status: 'Đã hoàn thành' },
  { code: 'NOONEE20260905', title: 'Gà popcorn giòn lắc phô mai', price: 35000, status: 'Đang giao hàng' },
  { code: 'NOONEE20260906', title: 'Bánh tráng trộn sốt me', price: 20000, status: 'Đang chế biến' },
  { code: 'NOONEE20260907', title: 'Trà sữa trân châu đường đen', price: 25000, status: 'Đã hoàn thành' },
  { code: 'NOONEE20260908', title: 'Trà đào cam sả hạt chia', price: 22000, status: 'Đã hoàn thành' },
];

const STATUS_LABELS: Record<string, string> = {
  Pending: 'Chờ xác nhận',
  Processing: 'Đang chế biến',
  Delivering: 'Đang giao hàng',
  Completed: 'Đã hoàn thành',
  Cancelled: 'Đã hủy',
};

interface DropdownItem {
  code: string;
  label: string;
  status?: string;
  isUserOrder?: boolean;
}

function ContactChatContent() {
  const { user, getAuthHeader } = useAuth();
  const searchParams = useSearchParams();
  const urlOrderCode = (searchParams.get('orderCode') || '').trim().replace(/^#+/, '');

  // Order Code State
  const [orderCode, setOrderCode] = useState<string>(urlOrderCode);
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [customCodeInput, setCustomCodeInput] = useState<string>('');
  const [showCustomModal, setShowCustomModal] = useState<boolean>(false);
  const [customError, setCustomError] = useState<string>('');

  // Chat State
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [inputText, setInputText] = useState<string>('');
  const [isComplaint, setIsComplaint] = useState<boolean>(false);

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll messages
  const scrollToBottom = (smooth = true) => {
    const el = messagesContainerRef.current;
    if (!el) return;
    if (smooth) {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    } else {
      el.scrollTop = el.scrollHeight;
    }
  };

  // Fetch logged-in user's orders
  useEffect(() => {
    if (user) {
      fetch(`/api/orders?userId=${user.id}`, {
        headers: getAuthHeader ? getAuthHeader() : {},
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && Array.isArray(data.data)) {
            setUserOrders(data.data);
          }
        })
        .catch((e) => console.error('Error fetching user orders:', e));
    }
  }, [user]);

  // Build the complete dropdown options
  const dropdownOptions: DropdownItem[] = React.useMemo(() => {
    const list: DropdownItem[] = [];

    // 1. User's own orders (if logged in)
    if (userOrders.length > 0) {
      userOrders.forEach((o) => {
        const c = o.orderCode || (o as any).code;
        if (c) {
          const statusText = STATUS_LABELS[o.status] || o.status;
          list.push({
            code: c,
            label: `#${c} • ${formatVND(o.totalAmount)} • ${statusText}`,
            status: statusText,
            isUserOrder: true,
          });
        }
      });
    }

    // 2. URL orderCode if not already in list
    if (urlOrderCode && !list.some((item) => item.code.toLowerCase() === urlOrderCode.toLowerCase())) {
      list.push({
        code: urlOrderCode,
        label: `#${urlOrderCode} • Đơn hàng chỉ định`,
        status: 'Chỉ định',
        isUserOrder: true,
      });
    }

    // 3. User custom code if entered and not already in list
    if (
      orderCode &&
      !list.some((item) => item.code.toLowerCase() === orderCode.toLowerCase())
    ) {
      list.push({
        code: orderCode,
        label: `#${orderCode} • Mã đơn đã chọn`,
        status: 'Tự nhập',
        isUserOrder: true,
      });
    }

    // 4. Sample/demo orders (so the dropdown ALWAYS has items to choose from)
    SAMPLE_ORDERS.forEach((s) => {
      if (!list.some((item) => item.code.toLowerCase() === s.code.toLowerCase())) {
        list.push({
          code: s.code,
          label: `#${s.code} • ${s.title} • ${formatVND(s.price)}`,
          status: s.status,
          isUserOrder: false,
        });
      }
    });

    return list;
  }, [userOrders, urlOrderCode, orderCode]);

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

  // Poll messages every 3.5s when orderCode is active
  useEffect(() => {
    if (!orderCode) {
      setMessages([]);
      return;
    }
    setLoadingMessages(true);
    fetchMessages(true);
    const interval = setInterval(() => {
      fetchMessages(false);
    }, 3500);
    return () => clearInterval(interval);
  }, [orderCode]);

  // Handle dropdown change
  const handleDropdownChange = (val: string) => {
    if (val === '__MANUAL_INPUT__') {
      setShowCustomModal(true);
      return;
    }
    const clean = val.trim().replace(/^#+/, '');
    setOrderCode(clean);
    setCustomError('');
    if (clean) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  };

  // Confirm manual code
  const handleConfirmCustomCode = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = customCodeInput.trim().replace(/^#+/, '');
    if (!clean) {
      setCustomError('Vui lòng nhập mã đơn hàng hợp lệ');
      return;
    }
    setOrderCode(clean);
    setShowCustomModal(false);
    setCustomCodeInput('');
    setCustomError('');
    setTimeout(() => inputRef.current?.focus(), 150);
  };

  // Handle Send Message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanMsg = inputText.trim();
    if (!cleanMsg || isSending) return;

    if (!orderCode) {
      alert('Vui lòng chọn mã đơn hàng trong dropdown trước khi gửi tin nhắn hỗ trợ!');
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
        alert(data.message || 'Không thể gửi tin nhắn.');
      }
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  };

  // Active item info
  const activeItem = dropdownOptions.find(
    (item) => item.code.toLowerCase() === orderCode.toLowerCase()
  );

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
                      {orderCode ? (
                        <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          Trực tuyến
                        </span>
                      ) : (
                        <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          Chưa chọn đơn
                        </span>
                      )}
                    </h3>
                  </div>
                </div>

                {orderCode && (
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

              {/* ── DROPDOWN BAR: ALWAYS VISIBLE AT THE TOP OF THE CHAT ── */}
              <div className="bg-[#f8fafc] px-3.5 sm:px-4 py-2.5 border-b border-[#dddddd] flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 shrink-0 text-[#181d26] font-bold text-[12px] sm:text-[13px]">
                    <Receipt className="w-4 h-4 text-[#e31837]" />
                    <span>Chọn mã đơn:</span>
                  </div>

                  <select
                    value={orderCode || ''}
                    onChange={(e) => handleDropdownChange(e.target.value)}
                    className="flex-1 h-9 px-3 bg-white border border-[#dddddd] rounded-[6px] text-[12px] sm:text-[13px] font-medium text-[#181d26] focus:outline-none focus:border-[#e31837] focus:ring-1 focus:ring-[#e31837] cursor-pointer shadow-2xs truncate"
                  >
                    <option value="">-- Bấm để chọn mã đơn hàng --</option>
                    {dropdownOptions.map((opt) => (
                      <option key={opt.code} value={opt.code}>
                        {opt.label}
                      </option>
                    ))}
                    <option value="__MANUAL_INPUT__">✏️ Tự nhập mã đơn khác...</option>
                  </select>
                </div>

                {orderCode && activeItem?.status && (
                  <span className="shrink-0 px-2.5 py-1 rounded-full bg-red-50 text-[#e31837] font-bold text-[11px] border border-red-200 shadow-2xs">
                    {activeItem.status}
                  </span>
                )}
              </div>

              {/* Body: Chat messages or prompt to choose order */}
              {!orderCode ? (
                /* ── PROMPT WHEN NO ORDER IS SELECTED ── */
                <div className="flex-1 p-6 sm:p-8 flex flex-col items-center justify-center text-center bg-[#fcfbf9]/80 space-y-3.5">
                  <div className="w-14 h-14 rounded-2xl bg-red-50 text-[#e31837] flex items-center justify-center mx-auto shadow-xs border border-red-100">
                    <Receipt className="w-7 h-7 stroke-1" />
                  </div>
                  <div className="max-w-md space-y-1.5">
                    <h3 className="text-base sm:text-lg font-bold text-[#0f172a]">
                      Vui lòng chọn mã đơn hàng từ menu trên
                    </h3>
                    <p className="text-[13px] text-[#555a64] leading-relaxed">
                      Để nhân viên CSKH tra cứu đúng đơn và hỗ trợ bạn nhanh nhất, bạn vui lòng bấm vào menu <strong className="text-[#e31837]">"Chọn mã đơn"</strong> ở trên trước khi nhắn tin.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowCustomModal(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white border border-[#dddddd] hover:border-[#e31837] text-[#181d26] hover:text-[#e31837] text-[12px] font-semibold shadow-2xs transition cursor-pointer"
                  >
                    <Edit className="w-3.5 h-3.5 text-[#e31837]" />
                    <span>Hoặc nhập mã đơn của bạn</span>
                  </button>
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
                        Bạn đang kết nối hỗ trợ cho đơn hàng <strong className="text-[#0f172a]">#{orderCode}</strong>
                      </p>
                      <p className="text-[12px] text-[#9297a0] max-w-sm">
                        Hãy nhập câu hỏi, yêu cầu hoặc phản hồi chất lượng món ăn bên dưới để nhân viên NooNee phản hồi bạn ngay.
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
                    disabled={!orderCode}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={
                      orderCode
                        ? `Nhập nội dung cần hỗ trợ cho đơn #${orderCode}...`
                        : '⚠️ Vui lòng chọn mã đơn hàng trong dropdown ở trên để nhắn tin...'
                    }
                    className="flex-1 h-10 px-3.5 bg-white border border-[#dddddd] rounded-[6px] text-[13px] text-[#181d26] focus:outline-none focus:border-[#e31837] focus:ring-1 focus:ring-[#e31837] transition disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                  />

                  <button
                    type="submit"
                    disabled={!orderCode || isSending || !inputText.trim()}
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
                  <label className={`flex items-center gap-1.5 select-none ${!orderCode ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}>
                    <input
                      type="checkbox"
                      disabled={!orderCode}
                      checked={isComplaint}
                      onChange={(e) => setIsComplaint(e.target.checked)}
                      className="accent-[#e31837] rounded"
                    />
                    <span className={isComplaint ? 'text-[#e31837] font-semibold' : ''}>
                      Đánh dấu đây là khiếu nại chất lượng món / đơn hàng
                    </span>
                  </label>

                  <span className="text-[10px] text-gray-400 hidden sm:inline">
                    {orderCode ? 'Nhấn Enter để gửi' : 'Bắt buộc chọn mã đơn hàng trước khi gửi'}
                  </span>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* ── MODAL: MANUAL CODE INPUT (When user picks 'Tự nhập mã đơn khác') ── */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#dddddd] shadow-xl max-w-sm w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#dddddd] pb-3">
              <h3 className="font-bold text-[#0f172a] text-[15px] flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-[#e31837]" />
                <span>Nhập mã đơn hàng</span>
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowCustomModal(false);
                  setCustomError('');
                }}
                className="text-gray-400 hover:text-gray-600 text-lg leading-none cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleConfirmCustomCode} className="space-y-3">
              <div>
                <label className="block text-[12px] font-bold text-[#181d26] mb-1">
                  Mã đơn hàng:
                </label>
                <input
                  type="text"
                  autoFocus
                  value={customCodeInput}
                  onChange={(e) => {
                    setCustomCodeInput(e.target.value);
                    setCustomError('');
                  }}
                  placeholder="Ví dụ: NOONEE12345678"
                  className="w-full h-10 px-3 bg-white border border-[#dddddd] rounded-[6px] text-[13px] text-[#181d26] focus:outline-none focus:border-[#e31837] font-mono uppercase placeholder:normal-case placeholder:font-sans"
                />
                {customError && (
                  <p className="text-[11px] text-[#e31837] font-medium mt-1">{customError}</p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#f1f1f1]">
                <button
                  type="button"
                  onClick={() => {
                    setShowCustomModal(false);
                    setCustomError('');
                  }}
                  className="px-3.5 py-2 text-[12px] font-medium text-gray-600 hover:bg-gray-100 rounded-[6px] transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#e31837] hover:bg-[#be0e27] text-white text-[12px] font-bold rounded-[6px] transition cursor-pointer shadow-xs"
                >
                  Xác nhận
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
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
