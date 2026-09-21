'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  X,
  Send,
  RotateCcw,
  Bot,
  User,
  ShoppingBag,
  ExternalLink,
  ChevronDown,
  Check,
  AlertCircle,
  Clock,
  Star,
} from 'lucide-react';
import { Product } from '@/types';
import { formatVND } from '@/lib/utils';
import { useCart } from '@/context/CartContext';
import ProductOptionsModal from '@/components/ProductOptionsModal';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  recommendedProducts?: Product[];
  timestamp: string;
}

const QUICK_PROMPTS = [
  '🍱 Gợi ý cơm trưa dưới 40k',
  '🍜 Bún & Phở nước nóng hổi',
  '🥤 Trà sữa & nước ép mát lạnh',
  '🍟 Đồ ăn vặt giòn rụm',
  '🌶️ Món cay đậm đà ấm bụng',
  '⭐ Các món bán chạy nhất quán',
];

/**
 * Format lightweight markdown (bold, bullet points, headers, blockquotes)
 */
function MarkdownText({ content }: { content: string }) {
  const lines = content.split('\n');

  return (
    <div className="space-y-1.5 leading-relaxed text-sm">
      {lines.map((line, idx) => {
        const trimmed = line.trim();

        if (!trimmed) {
          return <div key={idx} className="h-1.5" />;
        }

        // Blockquote / Tip note
        if (trimmed.startsWith('>')) {
          const quoteText = trimmed.replace(/^>\s*/, '');
          return (
            <div
              key={idx}
              className="bg-amber-50/80 border-l-2 border-amber-400 pl-2.5 py-1 text-xs text-amber-900 rounded-r-md my-1"
            >
              {renderFormattedInline(quoteText)}
            </div>
          );
        }

        // Bullet point
        if (trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('*')) {
          const bulletText = trimmed.replace(/^[•\-\*]\s*/, '');
          return (
            <div key={idx} className="flex items-start gap-1.5 pl-1">
              <span className="text-[#e31837] text-xs mt-1 shrink-0">•</span>
              <span className="flex-1">{renderFormattedInline(bulletText)}</span>
            </div>
          );
        }

        // Regular line
        return <p key={idx}>{renderFormattedInline(trimmed)}</p>;
      })}
    </div>
  );
}

/**
 * Render inline formatting like **bold** and `code`
 */
function renderFormattedInline(text: string) {
  // Regex to split **bold** and `code`
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);

  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={index} className="font-semibold text-gray-900">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          key={index}
          className="bg-gray-100 text-[#e31837] px-1 py-0.5 rounded text-xs font-mono font-medium"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

