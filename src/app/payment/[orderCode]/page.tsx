'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, AlertTriangle, ShoppingCart, RefreshCcw, CheckCircle2, ArrowRight, Home, Sparkles, Check } from 'lucide-react';
import VietQRCode from '@/components/VietQRCode';
import { Order, CartItem } from '@/types';
import { formatVND } from '@/lib/utils';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';

export default function PaymentPage() {
  const params = useParams();
  const router = useRouter();
  const orderCode = params.orderCode as string;

  const { restoreCart } = useCart();
  const { getAuthHeader } = useAuth();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPaid, setIsPaid] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [isCancelling, setIsCancelling] = useState(false);
  const cancellingRef = useRef(false);

  useEffect(() => {
    let isMounted = true;
    let pollInterval: NodeJS.Timeout | null = null;

    async function checkStatus() {
      try {
        const res = await fetch(`/api/orders/${orderCode}?t=${Date.now()}`, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate', 'Pragma': 'no-cache' },
        });
        const data = await res.json();
        if (data.success && data.data && isMounted) {
          setOrder(data.data);
          if (data.data.paymentStatus === 'Paid') {
            setIsPaid(true);
            setShowSuccessModal(true);
            if (pollInterval) clearInterval(pollInterval);
            return true;
          }
        }
      } catch (err) {
        console.error('Lỗi kiểm tra trạng thái thanh toán:', err);
      }
      return false;
    }

    // Initial check
    (async () => {
      await checkStatus();
      if (isMounted) setLoading(false);
    })();

    // Poll payment status every 2 seconds
    pollInterval = setInterval(async () => {
      const done = await checkStatus();
      if (done && pollInterval) {
        clearInterval(pollInterval);
      }
    }, 2000);

    return () => {
      isMounted = false;
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [orderCode]);

  // Countdown timer to auto-redirect after payment success
  useEffect(() => {
    if (!showSuccessModal) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push(`/orders/${orderCode}?paymentSuccess=true`);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [showSuccessModal, orderCode, router]);

  const handleGoToOrder = () => {
    router.push(`/orders/${orderCode}?paymentSuccess=true`);
  };

  // Intercept browser back button to auto-cancel and restore cart (STT 14 & 15)
  useEffect(() => {
    if (!order || isPaid || order.paymentStatus === 'Paid') return;

    window.history.pushState({ page: 'payment' }, '', window.location.href);

    const handlePopState = () => {
      if (!cancellingRef.current && !isPaid && order?.paymentStatus !== 'Paid') {
        handleCancelAndReturnToCart();
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [order, isPaid]);

  const handleCancelAndReturnToCart = async () => {
    if (!order || cancellingRef.current) return;
    if (order.paymentStatus === 'Paid') {
      router.push(`/orders/${orderCode}`);
      return;
    }

    cancellingRef.current = true;
    setIsCancelling(true);
    try {
      // 1. Fetch genuine products to rebuild complete CartItem objects
      let dbProducts: any[] = [];
      try {
        const prodRes = await fetch('/api/products?limit=200');
        const prodJson = await prodRes.json();
        if (prodJson.success && Array.isArray(prodJson.data)) {
          dbProducts = prodJson.data;
        }
      } catch (err) {
        console.error('Failed to fetch products for restore:', err);
      }

      // 2. Map order.items back to CartItem[]
      const restoredItems: CartItem[] = (order.items || []).map((it) => {
        const dbProd = dbProducts.find((p) => p.id === it.productId);
        const selectedToppings: any[] = [];
        if (it.toppings && Array.isArray(dbProd?.toppings)) {
          for (const top of dbProd.toppings) {
            if (typeof it.toppings === 'string' && it.toppings.includes(top.name)) {
              selectedToppings.push(top);
            }
          }
        }
        const toppingsPrice = selectedToppings.reduce((s: number, t: any) => s + (t.price || 0), 0);
        const basePrice = dbProd ? dbProd.price : (it.price > toppingsPrice ? it.price - toppingsPrice : it.price);

        return {
          cartItemId: `restored_${it.productId}_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          product: dbProd || {
            id: it.productId,
            name: it.productName,
            price: basePrice,
            image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
            isAvailable: true,
            isFeatured: false,
            rating: 5.0,
            categoryId: 1,
            categoryName: '',
            slug: '',
            description: '',
          },
          quantity: it.quantity,
          selectedToppings,
          note: it.note || '',
          itemPrice: it.price || (basePrice + toppingsPrice),
        };
      });

      // 3. Put items back in cart
      if (restoredItems.length > 0) {
        restoreCart(restoredItems);
      }

      // 4. Restore voucher if there was one applied to this order
      if (order.couponCode) {
        localStorage.setItem('noonee_restored_coupon', order.couponCode);
      }

      // 5. Cancel the unpaid order on server
      await fetch(`/api/orders/${orderCode}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ action: 'cancel', cancelReason: 'Khách hủy để chọn lại món' }),
      });

      router.push('/cart?restored=true');
    } catch (e) {
      console.error('Error cancelling order and restoring cart:', e);
      router.push('/cart');
    } finally {
      setIsCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-[#e31837] mx-auto" />
        <p className="text-[14px] text-[#41454d]">Đang tải thông tin đơn hàng...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center space-y-4">
        <div className="w-14 h-14 bg-[#fff1f2] text-[#e31837] rounded-[10px] flex items-center justify-center mx-auto border border-[#fecdd3]">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-normal text-[#181d26]">Không tìm thấy đơn hàng</h2>
        <p className="text-[13px] text-[#41454d]">Mã đơn hàng {orderCode} không tồn tại hoặc đã bị xóa.</p>
        <Link
          href="/menu"
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#e31837] hover:bg-[#be0e27] text-white rounded-[6px] text-[13px] font-semibold transition"
        >
          Xem thực đơn
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen py-10">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#dddddd]">
          <div className="flex items-center gap-3">
            <button
              onClick={isPaid || order.paymentStatus === 'Paid' ? handleGoToOrder : handleCancelAndReturnToCart}
              disabled={isCancelling}
              title={isPaid || order.paymentStatus === 'Paid' ? 'Xem đơn hàng' : 'Quay lại giỏ hàng và hủy đơn'}
              className="p-2 text-[#41454d] hover:text-[#e31837] bg-white border border-[#dddddd] rounded-[6px] transition cursor-pointer hover:border-[#e31837]"
            >
              {isCancelling ? <Loader2 className="w-4 h-4 animate-spin text-[#e31837]" /> : <ArrowLeft className="w-4 h-4" />}
            </button>
            <div>
              <h1 className="text-2xl font-normal text-[#181d26]">
                Thanh toán đơn hàng #{orderCode}
              </h1>
              <p className="text-[13px] text-[#41454d]">
                Khách hàng: <strong className="text-[#181d26] font-medium">{order.customerName}</strong> ({order.customerPhone})
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[12px] text-[#9297a0] block">Số tiền cần thanh toán</span>
            <span className="text-2xl font-bold text-[#e31837]">{formatVND(order.totalAmount)}</span>
          </div>
        </div>

        {/* Main VietQR Component */}
        <VietQRCode
          orderCode={order.orderCode}
          amount={order.totalAmount}
          bankName={process.env.SEPAY_BANK_NAME || 'MB'}
          accountNo={process.env.SEPAY_BANK_ACCOUNT || '0822123346'}
          accountName={process.env.SEPAY_ACCOUNT_NAME || 'HOANG KHOI NGUYEN - QUAN AN NOONEE'}
          isPaid={isPaid || order.paymentStatus === 'Paid'}
          onPaymentSuccess={() => {
            setIsPaid(true);
            setShowSuccessModal(true);
          }}
        />

        {/* Cancel & Restore Cart Action Card (only if unpaid) */}
        {!isPaid && order.paymentStatus !== 'Paid' && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-[#f8fafc] border border-[#dddddd] rounded-[10px]">
            <div className="text-[13px] text-[#41454d] space-y-0.5">
              <span className="font-semibold text-[#181d26] flex items-center gap-1.5">
                <ShoppingCart className="w-4 h-4 text-[#e31837]" />
                Bạn muốn đổi món hoặc chọn lại địa chỉ?
              </span>
              <p className="text-[12px] text-[#9297a0]">
                Ấn nút bên cạnh để hủy đơn chưa thanh toán này và tự động đưa toàn bộ món ăn (kèm mã giảm giá) về lại giỏ hàng.
              </p>
            </div>
            <button
              onClick={handleCancelAndReturnToCart}
              disabled={isCancelling}
              className="px-4 py-2.5 bg-white border border-[#dddddd] hover:border-[#e31837] text-[#181d26] hover:text-[#e31837] text-[13px] font-medium rounded-[8px] transition shrink-0 flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
            >
              {isCancelling ? (
                <Loader2 className="w-4 h-4 animate-spin text-[#e31837]" />
              ) : (
                <RefreshCcw className="w-4 h-4 text-[#e31837]" />
              )}
              <span>Hủy & Hoàn lại giỏ hàng</span>
            </button>
          </div>
        )}

        {/* Order Item Preview */}
        <div className="bg-white rounded-[10px] p-6 border border-[#dddddd] space-y-3 shadow-xs">
          <h3 className="text-[12px] font-semibold uppercase text-[#e31837] tracking-wider">
            Món ăn trong đơn hàng
          </h3>
          <div className="divide-y divide-[#dddddd] text-[13px]">
            {order.items?.map((item, idx) => (
              <div key={idx} className="py-2.5 first:pt-0 flex justify-between">
                <span className="text-[#333840]">
                  {item.productName} <strong className="text-[#9297a0] font-normal">x{item.quantity}</strong>
                </span>
                <span className="font-semibold text-[#181d26]">{formatVND(item.total || item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="pt-3 border-t border-[#dddddd] flex justify-between text-[13px] text-[#41454d]">
            <span>Địa chỉ giao hàng:</span>
            <span className="font-semibold text-[#181d26]">{order.deliveryAddress}</span>
          </div>
        </div>
      </div>

      {/* Payment Success Celebratory Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[16px] max-w-md w-full p-6 sm:p-8 text-center shadow-2xl border border-[#dddddd] space-y-5 animate-in zoom-in-95 duration-200">
            {/* Animated Success Icon */}
            <div className="relative mx-auto w-20 h-20">
              <div className="absolute inset-0 rounded-full bg-[#10b981]/20 animate-ping opacity-75" />
              <div className="relative w-20 h-20 rounded-full bg-[#ecfdf5] border-2 border-[#10b981] flex items-center justify-center text-[#10b981] shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>
            </div>

            {/* Title & Description */}
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ecfdf5] text-[#047857] text-[12px] font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-[#10b981]" />
                Xác nhận thanh toán thành công
              </div>
              <h2 className="text-2xl font-bold text-[#181d26]">
                🎉 Thanh Toán Thành Công!
              </h2>
              <p className="text-[13px] text-[#41454d]">
                Hệ thống quán đã nhận được tiền cho đơn hàng của bạn. Bếp đang bắt đầu chuẩn bị món ăn nóng hổi ngay bây giờ!
              </p>
            </div>

            {/* Receipt Summary Box */}
            <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-[10px] p-4 text-left space-y-2.5 text-[13px]">
              <div className="flex justify-between items-center text-[#41454d]">
                <span>Mã đơn hàng:</span>
                <span className="font-mono font-bold text-[#181d26]">#{orderCode}</span>
              </div>
              <div className="flex justify-between items-center text-[#41454d]">
                <span>Số tiền đã thanh toán:</span>
                <span className="font-bold text-[#e31837] text-[16px]">
                  {formatVND(order.totalAmount)}
                </span>
              </div>
              <div className="flex justify-between items-center text-[#41454d]">
                <span>Phương thức:</span>
                <span className="font-medium text-[#181d26]">Chuyển khoản VietQR</span>
              </div>
              <div className="flex justify-between items-center text-[#41454d]">
                <span>Trạng thái nhà bếp:</span>
                <span className="inline-flex items-center gap-1 font-semibold text-[#047857]">
                  <Check className="w-3.5 h-3.5 text-[#10b981]" /> Đã chuyển vào bếp
                </span>
              </div>
            </div>

            {/* Countdown redirect prompt */}
            <div className="text-[12px] text-[#64748b]">
              Tự động chuyển đến trang theo dõi đơn hàng sau{' '}
              <strong className="text-[#e31837] font-bold text-[14px]">{countdown}s</strong>...
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <button
                onClick={handleGoToOrder}
                className="flex-1 py-3 px-4 bg-[#e31837] hover:bg-[#be0e27] text-white rounded-[8px] text-[13px] font-semibold transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                <span>Theo dõi đơn hàng ngay</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <Link
                href="/"
                className="py-3 px-4 bg-white hover:bg-[#f8fafc] text-[#41454d] border border-[#dddddd] rounded-[8px] text-[13px] font-medium transition flex items-center justify-center gap-1.5"
              >
                <Home className="w-4 h-4" />
                <span>Trang chủ</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
