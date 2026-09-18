'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  MapPin,
  Phone,
  Clock,
  Mail,
  Send,
  MessageSquare,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  User,
  ShoppingBag,
  Sparkles,
  Loader2,
  HelpCircle,
  ShieldCheck,
  Headphones,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { SupportMessage } from '@/types';
import { formatDate } from '@/lib/utils';

function ContactChatContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const urlOrderCode = searchParams.get('orderCode') || '';

  // Chat State
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isComplaint, setIsComplaint] = useState(false);

  // Identity & Session state
  const [guestSessionId, setGuestSessionId] = useState<string>('');
  const [orderCode, setOrderCode] = useState(urlOrderCode);
  const [userOrders, setUserOrders] = useState<string[]>([]);

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize unique guest session for chat isolation
  useEffect(() => {
    if (typeof window !== 'undefined') {
      let saved = localStorage.getItem('noonee_guest_chat_session');
      if (!saved) {
        saved = 'GUEST_' + Math.random().toString(36).substring(2, 10).toUpperCase();
        localStorage.setItem('noonee_guest_chat_session', saved);
      }
      setGuestSessionId(saved);
    }
  }, []);

  // Compute active chat room identifier: orderCode if selected, otherwise USER_id or guest session
  const activeChatKey = orderCode.trim() || (user?.id ? `USER_${user.id}` : guestSessionId);

  // Helper to scroll only the chat message box (never jumps or scrolls the outer webpage)
  const scrollToBottom = (smooth = true) => {
    const el = messagesContainerRef.current;
    if (!el) return;
    if (smooth) {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    } else {
      el.scrollTop = el.scrollHeight;
    }
  };

  // If user is logged in, fetch 3 recent orders for quick selection
  useEffect(() => {
    if (user) {
      fetch('/api/orders')
        .then((res) => res.json())
        .then((data) => {
          if (data.success && Array.isArray(data.data)) {
            const codes = data.data.map((o: any) => o.code).slice(0, 3);
            setUserOrders(codes);
          }
        })
        .catch(() => {});
    }
  }, [user]);

  // Fetch messages from Support API for this isolated session / order
  const fetchMessages = async (isInitialOrManual = false) => {
    if (!activeChatKey) return;
    try {
      const res = await fetch(`/api/support?orderCode=${encodeURIComponent(activeChatKey)}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        const incoming: SupportMessage[] = data.data;
        if (typeof window !== 'undefined') {
          localStorage.setItem('noonee_last_viewed_support', Date.now().toString());
        }

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
      setLoading(false);
    }
  };

  // Initial fetch and 3.5s real-time poll
  useEffect(() => {
    if (!activeChatKey) return;
    setLoading(true);
    fetchMessages(true);
    const interval = setInterval(() => {
      fetchMessages(false);
    }, 3500);
    return () => clearInterval(interval);
  }, [activeChatKey]);

  // Handle Send Message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanMsg = inputText.trim();
    if (!cleanMsg || isSending || !activeChatKey) return;

    const senderName = user?.fullName || user?.username || 'Khách hàng';

    setIsSending(true);
    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderCode: activeChatKey,
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
            Tư Vấn & Hỗ Trợ Trực Tuyến NooNee
          </h1>
          <p className="text-[14px] sm:text-[15px] text-[#41454d] leading-relaxed">
            Nhắn tin trực tiếp với đội ngũ Chăm sóc khách hàng và Quản trị viên để được giải đáp thắc mắc, tư vấn món ngon hoặc tiếp nhận xử lý đơn hàng tức thì.
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

          {/* Right Column: Interactive Live Chat Area */}
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
                      <span className="text-white">NooNee CSKH Trực Tuyến</span>
                    </h3>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => fetchMessages(true)}
                  disabled={loading}
                  className="p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-[6px] transition cursor-pointer"
                  title="Tải lại tin nhắn"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {/* Chat Topic Filter Bar (Without name input) */}
              <div className="bg-[#f8fafc] px-3.5 py-2.5 border-b border-[#dddddd] flex items-center justify-between gap-2 text-[12px]">
                <div className="flex items-center gap-2">
                  <span className="text-[#555a64] font-medium">Chủ đề hỗ trợ:</span>
                  <select
                    value={orderCode}
                    onChange={(e) => setOrderCode(e.target.value)}
                    className="h-7 px-2.5 bg-white border border-[#dddddd] rounded-[4px] text-[12px] font-medium text-[#181d26] focus:outline-none focus:border-[#e31837] cursor-pointer"
                  >
                    <option value="">Hỗ trợ chung</option>
                    {orderCode && !userOrders.includes(orderCode) && (
                      <option value={orderCode}>Đơn hàng #{orderCode}</option>
                    )}
                    {userOrders.map((code) => (
                      <option key={code} value={code}>
                        Đơn hàng #{code}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="text-[11px] text-[#9297a0]">
                  {user ? (user.fullName || user.username) : 'Khách vãng lai'}
                </div>
              </div>

              {/* Messages Scrollable Area */}
              <div ref={messagesContainerRef} className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-[#fcfbf9]/60">
                {loading && messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-gray-400 text-[13px] gap-2">
                    <Loader2 className="w-5 h-5 animate-spin text-[#e31837]" />
                    <span>Đang kết nối tới tổng đài hỗ trợ...</span>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2 text-gray-400">
                    <MessageSquare className="w-10 h-10 text-gray-300" />
                    <p className="text-[13px] text-[#555a64] font-medium">Xin chào! Bạn cần NooNee hỗ trợ điều gì hôm nay?</p>
                    <p className="text-[12px] text-[#9297a0]">Gửi tin nhắn bên dưới, nhân viên hỗ trợ sẽ phản hồi bạn ngay.</p>
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

              {/* Chat Input & Controls (Suggestions removed) */}

              {/* Chat Input & Controls */}
              <form onSubmit={handleSendMessage} className="p-3 sm:p-3.5 bg-white border-t border-[#dddddd] space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    required
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Nhập nội dung cần hỗ trợ hoặc khiếu nại..."
                    className="flex-1 h-10 px-3.5 bg-white border border-[#dddddd] rounded-[6px] text-[13px] text-[#181d26] focus:outline-none focus:border-[#e31837] focus:ring-1 focus:ring-[#e31837] transition"
                  />

                  <button
                    type="submit"
                    disabled={isSending || !inputText.trim()}
                    className="h-10 px-4 sm:px-5 bg-[#e31837] hover:bg-[#be0e27] active:bg-[#a50b20] text-white text-[13px] font-semibold rounded-[6px] transition flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-xs shrink-0"
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
                  <label className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isComplaint}
                      onChange={(e) => setIsComplaint(e.target.checked)}
                      className="accent-[#e31837] rounded"
                    />
                    <span className={isComplaint ? 'text-[#e31837] font-semibold' : ''}>
                      Đánh dấu đây là khiếu nại chất lượng món / đơn hàng
                    </span>
                  </label>

                  <span className="text-[10px] text-gray-400 hidden sm:inline">
                    Nhấn Enter để gửi
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
