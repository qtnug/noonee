'use client';

import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  AlertTriangle,
  Send,
  CheckCircle2,
  RefreshCw,
  User,
  ShoppingBag,
  Clock,
  ArrowLeft,
} from 'lucide-react';
import { SupportMessage } from '@/types';
import { formatDate } from '@/lib/utils';

export default function AdminSupportPage() {
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'complaints' | 'resolved'>('all');
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');

  const fetchMessages = async () => {
    try {
      const res = await fetch('/api/support');
      const data = await res.json();
      if (data.success) {
        setMessages(data.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 4000);
    return () => clearInterval(interval);
  }, []);

  // Group messages by orderCode
  const orderGroups: { [key: string]: SupportMessage[] } = {};
  messages.forEach((m) => {
    const key = m.orderCode || 'GENERAL';
    if (!orderGroups[key]) orderGroups[key] = [];
    orderGroups[key].push(m);
  });

  const groupKeys = Object.keys(orderGroups);

  // Auto-select first order group if none selected
  useEffect(() => {
    if (!selectedOrder && groupKeys.length > 0) {
      setSelectedOrder(groupKeys[0]);
    }
  }, [groupKeys, selectedOrder]);

  const activeMessages = selectedOrder ? orderGroups[selectedOrder] || [] : [];
  const currentOrderHasComplaint = activeMessages.some((m) => m.isComplaint);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedOrder) return;

    setIsSending(true);
    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderCode: selectedOrder === 'GENERAL' ? null : selectedOrder,
          senderRole: 'admin',
          senderName: 'Quản Trị Viên (NooNee)',
          message: replyText.trim(),
          isComplaint: false,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setReplyText('');
        fetchMessages();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSending(false);
    }
  };

  const filteredGroupKeys = groupKeys.filter((key) => {
    const msgs = orderGroups[key];
    if (filterType === 'complaints') {
      return msgs.some((m) => m.isComplaint);
    }
    if (filterType === 'resolved') {
      return msgs.every((m) => m.status === 'resolved');
    }
    return true;
  });

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-normal text-[#181d26]">Khiếu nại & Chăm sóc khách hàng</h1>
          <p className="text-[13px] sm:text-[14px] text-[#41454d] mt-0.5 sm:mt-1">
            Tiếp nhận khiếu nại về đơn hàng và trao đổi trực tiếp với khách hàng thời gian thực
          </p>
        </div>

        <button
          onClick={fetchMessages}
          className="h-9 sm:h-10 px-3.5 sm:px-4 bg-white border border-[#dddddd] hover:bg-[#f8fafc] text-[#181d26] text-[12px] sm:text-[13px] font-medium rounded-[6px] flex items-center gap-2 transition self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 text-[#9297a0] ${loading ? 'animate-spin' : ''}`} />
          <span>Làm mới tin nhắn</span>
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilterType('all')}
          className={`px-3 py-1.5 rounded-[6px] text-[12px] sm:text-[13px] font-medium transition cursor-pointer border ${
            filterType === 'all'
              ? 'bg-[#e31837] text-white border-[#e31837] shadow-xs'
              : 'bg-white text-[#41454d] border-[#dddddd] hover:bg-[#f8fafc]'
          }`}
        >
          Tất cả ({groupKeys.length})
        </button>
        <button
          onClick={() => setFilterType('complaints')}
          className={`px-3 py-1.5 rounded-[6px] text-[12px] sm:text-[13px] font-medium transition cursor-pointer border ${
            filterType === 'complaints'
              ? 'bg-[#e31837] text-white border-[#e31837] shadow-xs'
              : 'bg-white text-[#e31837] border-[#fecdd3] hover:bg-[#fff1f2]'
          }`}
        >
          Có khiếu nại món ăn
        </button>
      </div>

      {/* Main chat layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 bg-white rounded-[10px] border border-[#dddddd] overflow-hidden min-h-[520px]">
        {/* Left column: List of conversations */}
        <div className={`${mobileView === 'chat' ? 'hidden lg:flex' : 'flex'} lg:col-span-4 border-r border-[#dddddd] flex-col`}>
          <div className="p-3.5 border-b border-[#dddddd] bg-[#f8fafc] text-[13px] font-semibold text-[#181d26]">
            Danh sách đơn hàng cần hỗ trợ
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-[#dddddd]">
            {filteredGroupKeys.length === 0 ? (
              <div className="p-8 text-center text-[#9297a0] text-[13px]">
                Chưa có tin nhắn hoặc khiếu nại nào.
              </div>
            ) : (
              filteredGroupKeys.map((key) => {
                const msgs = orderGroups[key];
                const lastMsg = msgs[msgs.length - 1];
                const hasComplaint = msgs.some((m) => m.isComplaint);
                const isSelected = selectedOrder === key;

                return (
                  <button
                    key={key}
                    onClick={() => {
                      setSelectedOrder(key);
                      setMobileView('chat');
                    }}
                    className={`w-full text-left p-3.5 sm:p-4 transition flex flex-col gap-1.5 cursor-pointer ${
                      isSelected ? 'bg-[#fff1f2]/60 border-l-4 border-l-[#e31837]' : 'hover:bg-[#f8fafc]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <ShoppingBag className="w-3.5 h-3.5 text-[#e31837]" />
                        <span className="font-mono font-bold text-[13px] sm:text-[14px] text-[#181d26]">
                          {key === 'GENERAL' ? 'Hỗ trợ chung' : `#${key}`}
                        </span>
                      </div>
                      {hasComplaint && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] text-[10px] sm:text-[11px] font-bold bg-[#fff1f2] text-[#e31837] border border-[#fecdd3]">
                          <AlertTriangle className="w-3 h-3" /> Khiếu nại
                        </span>
                      )}
                    </div>

                    <div className="text-[12px] text-[#181d26] font-medium truncate">
                      {lastMsg ? `${lastMsg.senderName}: ${lastMsg.message}` : 'Không có tin nhắn'}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-[#9297a0] pt-0.5">
                      <span>{msgs.length} tin nhắn</span>
                      <span>{lastMsg ? formatDate(lastMsg.createdAt) : ''}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right column: Chat messages & Reply */}
        <div className={`${mobileView === 'list' ? 'hidden lg:flex' : 'flex'} lg:col-span-8 flex-col justify-between`}>
          {selectedOrder ? (
            <>
              {/* Chat Header */}
              <div className="p-3.5 sm:p-4 border-b border-[#dddddd] bg-[#f8fafc] flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <button
                    type="button"
                    onClick={() => setMobileView('list')}
                    className="lg:hidden p-1.5 -ml-1 text-gray-600 hover:text-[#e31837] rounded-md hover:bg-gray-100 flex items-center gap-1 text-[12px] font-medium shrink-0 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Quay lại</span>
                  </button>

                  <div className="min-w-0">
                    <h3 className="font-semibold text-[#181d26] text-[14px] sm:text-[15px] flex items-center gap-2 flex-wrap truncate">
                      <span>Đơn hàng #{selectedOrder}</span>
                      {currentOrderHasComplaint && (
                        <span className="text-[10px] sm:text-[11px] font-bold text-[#e31837] bg-[#fff1f2] border border-[#fecdd3] px-2 py-0.5 rounded-[4px]">
                          Khách khiếu nại
                        </span>
                      )}
                    </h3>
                    <span className="text-[11px] sm:text-[12px] text-[#41454d] truncate block">
                      Phản hồi giải đáp thắc mắc hoặc hỗ trợ xử lý khiếu nại cho khách hàng
                    </span>
                  </div>
                </div>
              </div>

              {/* Message List */}
              <div className="flex-1 p-6 overflow-y-auto space-y-4 max-h-[420px]">
                {activeMessages.map((m) => {
                  const isAdmin = m.senderRole === 'admin';
                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[11px] font-semibold text-[#181d26]">
                          {m.senderName}
                        </span>
                        <span className="text-[11px] text-[#9297a0]">
                          {formatDate(m.createdAt)}
                        </span>
                      </div>

                      <div
                        className={`max-w-md p-3.5 rounded-[10px] text-[13px] leading-relaxed ${
                          isAdmin
                            ? 'bg-[#e31837] text-white rounded-tr-xs'
                            : m.isComplaint
                            ? 'bg-[#fff1f2] border border-[#fecdd3] text-[#181d26] rounded-tl-xs'
                            : 'bg-[#f8fafc] border border-[#dddddd] text-[#181d26] rounded-tl-xs'
                        }`}
                      >
                        {m.isComplaint && (
                          <div className="flex items-center gap-1 font-bold text-[#e31837] mb-1 text-[11px]">
                            <AlertTriangle className="w-3 h-3" /> NỘI DUNG KHIẾU NẠI:
                          </div>
                        )}
                        <p>{m.message}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Reply Form */}
              <form onSubmit={handleSendReply} className="p-4 border-t border-[#dddddd] bg-[#f8fafc] flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="Nhập nội dung phản hồi khách hàng..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="flex-1 h-11 px-4 bg-white border border-[#dddddd] rounded-[6px] text-[14px] text-[#181d26] focus:outline-none focus:border-[#e31837]"
                />
                <button
                  type="submit"
                  disabled={isSending || !replyText.trim()}
                  className="h-11 px-5 bg-[#e31837] hover:bg-[#be0e27] text-white text-[13px] font-medium rounded-[6px] transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSending ? 'Đang gửi...' : 'Gửi phản hồi'}</span>
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-[#9297a0] text-[14px] p-12">
              Chọn một đơn hàng bên trái để xem nội dung trò chuyện
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
