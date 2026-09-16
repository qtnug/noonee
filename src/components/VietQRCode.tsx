'use client';

import React, { useState } from 'react';
import { Copy, Check, QrCode, AlertCircle, RefreshCw, CheckCircle2 } from 'lucide-react';
import { formatVND } from '@/lib/utils';
import { getVietQRImageUrl } from '@/lib/sepay';

interface VietQRCodeProps {
  orderCode: string;
  amount: number;
  bankName?: string;
  accountNo?: string;
  accountName?: string;
  onPaymentSuccess?: () => void;
}

export default function VietQRCode({
  orderCode,
  amount,
  bankName = 'MB',
  accountNo = '0822123346',
  accountName = 'HOANG KHOI NGUYEN - QUAN AN NOONEE',
  onPaymentSuccess,
}: VietQRCodeProps) {
  const [copiedAcc, setCopiedAcc] = useState(false);
  const [copiedMemo, setCopiedMemo] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isPaid, setIsPaid] = useState(false);

  const qrImageUrl = getVietQRImageUrl({
    bankId: bankName,
    accountNo,
    accountName,
    amount,
    memo: orderCode,
  });

  const handleCopyAcc = () => {
    navigator.clipboard.writeText(accountNo);
    setCopiedAcc(true);
    setTimeout(() => setCopiedAcc(false), 2000);
  };

  const handleCopyMemo = () => {
    navigator.clipboard.writeText(orderCode);
    setCopiedMemo(true);
    setTimeout(() => setCopiedMemo(false), 2000);
  };

  const handleSimulatePayment = async () => {
    setIsSimulating(true);
    try {
      const res = await fetch('/api/sepay/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderCode,
          amount,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsPaid(true);
        if (onPaymentSuccess) {
          onPaymentSuccess();
        }
      } else {
        alert(data.message || 'Không thể thực hiện giả lập thanh toán');
      }
    } catch (e: any) {
      console.error('Simulation error:', e);
      alert('Lỗi kết nối giả lập thanh toán: ' + (e.message || 'Vui lòng thử lại'));
    } finally {
      setIsSimulating(false);
    }
  };

  if (isPaid) {
    return (
      <div className="bg-[#fff1f2]/50 border border-[#39bf45] rounded-[12px] p-8 text-center space-y-4 shadow-xs">
        <div className="w-14 h-14 bg-white border border-[#39bf45] text-[#006400] rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-[#181d26]">Thanh toán thành công!</h3>
        <p className="text-[14px] text-[#333840] max-w-md mx-auto">
          Hệ thống đã ghi nhận giao dịch thành công số tiền <strong className="font-bold text-[#e31837]">{formatVND(amount)}</strong> cho đơn hàng <span className="font-mono font-bold bg-white border border-[#dddddd] px-2 py-0.5 rounded-[4px]">{orderCode}</span>.
        </p>
        <div className="pt-2">
          <a
            href={`/orders/${orderCode}`}
            className="inline-flex items-center justify-center bg-[#e31837] hover:bg-[#be0e27] text-white text-[14px] font-semibold px-6 py-3 rounded-[12px] shadow-xs transition"
          >
            Theo dõi đơn hàng
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#dddddd] rounded-[12px] p-6 sm:p-8 space-y-6 shadow-xs">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[4px] bg-[#fff1f2] text-[#e31837] text-[12px] font-bold border border-[#fecdd3]">
          <QrCode className="w-3.5 h-3.5" />
          <span>Thanh toán Chuyển khoản VietQR</span>
        </div>
        <h3 className="text-2xl font-semibold text-[#181d26]">Quét mã QR để thanh toán</h3>
        <p className="text-[13px] text-[#41454d]">
          Mở ứng dụng ngân hàng bất kỳ (Vietcombank, MB, Techcombank, VPBank...) để quét mã
        </p>
      </div>

      {/* QR Display */}
      <div className="flex flex-col items-center justify-center">
        <div className="p-4 bg-white border-2 border-[#fecdd3] rounded-[10px] relative shadow-xs">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrImageUrl}
            alt="Mã VietQR thanh toán"
            className="w-56 h-56 sm:w-64 sm:h-64 object-contain rounded-[6px]"
          />
          <div className="absolute inset-x-0 -bottom-3 flex justify-center">
            <span className="bg-[#e31837] text-white text-[11px] font-bold px-3 py-0.5 rounded-full shadow-xs">
              Khớp lệnh tự động sau 3 giây
            </span>
          </div>
        </div>
      </div>

      {/* Banking Transfer Details */}
      <div className="bg-[#f8fafc] rounded-[10px] p-4 sm:p-5 border border-[#dddddd] space-y-3 text-[13px]">
        <div className="flex justify-between items-center py-1.5 border-b border-[#dddddd]">
          <span className="text-[#41454d]">Ngân hàng nhận:</span>
          <span className="font-semibold text-[#181d26]">{bankName} (MBBank)</span>
        </div>

        <div className="flex justify-between items-center py-1.5 border-b border-[#dddddd]">
          <span className="text-[#41454d]">Số tài khoản:</span>
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-[#e31837] text-[15px]">{accountNo}</span>
            <button
              onClick={handleCopyAcc}
              className="p-1 text-[#9297a0] hover:text-[#e31837] hover:bg-white rounded-[4px] border border-transparent hover:border-[#dddddd] transition"
              title="Sao chép số tài khoản"
            >
              {copiedAcc ? <Check className="w-3.5 h-3.5 text-[#006400]" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        <div className="flex justify-between items-center py-1.5 border-b border-[#dddddd]">
          <span className="text-[#41454d]">Chủ tài khoản:</span>
          <span className="font-semibold text-[#181d26]">{accountName}</span>
        </div>

        <div className="flex justify-between items-center py-1.5 border-b border-[#dddddd]">
          <span className="text-[#41454d]">Số tiền cần thanh toán:</span>
          <span className="font-bold text-[#e31837] text-[16px]">{formatVND(amount)}</span>
        </div>

        <div className="flex justify-between items-center py-2 bg-white p-3 rounded-[6px] border border-[#fecdd3]">
          <div className="space-y-0.5">
            <span className="text-[#181d26] font-semibold block">Nội dung chuyển khoản (bắt buộc):</span>
            <span className="text-[11px] text-[#9297a0]">Giữ nguyên mã đơn để hệ thống tự động xác nhận</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-[#e31837] text-[15px] bg-[#fff1f2] px-2.5 py-1 rounded-[4px] border border-[#fecdd3]">
              {orderCode}
            </span>
            <button
              onClick={handleCopyMemo}
              className="p-1.5 bg-white text-[#41454d] hover:text-[#e31837] rounded-[4px] border border-[#dddddd] hover:bg-[#fff1f2] transition"
              title="Sao chép nội dung"
            >
              {copiedMemo ? <Check className="w-4 h-4 text-[#006400]" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Real-time Checking Status */}
      <div className="flex items-center justify-center gap-2 text-[13px] text-[#41454d] pt-1">
        <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#e31837]" />
        <span>Hệ thống đang tự động kiểm tra giao dịch chuyển khoản...</span>
      </div>

      {/* Testing Simulation Affordance - Compact */}
      <div className="pt-2 border-t border-[#dddddd] flex items-center justify-center gap-2">
        <span className="text-[11px] text-[#9297a0]">Thử nghiệm:</span>
        <button
          type="button"
          onClick={handleSimulatePayment}
          disabled={isSimulating}
          className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-[4px] text-[11px] font-medium transition cursor-pointer disabled:opacity-50"
          title="Giả lập chuyển khoản thành công để test đơn hàng"
        >
          {isSimulating ? (
            <>
              <RefreshCw className="w-3 h-3 animate-spin text-amber-800" />
              <span>Đang xử lý...</span>
            </>
          ) : (
            <span>⚡ Giả lập thanh toán (Sandbox)</span>
          )}
        </button>
      </div>
    </div>
  );
}
