'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, AlertTriangle } from 'lucide-react';
import VietQRCode from '@/components/VietQRCode';
import { Order } from '@/types';
import { formatVND } from '@/lib/utils';

export default function PaymentPage() {
  const params = useParams();
  const router = useRouter();
  const orderCode = params.orderCode as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPaid, setIsPaid] = useState(false);

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
            <Link
              href="/orders"
              className="p-2 text-[#41454d] hover:text-[#e31837] bg-white border border-[#dddddd] rounded-[6px] transition"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
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
