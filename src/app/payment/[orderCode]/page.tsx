'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, AlertTriangle, ShoppingCart, RefreshCcw } from 'lucide-react';
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
  const [isCancelling, setIsCancelling] = useState(false);
  const cancellingRef = useRef(false);

  useEffect(() => {
    async function fetchOrder() {
      try {
        const res = await fetch(`/api/orders/${orderCode}`);
        const data = await res.json();
        if (data.success && data.data) {
          setOrder(data.data);
          if (data.data.paymentStatus === 'Paid') {
            setIsPaid(true);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchOrder();

    // Poll payment status every 3 seconds
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/orders/${orderCode}`);
        const data = await res.json();
        if (data.success && data.data) {
          if (data.data.paymentStatus === 'Paid') {
            setIsPaid(true);
            clearInterval(interval);
          }
        }
      } catch (e) {
        // ignore
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [orderCode]);

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
              onClick={handleCancelAndReturnToCart}
              disabled={isCancelling}
              title="Quay lại giỏ hàng và hủy đơn"
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
          onPaymentSuccess={() => setIsPaid(true)}
        />

        {/* Cancel & Restore Cart Action Card */}
        {order.paymentStatus !== 'Paid' && (
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
    </div>
  );
}
