'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  CiCircleChevLeft as ArrowLeft,
  CiRedo as Loader2,
  CiWarning as AlertTriangle,
  CiShoppingCart as ShoppingCart,
  CiRedo as RefreshCcw,
  CiCircleCheck as CheckCircle2,
  CiCircleChevRight as ArrowRight,
  CiHome as Home,
  CiStar as Sparkles,
  CiCircleCheck as Check,
} from 'react-icons/ci';
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
  const [paymentConfig, setPaymentConfig] = useState<{
    bankName: string;
    accountNo: string;
    accountName: string;
    simulationEnabled: boolean;
  }>({
    bankName: '',
    accountNo: '',
    accountName: '',
    simulationEnabled: false,
  });
  const [loadingPaymentConfig, setLoadingPaymentConfig] = useState(true);
  const [isPaid, setIsPaid] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [isCancelling, setIsCancelling] = useState(false);
  const cancellingRef = useRef(false);

  useEffect(() => {
    let isMounted = true;
    fetch('/api/payment-config', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.success && data.data) {
          setPaymentConfig({
            bankName: data.data.bankName || '',
            accountNo: data.data.accountNo || '',
            accountName: data.data.accountName || '',
            simulationEnabled: Boolean(data.data.simulationEnabled),
          });
        }
      })
      .catch((err) => console.error('Lỗi tải cấu hình thanh toán:', err))
      .finally(() => {
        if (isMounted) setLoadingPaymentConfig(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

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
        <Loader2 className="w-8 h-8 animate-spin text-[#A30029] mx-auto" />
        <p className="text-[14px] text-[#41454d]">Đang tải thông tin đơn hàng...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center space-y-4">
        <div className="w-14 h-14 bg-[#fff1f2] text-[#A30029] rounded-[10px] flex items-center justify-center mx-auto border border-[#fecdd3]">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-normal text-[#181d26]">Không tìm thấy đơn hàng</h2>
        <p className="text-[13px] text-[#41454d]">Mã đơn hàng {orderCode} không tồn tại hoặc đã bị xóa.</p>
        <Link
          href="/menu"
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#A30029] hover:bg-[#850021] text-white rounded-[6px] text-[13px] font-semibold transition"
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
              className="p-2 text-[#41454d] hover:text-[#A30029] bg-white border border-[#dddddd] rounded-[6px] transition cursor-pointer hover:border-[#A30029]"
            >
              {isCancelling ? <Loader2 className="w-4 h-4 animate-spin text-[#A30029]" /> : <ArrowLeft className="w-4 h-4" />}
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
            <span className="text-2xl font-bold text-[#A30029]">{formatVND(order.totalAmount)}</span>
          </div>
        </div>

        {/* Main VietQR Component */}
        <VietQRCode
          orderCode={order.orderCode}
          amount={order.totalAmount}
          bankName={paymentConfig.bankName}
          accountNo={paymentConfig.accountNo}
          accountName={paymentConfig.accountName}
          simulationEnabled={paymentConfig.simulationEnabled}
          loadingConfig={loadingPaymentConfig}
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
                <ShoppingCart className="w-4 h-4 text-[#A30029]" />
                Bạn muốn đổi món hoặc chọn lại địa chỉ?
              </span>
              <p className="text-[12px] text-[#9297a0]">
                Ấn nút bên cạnh để hủy đơn chưa thanh toán này và tự động đưa toàn bộ món ăn (kèm mã giảm giá) về lại giỏ hàng.
              </p>
            </div>
            <button
              onClick={handleCancelAndReturnToCart}
              disabled={isCancelling}
              className="px-4 py-2.5 bg-white border border-[#dddddd] hover:border-[#A30029] text-[#181d26] hover:text-[#A30029] text-[13px] font-medium rounded-[8px] transition shrink-0 flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
            >
              {isCancelling ? (
                <Loader2 className="w-4 h-4 animate-spin text-[#A30029]" />
              ) : (
                <RefreshCcw className="w-4 h-4 text-[#A30029]" />
              )}
              <span>Hủy & Hoàn lại giỏ hàng</span>
            </button>
          </div>
        )}

        {/* Order Item Preview */}
        <div className="bg-white rounded-[10px] p-6 border border-[#dddddd] space-y-3 shadow-xs">
          <h3 className="text-[12px] font-semibold uppercase text-[#A30029] tracking-wider">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-[12px] max-w-sm w-full p-6 text-center shadow-xl border border-[#dddddd] space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto">
              <Check className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h2 className="text-lg font-bold text-[#181d26]">Thanh toán thành công</h2>
              <p className="text-[13px] text-[#41454d]">
                Đơn hàng <span className="font-mono font-bold text-[#181d26]">#{orderCode}</span> ({formatVND(order.totalAmount)}) đã được chuyển vào bếp.
              </p>
            </div>

            <button
              onClick={handleGoToOrder}
              className="w-full py-2.5 px-4 bg-[#A30029] hover:bg-[#850021] text-white rounded-[6px] text-[13px] font-semibold transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
            >
              <span>Theo dõi đơn hàng ({countdown}s)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