export default function AIChatBot() {
  const { addToCart } = useCart();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showTooltip, setShowTooltip] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [modalProduct, setModalProduct] = useState<Product | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setShowTooltip(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
    }
  }, [isOpen, messages]);

  // Load chat history from sessionStorage on mount
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('noonee_ai_messages');
      if (saved) {
        setMessages(JSON.parse(saved));
      } else {
        // Initial greeting
        setMessages([
          {
            id: 'welcome',
            role: 'assistant',
            content:
              'Xin chào bạn! Mình là **NooNee AI** 🍽️ - trợ lý ẩm thực thông minh sử dụng mô hình **Gemma 4 31B** từ Google API.\n\nBạn đang muốn ăn món gì hôm nay? Hãy cho mình biết khẩu vị, mức giá hoặc bữa ăn bạn cần gợi ý nhé!',
            timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }
    } catch {
      // Ignore sessionStorage error
    }
  }, []);

  // Save chat history
  const updateMessages = (newMessages: Message[]) => {
    setMessages(newMessages);
    try {
      sessionStorage.setItem('noonee_ai_messages', JSON.stringify(newMessages));
    } catch {
      // Ignore sessionStorage error
    }
  };

  const handleResetChat = () => {
    const defaultWelcome: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content:
        'Xin chào bạn! Mình là **NooNee AI** 🍽️. Bạn cần gợi ý món gì cho bữa ăn hôm nay nào?',
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };
    updateMessages([defaultWelcome]);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputMessage).trim();
    if (!query || isLoading) return;

    setInputMessage('');

    const userMessage: Message = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };

    const nextHistory = [...messages, userMessage];
    updateMessages(nextHistory);
    setIsLoading(true);

    try {
      // Send conversation history to backend route
      const apiPayload = nextHistory.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiPayload }),
      });

      const data = await res.json();

      if (data.success) {
        const botMessage: Message = {
          id: `bot_${Date.now()}`,
          role: 'assistant',
          content: data.reply || 'Dạ NooNee AI đã nhận được yêu cầu của bạn.',
          recommendedProducts: data.recommendedProducts || [],
          timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        };
        updateMessages([...nextHistory, botMessage]);
      } else {
        const errorMsg: Message = {
          id: `bot_err_${Date.now()}`,
          role: 'assistant',
          content:
            data.message ||
            'Rất tiếc, đã có lỗi xảy ra khi kết nối với AI. Bạn vui lòng thử lại nhé!',
          timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        };
        updateMessages([...nextHistory, errorMsg]);
      }
    } catch (err) {
      console.error('AIChatBot fetch error:', err);
      const networkErrorMsg: Message = {
        id: `bot_err_${Date.now()}`,
        role: 'assistant',
        content:
          'Không thể kết nối với máy chủ AI lúc này. Vui lòng kiểm tra kết nối mạng và thử lại sau nhé!',
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      };
      updateMessages([...nextHistory, networkErrorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    handleSendMessage(prompt);
  };

  // Add to cart action from card
  const handleProductCardAddToCart = (product: Product) => {
    // If product has toppings, open the customization modal
    if (product.toppings && product.toppings.length > 0) {
      setModalProduct(product);
      return;
    }

    // Otherwise add directly to cart
    addToCart(product, 1);
    setToastMessage(`Đã thêm "${product.name}" vào giỏ hàng!`);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  return (
    <>
      {/* ================= PINNED CORNER BUTTON ================= */}
      <div className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-40 flex items-center select-none">
        {/* Animated Greeting Tooltip */}
        {!isOpen && showTooltip && (
          <div className="hidden sm:flex items-center gap-2 mr-3 bg-white text-[#1f2937] text-xs font-medium px-3.5 py-2 rounded-full shadow-lg border border-[#fecdd3] animate-bounce duration-1000">
            <Sparkles className="w-3.5 h-3.5 text-[#e31837] shrink-0" />
            <span>Hôm nay ăn gì? Hỏi NooNee AI nhé!</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowTooltip(false);
              }}
              className="text-gray-400 hover:text-gray-600 ml-1 p-0.5"
              aria-label="Đóng gợi ý"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Floating Pinned Button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? 'Đóng NooNee AI Chatbot' : 'Mở NooNee AI Chatbot'}
          className={`relative group flex items-center justify-center rounded-full shadow-xl transition-all duration-300 cursor-pointer ${
            isOpen
              ? 'w-12 h-12 bg-gray-800 text-white hover:bg-gray-900'
              : 'w-14 h-14 bg-gradient-to-tr from-[#e31837] via-[#f03d52] to-[#ff5b4f] text-white hover:scale-105 active:scale-95 shadow-[#e31837]/30'
          }`}
        >
          {/* Subtle pulse ring animation when closed */}
          {!isOpen && (
            <span className="absolute -inset-1 rounded-full bg-[#e31837] opacity-30 animate-ping pointer-events-none" />
          )}

          {isOpen ? (
            <ChevronDown className="w-6 h-6 transition-transform group-hover:translate-y-0.5" />
          ) : (
            <div className="relative flex items-center justify-center">
              <Bot className="w-7 h-7 animate-pulse" />
              <Sparkles className="w-3.5 h-3.5 absolute -top-1.5 -right-1.5 text-amber-300" />
            </div>
          )}

          {/* Online badge */}
          {!isOpen && (
            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full" />
          )}
        </button>
      </div>

      {/* ================= CHATBOT POPUP WINDOW ================= */}
      {isOpen && (
        <div
          className="fixed bottom-24 md:bottom-20 right-4 md:right-6 z-50 w-[calc(100vw-2rem)] sm:w-[410px] h-[590px] max-h-[calc(100dvh-7.5rem)] bg-white rounded-2xl shadow-2xl border border-[#fed7aa]/60 sm:border-[#fecdd3] flex flex-col overflow-hidden transition-all duration-300 animate-in fade-in slide-in-from-bottom-5"
          role="dialog"
          aria-label="NooNee Food AI Assistant"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#e31837] via-[#e52844] to-[#f43f5e] text-white px-4 py-3 flex items-center justify-between shrink-0 shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-white/15 backdrop-blur-xs flex items-center justify-center border border-white/20 relative shrink-0">
                <Bot className="w-5 h-5 text-white" />
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 border border-[#e31837] rounded-full" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-sm leading-none">NooNee Food AI</h3>
                  <span className="text-[10px] font-semibold bg-white/20 px-1.5 py-0.5 rounded-full text-white/95">
                    Gemma 4 31B
                  </span>
                </div>
                <p className="text-[11px] text-white/80 mt-0.5 flex items-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Google API • Chọn món chuẩn vị
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleResetChat}
                title="Bắt đầu lại cuộc trò chuyện"
                aria-label="Xóa lịch sử chat"
                className="p-1.5 text-white/80 hover:text-white hover:bg-white/15 rounded-lg transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Thu nhỏ"
                aria-label="Đóng cửa sổ chat"
                className="p-1.5 text-white/80 hover:text-white hover:bg-white/15 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Toast Notification inside Chat */}
          {toastMessage && (
            <div className="bg-emerald-600 text-white text-xs px-3 py-1.5 flex items-center justify-center gap-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
              <Check className="w-3.5 h-3.5 shrink-0" />
              <span>{toastMessage}</span>
            </div>
          )}

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-3.5 bg-[#fdfcfb]">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-full bg-[#fdf2f2] border border-[#fecdd3] flex items-center justify-center text-[#e31837] shrink-0 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`flex flex-col ${
                    msg.role === 'user' ? 'items-end max-w-[82%]' : 'items-start max-w-[88%]'
                  }`}
                >
                  <div
                    className={`px-3.5 py-2.5 rounded-2xl shadow-xs text-sm ${
                      msg.role === 'user'
                        ? 'bg-[#e31837] text-white rounded-tr-xs'
                        : 'bg-white border border-[#eaeaea] text-[#1f2937] rounded-tl-xs'
                    }`}
                  >
                    <MarkdownText content={msg.content} />

                    {/* Recommended Dishes Cards List */}
                    {msg.recommendedProducts && msg.recommendedProducts.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-gray-100 space-y-2 w-full">
                        <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-[#e31837]" />
                          Món ăn đề xuất cho bạn:
                        </div>

                        <div className="grid grid-cols-1 gap-2">
                          {msg.recommendedProducts.map((product) => (
                            <div
                              key={product.id}
                              className="bg-[#fafafa] hover:bg-white rounded-xl border border-gray-200 p-2 flex items-center gap-2.5 transition-all duration-200 hover:border-[#fecdd3] hover:shadow-xs group/item"
                            >
                              {/* Product Thumbnail */}
                              <Link
                                href={`/product/${product.slug}`}
                                className="relative w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-gray-100 border border-gray-200"
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={product.image}
                                  alt={product.name}
                                  className="w-full h-full object-cover group-hover/item:scale-105 transition-transform duration-300"
                                  loading="lazy"
                                />
                              </Link>

                              {/* Info */}
                              <div className="flex-1 min-w-0">
                                <Link
                                  href={`/product/${product.slug}`}
                                  className="font-semibold text-xs text-gray-900 truncate block hover:text-[#e31837] transition-colors"
                                  title={product.name}
                                >
                                  {product.name}
                                </Link>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-[#e31837] font-bold text-xs">
                                    {formatVND(product.price)}
                                  </span>
                                  {product.rating > 0 && (
                                    <span className="text-[10px] text-amber-600 flex items-center gap-0.5">
                                      <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                                      {product.rating}
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] text-gray-500 truncate block">
                                  {product.categoryName}
                                </span>
                              </div>

                              {/* Add to Cart Button */}
                              <button
                                type="button"
                                onClick={() => handleProductCardAddToCart(product)}
                                className="shrink-0 bg-[#e31837] hover:bg-[#c9142e] text-white p-2 rounded-lg text-xs font-medium flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                                title="Thêm vào giỏ hàng"
                              >
                                <ShoppingBag className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline text-[11px]">Thêm</span>
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <span className="text-[10px] text-gray-400 mt-1 px-1">
                    {msg.timestamp}
                  </span>
                </div>

                {msg.role === 'user' && (
                  <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {/* Typing Indicator */}
            {isLoading && (
              <div className="flex gap-2.5 justify-start items-center">
                <div className="w-7 h-7 rounded-full bg-[#fdf2f2] border border-[#fecdd3] flex items-center justify-center text-[#e31837] shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-white border border-[#eaeaea] rounded-2xl rounded-tl-xs px-4 py-3 shadow-xs flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#e31837] animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-[#e31837] animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-[#e31837] animate-bounce" style={{ animationDelay: '300ms' }} />
                  <span className="text-[11px] text-gray-400 ml-1.5">Gemma 4 31B đang chọn món...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts Carousel */}
          <div className="px-3 py-2 bg-gray-50/80 border-t border-gray-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
            {QUICK_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleQuickPrompt(prompt)}
                disabled={isLoading}
                className="whitespace-nowrap bg-white hover:bg-[#fff1f2] text-gray-700 hover:text-[#e31837] text-[11px] font-medium px-2.5 py-1 rounded-full border border-gray-200 hover:border-[#fecdd3] transition-colors shrink-0 cursor-pointer disabled:opacity-50"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Chat Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-2.5 bg-white border-t border-gray-200 flex items-center gap-2 shrink-0"
          >
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Nhập món bạn thèm, mức giá, khẩu vị..."
              disabled={isLoading}
              className="flex-1 bg-gray-100 hover:bg-gray-100/80 focus:bg-white text-sm text-gray-900 rounded-xl px-3.5 py-2.5 outline-hidden focus:ring-2 focus:ring-[#e31837]/30 border border-transparent focus:border-[#e31837] transition-all"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isLoading}
              className="w-10 h-10 rounded-xl bg-[#e31837] hover:bg-[#c9142e] text-white flex items-center justify-center shrink-0 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs cursor-pointer active:scale-95"
              aria-label="Gửi tin nhắn"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          {/* Micro Footer Attribution */}
          <div className="bg-gray-100/80 px-3 py-1 text-[10px] text-gray-400 text-center flex items-center justify-center gap-1 shrink-0">
            <span>Powered by Google Gemma 4 31B</span>
            <span>•</span>
            <span>Dữ liệu thực đơn Food.csv</span>
          </div>
        </div>
      )}

      {/* Options Modal for dishes with toppings */}
      {modalProduct && (
        <ProductOptionsModal
          product={modalProduct}
          isOpen={!!modalProduct}
          onClose={() => setModalProduct(null)}
        />
      )}
    </>
  );
}
