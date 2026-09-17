'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  QrCode,
  Banknote,
  ShieldCheck,
  ArrowLeft,
  ArrowRight,
  Loader2,
  Tag,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Award,
  Wallet,
  AlertCircle,
  Users,
  Sparkles,
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { formatVND } from '@/lib/utils';
import { AVAILABLE_COUPONS, validateCoupon } from '@/lib/coupons';
import { Coupon, GroupOrder } from '@/types';
import { MembershipTierInfo } from '@/lib/membership';
import AddressAutocompleteInput from '@/components/AddressAutocompleteInput';
import { DistanceCalculationResult } from '@/lib/goong';

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const groupCodeParam = searchParams.get('groupCode');

  const { cart, totalPrice, clearCart } = useCart();
  const { user, isLoading, getAuthHeader } = useAuth();

  const [groupOrder, setGroupOrder] = useState<GroupOrder | null>(null);
  const [isLoadingGroup, setIsLoadingGroup] = useState(false);

  const [customerName, setCustomerName] = useState(user?.fullName || '');
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '');
  const [deliveryAddress, setDeliveryAddress] = useState(user?.address || '');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Sepay' | 'COD'>('Sepay');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Coupon state
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');
  const [showCouponsList, setShowCouponsList] = useState(false);
  const [isNewUser, setIsNewUser] = useState(true);
  const [tierInfo, setTierInfo] = useState<MembershipTierInfo | null>(null);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [useWallet, setUseWallet] = useState<boolean>(false);
  const [saveAsDefaultAddress, setSaveAsDefaultAddress] = useState(false);
  const [hpBotTrap, setHpBotTrap] = useState('');

  // Restore coupon if returning from cancelled payment
  useEffect(() => {
    try {
      const restored = localStorage.getItem('noonee_restored_coupon');
      if (restored) {
        localStorage.removeItem('noonee_restored_coupon');
        setTimeout(() => handleApplyCoupon(restored), 300);
      }
    } catch (e) {}
  }, []);

  // Fetch Group Order if groupCode param is present
  useEffect(() => {
    if (groupCodeParam) {
      setIsLoadingGroup(true);
      fetch(`/api/group/${groupCodeParam}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.success && d.data) {
            setGroupOrder(d.data);
            if (!customerName && d.data.hostName) {
              setCustomerName(d.data.hostName);
            }
          }
        })
        .catch((err) => console.error('Error fetching group order in checkout:', err))
        .finally(() => setIsLoadingGroup(false));
    }
  }, [groupCodeParam]);

  useEffect(() => {
    if (user?.id) {
      if (!customerName) setCustomerName(user.fullName || '');
      if (!customerPhone) setCustomerPhone(user.phone || '');
      if (!deliveryAddress) setDeliveryAddress(user.address || '');

      fetch(`/api/user/promo-status?userId=${user.id}`, { headers: getAuthHeader() })
        .then((r) => r.json())
        .then((d) => {
          if (d.success) setIsNewUser(Boolean(d.isNewUser));
        })
        .catch(() => {});

      fetch(`/api/user/profile?userId=${user.id}`, { headers: getAuthHeader() })
        .then((r) => r.json())
        .then((d) => {
          if (d.success && d.data?.tier) setTierInfo(d.data.tier);
          if (d.success && d.data?.user?.walletBalance !== undefined) {
            setWalletBalance(Number(d.data.user.walletBalance) || 0);
          }
        })
        .catch(() => {});
    }
  }, [user]);

  const handlePaymentMethodChange = (method: 'Sepay' | 'COD') => {
    setPaymentMethod(method);
    if (appliedCoupon && appliedCoupon.requiresVietQR && method !== 'Sepay') {
      setAppliedCoupon(null);
      setDiscountAmount(0);
      setCouponSuccess('');
      setCouponError(`Mã ${appliedCoupon.code} chỉ áp dụng cho Chuyển khoản VietQR. Mã đã được gỡ.`);
    }
  };

  const effectiveTotalPrice = groupOrder ? (groupOrder.subtotal || 0) : totalPrice;
  const groupDiscountAmount = groupOrder ? (groupOrder.discountAmount || 0) : 0;

  // Test Case 3.1: Revalidate coupon if subtotal changes or drops below minimum order amount
  useEffect(() => {
    if (appliedCoupon && effectiveTotalPrice > 0) {
      const recheck = validateCoupon(appliedCoupon.code, effectiveTotalPrice, paymentMethod, isNewUser, tierInfo?.tier);
      if (!recheck.valid) {
        setAppliedCoupon(null);
        setDiscountAmount(0);
        setCouponSuccess('');
        setCouponError(`Mã giảm giá "${appliedCoupon.code}" đã bị hủy do đơn hàng không còn đủ điều kiện tối thiểu (${formatVND(appliedCoupon.minOrderAmount)}).`);
      } else {
        setDiscountAmount(recheck.discountAmount);
      }
    }
  }, [effectiveTotalPrice, paymentMethod, isNewUser, tierInfo, appliedCoupon]);

  const handleApplyCoupon = (codeToApply?: string) => {
    const code = (codeToApply || couponInput).trim().toUpperCase();
    setCouponError('');
    setCouponSuccess('');

    if (!code) {
      setCouponError('Vui lòng nhập mã giảm giá');
      return;
    }

    const res = validateCoupon(code, effectiveTotalPrice, paymentMethod, isNewUser, tierInfo?.tier);
    if (!res.valid) {
      setCouponError(res.message || 'Mã không hợp lệ');
      return;
    }

    setAppliedCoupon(res.coupon || null);
    setDiscountAmount(res.discountAmount);
    setCouponSuccess(`Đã áp dụng mã "${code}" thành công!`);
    setCouponInput('');
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setDiscountAmount(0);
    setCouponSuccess('');
    setCouponError('');
  };

  const [distanceData, setDistanceData] = useState<DistanceCalculationResult | null>(null);
  const [isCalculatingDistance, setIsCalculatingDistance] = useState(false);
  const isOutOfRange = Boolean(distanceData && (distanceData.isOutOfRange || distanceData.distanceKm > 15));

  const baseShippingFee = distanceData ? distanceData.shippingFee : 15000;
  const memberShippingDiscount = tierInfo ? Math.min(baseShippingFee, tierInfo.shippingDiscount) : 0;
  const shippingFeeAfterMember = Math.max(0, baseShippingFee - memberShippingDiscount);
  const effectiveShippingFee = appliedCoupon?.code === 'FREESHIP' ? 0 : shippingFeeAfterMember;
  const couponDiscountExcludingFreeship = appliedCoupon?.code === 'FREESHIP' ? 0 : discountAmount;
  const totalDiscounts = couponDiscountExcludingFreeship + groupDiscountAmount;
  const totalBeforeWallet = Math.max(0, effectiveTotalPrice - totalDiscounts + effectiveShippingFee);

  const walletDeduction = useWallet && walletBalance > 0 ? Math.min(walletBalance, totalBeforeWallet) : 0;
  const finalTotal = Math.max(0, totalBeforeWallet - walletDeduction);
  const isFullyCoveredByWallet = useWallet && walletDeduction > 0 && finalTotal === 0;

  if (isLoading || isLoadingGroup) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#e31837]" />
        <p className="text-[14px] text-[#41454d] mt-3">Đang tải thông tin đơn hàng...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center space-y-4">
        <div className="w-14 h-14 rounded-full bg-[#fff1f2] text-[#e31837] flex items-center justify-center mx-auto border border-[#fecdd3]">
          <ShieldCheck className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-normal text-[#181d26]">Vui lòng đăng nhập để đặt hàng</h1>
        <p className="text-[14px] text-[#41454d]">
          Để đảm bảo quyền lợi, theo dõi trạng thái đơn hàng và lưu lịch sử mua sắm, bạn cần đăng nhập tài khoản trước khi thanh toán.
        </p>
        <div className="pt-3 flex gap-3 justify-center">
          <Link
            href="/login"
            className="px-6 py-3 bg-[#e31837] hover:bg-[#be0e27] text-white font-medium text-[14px] rounded-[12px] shadow-xs transition"
          >
            Đăng nhập tài khoản
          </Link>
          <Link
            href={groupOrder ? `/group/${groupOrder.code}` : '/cart'}
            className="px-6 py-3 bg-white border border-[#dddddd] text-[#181d26] font-medium text-[14px] rounded-[12px] hover:bg-[#f8fafc] transition"
          >
            {groupOrder ? 'Quay lại phòng nhóm' : 'Quay lại giỏ hàng'}
          </Link>
        </div>
      </div>
    );
  }

  if (cart.length === 0 && !groupOrder) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center space-y-4">
        <h1 className="text-2xl font-normal text-[#181d26]">Giỏ hàng của bạn đang trống</h1>
        <p className="text-[14px] text-[#41454d]">Vui lòng chọn món trước khi tiến hành đặt hàng.</p>
        <Link
          href="/menu"
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#e31837] text-white font-medium text-[14px] rounded-[12px] hover:bg-[#be0e27] transition"
        >
          Quay lại thực đơn
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!customerName.trim() || !customerPhone.trim() || !deliveryAddress.trim()) {
      setErrorMsg('Vui lòng điền đầy đủ Họ tên, Số điện thoại và Địa chỉ giao hàng');
      return;
    }

    if (isCalculatingDistance) {
      setErrorMsg('Hệ thống đang tính khoảng cách và phí giao hàng cho địa chỉ này, vui lòng đợi trong giây lát...');
      return;
    }

    setIsSubmitting(true);
    try {
      // Safety fallback: if distanceData is still not present, calculate it right before submission
      let currentDistanceData = distanceData;
      if (!currentDistanceData && deliveryAddress.trim()) {
        try {
          const distRes = await fetch('/api/goong/distance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ address: deliveryAddress.trim() }),
          });
          const distJson = await distRes.json();
          if (distJson.success && distJson.data) {
            currentDistanceData = distJson.data;
            setDistanceData(distJson.data);
          }
        } catch (err) {
          console.error('Fallback distance calculation error:', err);
        }
      }

      if (currentDistanceData && (currentDistanceData.isOutOfRange || currentDistanceData.distanceKm > 15)) {
        setErrorMsg(`Rất tiếc, quán chỉ nhận giao hàng trong bán kính 15km từ cơ sở 120 Yên Lãng, Đống Đa. Địa chỉ hiện tại cách quán ${currentDistanceData.distanceText}. Vui lòng chọn địa chỉ nhận món gần hơn.`);
        setIsSubmitting(false);
        return;
      }

      const currentBaseFee = currentDistanceData ? currentDistanceData.shippingFee : baseShippingFee;
      const currentMemberDisc = tierInfo ? Math.min(currentBaseFee, tierInfo.shippingDiscount) : 0;
      const currentShippingAfterMember = Math.max(0, currentBaseFee - currentMemberDisc);
      const finalShippingFee = appliedCoupon?.code === 'FREESHIP' ? 0 : currentShippingAfterMember;

      const groupItems = groupOrder
        ? groupOrder.members.flatMap((m) =>
            (m.items || []).map((it) => {
              let toppingsStr: string | null = null;
              let selectedToppings: any[] = [];
              if (it.toppings) {
                if (Array.isArray(it.toppings)) {
                  selectedToppings = it.toppings;
                  toppingsStr = it.toppings.map((t: any) => `${t.name} (+${formatVND(t.price)})`).join(', ');
                } else if (typeof it.toppings === 'string' && it.toppings.startsWith('[')) {
                  try {
                    selectedToppings = JSON.parse(it.toppings);
                    toppingsStr = selectedToppings.map((t: any) => `${t.name} (+${formatVND(t.price)})`).join(', ');
                  } catch {
                    toppingsStr = String(it.toppings);
                  }
                } else {
                  toppingsStr = String(it.toppings);
                }
              }
              return {
                productId: it.productId,
                productName: it.productName,
                price: it.price,
                quantity: it.quantity,
                selectedToppings,
                toppings: toppingsStr,
                note: it.note ? `[Phần của ${m.name}] ${it.note}` : `[Phần của ${m.name}]`,
              };
            })
          )
        : [];

      const orderItems = groupOrder
        ? groupItems
        : cart.map((it) => ({
            productId: it.product.id,
            productName: it.product.name,
            price: it.itemPrice || it.product.price,
            quantity: it.quantity,
            selectedToppings: it.selectedToppings || [],
            toppings:
              it.selectedToppings && it.selectedToppings.length > 0
                ? it.selectedToppings.map((t) => `${t.name} (+${formatVND(t.price)})`).join(', ')
                : null,
            note: it.note ? it.note.trim() : null,
          }));

      const payload = {
        userId: user.id,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        deliveryAddress: deliveryAddress.trim(),
        notes: groupOrder ? `[Đơn nhóm ${groupOrder.code}] ${notes.trim()}`.trim() : notes.trim(),
        paymentMethod: isFullyCoveredByWallet ? 'Wallet' : paymentMethod,
        couponCode: appliedCoupon ? appliedCoupon.code : null,
        groupCode: groupOrder ? groupOrder.code : null,
        shippingFee: finalShippingFee,
        useWallet: useWallet && walletDeduction > 0,
        walletAmountUsed: walletDeduction,
        items: orderItems,
        hp_bot_trap: hpBotTrap,
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || 'Lỗi khi tạo đơn hàng');
      }

      // Clear the individual cart if not a group order
      if (!groupOrder) {
        clearCart();
      }

      // Save default address if checked
      if (saveAsDefaultAddress && deliveryAddress.trim() && user?.id) {
        fetch('/api/user/profile', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
          body: JSON.stringify({ userId: user.id, address: deliveryAddress.trim() }),
        }).catch(() => {});
      }

      // Redirect based on payment method
      if (data.fullyPaidByWallet || isFullyCoveredByWallet) {
        router.push(`/orders/${data.data.orderCode}`);
      } else if (paymentMethod === 'Sepay') {
        router.push(`/payment/${data.data.orderCode}`);
      } else {
        router.push(`/orders/${data.data.orderCode}`);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white min-h-screen py-6 sm:py-10 pb-20 md:pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="flex items-center gap-3 sm:gap-4 pb-4 sm:pb-6 border-b border-[#dddddd]">
          <Link
            href={groupOrder ? `/group/${groupOrder.code}` : '/cart'}
            className="p-2 text-[#41454d] hover:text-[#e31837] bg-white border border-[#dddddd] rounded-[6px] transition shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-normal text-[#181d26]">
              {groupOrder ? `Thanh toán Đơn nhóm #${groupOrder.code}` : 'Thông tin giao hàng & thanh toán'}
            </h1>
            <p className="text-[13px] sm:text-[14px] text-[#41454d] mt-0.5 sm:mt-1">
              {groupOrder
                ? `Trưởng nhóm thanh toán cho ${groupOrder.members.length} thành viên với ưu đãi giảm trực tiếp ${groupOrder.discountPercentage}%`
                : 'Điền địa chỉ nhận món và chọn phương thức thanh toán thuận tiện'}
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3.5 sm:p-4 bg-[#fff1f2] border border-[#fecdd3] text-[#e31837] rounded-[6px] text-[13px] font-medium">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Honeypot Bot Trap (STT 1) */}
          <input
            type="text"
            name="hp_bot_trap"
            value={hpBotTrap}
            onChange={(e) => setHpBotTrap(e.target.value)}
            style={{ display: 'none' }}
            tabIndex={-1}
            autoComplete="off"
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
            {/* Form Fields */}
            <div className="lg:col-span-7 space-y-5 sm:space-y-6">
              {/* Customer Info Card */}
              <div className="bg-white rounded-[10px] p-4 sm:p-8 border border-[#dddddd] space-y-4 sm:space-y-5">
                <h2 className="text-[15px] sm:text-[16px] font-semibold text-[#181d26]">
                  1. Thông tin người nhận ({groupOrder ? 'Trưởng nhóm' : 'Khách hàng'})
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[13px] font-medium text-[#181d26]">
                      Họ và tên <span className="text-[#e31837]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Nguyễn Văn A"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full h-11 px-3.5 text-[14px] text-[#181d26] bg-white border border-[#dddddd] rounded-[6px] focus:outline-none focus:border-[#e31837] focus:ring-1 focus:ring-[#e31837] transition"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[13px] font-medium text-[#181d26]">
                      Số điện thoại <span className="text-[#e31837]">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="0912345678"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full h-11 px-3.5 text-[14px] text-[#181d26] bg-white border border-[#dddddd] rounded-[6px] focus:outline-none focus:border-[#e31837] focus:ring-1 focus:ring-[#e31837] transition"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-[#181d26]">
                    Địa chỉ nhận món <span className="text-[#e31837]">*</span>
                  </label>
                  <AddressAutocompleteInput
                    value={deliveryAddress}
                    onChange={(addr) => {
                      setDeliveryAddress(addr);
                      if (!addr.trim()) {
                        setDistanceData(null);
                      }
                    }}
                    onDistanceCalculated={(dist) => {
                      setDistanceData(dist);
                      setIsCalculatingDistance(false);
                    }}
                    onCalculatingChange={(isCalc) => setIsCalculatingDistance(isCalc)}
                    required
                  />
                  {user && (
                    <label className="flex items-center gap-2 mt-2 text-[13px] text-[#41454d] cursor-pointer hover:text-[#181d26] select-none">
                      <input
                        type="checkbox"
                        checked={saveAsDefaultAddress}
                        onChange={(e) => setSaveAsDefaultAddress(e.target.checked)}
                        className="w-4 h-4 rounded text-[#e31837] focus:ring-[#e31837] border-[#dddddd]"
                      />
                      <span>Lưu làm địa chỉ nhận hàng mặc định cho tài khoản</span>
                    </label>
                  )}
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[13px] font-medium text-[#181d26]">
                      Ghi chú giao hàng cho tài xế (Tùy chọn)
                    </label>
                    <span className="text-[11px] text-[#9297a0]">
                      Yêu cầu món ăn đã theo từng món riêng
                    </span>
                  </div>
                  <textarea
                    rows={2}
                    placeholder="Ví dụ: Gọi trước khi đến 5 phút, gửi lễ tân / bảo vệ tòa nhà..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full p-3.5 text-[14px] text-[#181d26] bg-white border border-[#dddddd] rounded-[6px] focus:outline-none focus:border-[#e31837] focus:ring-1 focus:ring-[#e31837] transition"
                  />
                </div>
              </div>

              {/* Payment Method Card */}
              <div className="bg-white rounded-[10px] p-4 sm:p-8 border border-[#dddddd] space-y-4">
                <h2 className="text-[15px] sm:text-[16px] font-semibold text-[#181d26]">
                  2. Chọn phương thức thanh toán
                </h2>

                <div className="space-y-3">
                  {/* Sepay Option */}
                  <label
                    onClick={() => handlePaymentMethodChange('Sepay')}
                    className={`flex items-start gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-[10px] border cursor-pointer transition ${
                      paymentMethod === 'Sepay'
                        ? 'border-[#e31837] bg-[#fff1f2]/30 shadow-xs'
                        : 'border-[#dddddd] hover:border-[#9297a0] bg-white'
                    }`}
                  >
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-[6px] bg-[#e31837] text-white flex items-center justify-center shrink-0 mt-0.5">
                      <QrCode className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                        <span className="text-[13px] sm:text-[14px] font-semibold text-[#181d26]">
                          Chuyển khoản VietQR
                        </span>
                        <span className="bg-[#006400] text-white text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded-[4px]">
                          Tự động
                        </span>
                        {isNewUser && (
                          <span className="bg-[#e31837] text-white text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded-[4px] animate-pulse">
                            Giảm 20%
                          </span>
                        )}
                      </div>
                      <p className="text-[12px] sm:text-[13px] text-[#41454d] mt-1 leading-relaxed">
                        Quét mã QR từ bất kỳ ứng dụng ngân hàng di động nào. Hệ thống tự động nhận diện và chuyển đơn vào bếp ngay.
                      </p>
                    </div>
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === 'Sepay'}
                      onChange={() => handlePaymentMethodChange('Sepay')}
                      className="mt-1 accent-[#e31837] shrink-0"
                    />
                  </label>

                  {/* COD Option */}
                  <label
                    onClick={() => handlePaymentMethodChange('COD')}
                    className={`flex items-start gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-[10px] border cursor-pointer transition ${
                      paymentMethod === 'COD'
                        ? 'border-[#e31837] bg-[#fff1f2]/30 shadow-xs'
                        : 'border-[#dddddd] hover:border-[#9297a0] bg-white'
                    }`}
                  >
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-[6px] bg-[#f8fafc] border border-[#dddddd] text-[#181d26] flex items-center justify-center shrink-0 mt-0.5">
                      <Banknote className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] sm:text-[14px] font-semibold text-[#181d26]">
                        Tiền mặt khi nhận hàng (COD)
                      </div>
                      <p className="text-[12px] sm:text-[13px] text-[#41454d] mt-1 leading-relaxed">
                        Thanh toán trực tiếp bằng tiền mặt cho shipper khi nhận được đồ ăn nóng hổi.
                      </p>
                    </div>
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === 'COD'}
                      onChange={() => handlePaymentMethodChange('COD')}
                      className="mt-1 accent-[#e31837] shrink-0"
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Right Summary */}
            <div className="lg:col-span-5 bg-[#fdf2f2]/30 rounded-[10px] p-4 sm:p-8 border border-[#fecdd3] space-y-5 sm:space-y-6">
              <h2 className="text-[15px] sm:text-[16px] font-semibold text-[#181d26] pb-3 border-b border-[#fecdd3]">
                {groupOrder
                  ? `Đơn nhóm #${groupOrder.code} (${groupOrder.totalQuantity || 0} món)`
                  : `Đơn hàng (${cart.length} món)`}
              </h2>

              {/* Items List */}
              {groupOrder ? (
                <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                  {/* Group Info Banner */}
                  <div className="p-3 bg-[#fff1f2] border border-[#fecdd3] rounded-xl space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#e31837] uppercase tracking-wider flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" /> Đơn Đặt Nhóm #{groupOrder.code}
                      </span>
                      <span className="text-xs font-bold bg-[#e31837] text-white px-2 py-0.5 rounded-full">
                        Giảm {groupOrder.discountPercentage}%
                      </span>
                    </div>
                    <p className="text-[12px] text-[#41454d]">
                      Trưởng nhóm: <strong>{groupOrder.hostName}</strong> • {groupOrder.members.length} thành viên • {groupOrder.totalQuantity} món
                    </p>
                  </div>

                  {groupOrder.members.map((m) => {
                    if (!m.items || m.items.length === 0) return null;
                    const mTotal = m.items.reduce((s, it) => s + it.price * it.quantity, 0);
                    return (
                      <div key={m.id} className="bg-white p-3 rounded-xl border border-[#e5e7eb] space-y-2">
                        <div className="font-bold text-[13px] text-[#181d26] flex items-center justify-between pb-1 border-b border-[#f3f4f6]">
                          <span>{m.name} {m.isHost && '(Trưởng nhóm)'}</span>
                          <span className="text-[#e31837]">{formatVND(mTotal)}</span>
                        </div>
                        <div className="space-y-1.5 pl-1">
                          {m.items.map((it) => (
                            <div key={it.id} className="text-[12px] flex justify-between text-[#555a64]">
                              <div className="pr-2">
                                <span className="font-medium text-[#181d26]">{it.productName}</span> x{it.quantity}
                                {it.note && <span className="block text-[11px] text-[#d97706] italic">"{it.note}"</span>}
                              </div>
                              <span className="shrink-0 font-medium">{formatVND(it.price * it.quantity)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="divide-y divide-[#fecdd3] max-h-72 overflow-y-auto pr-1">
                  {cart.map((item) => (
                    <div key={item.cartItemId} className="py-3 first:pt-0 flex items-start justify-between text-[13px] gap-2">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.product.image}
                          alt={item.product.name}
                          className="w-12 h-12 rounded-[6px] object-cover border border-[#dddddd] shrink-0 bg-white"
                        />
                        <div className="min-w-0 space-y-0.5">
                          <div className="font-semibold text-[#181d26] truncate">{item.product.name}</div>

                          {item.selectedToppings && item.selectedToppings.length > 0 && (
                            <div className="text-[11px] text-[#e31837] line-clamp-1">
                              +{item.selectedToppings.map((t) => t.name).join(', ')}
                            </div>
                          )}

                          {item.note && (
                            <div className="text-[11px] text-amber-800 italic line-clamp-1">
                              "{item.note}"
                            </div>
                          )}

                          <div className="text-[#9297a0] text-[11px]">
                            x{item.quantity} • {formatVND(item.itemPrice || item.product.price)}
                          </div>
                        </div>
                      </div>
                      <div className="font-bold text-[#e31837] shrink-0 text-right">
                        {formatVND((item.itemPrice || item.product.price) * item.quantity)}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Coupon Section */}
              <div className="pt-4 border-t border-[#fecdd3] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-semibold text-[#181d26] flex items-center gap-1.5">
                    <Tag className="w-4 h-4 text-[#e31837]" />
                    <span>Mã ưu đãi / Giảm giá</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowCouponsList(!showCouponsList)}
                    className="text-[12px] font-semibold text-[#e31837] hover:underline flex items-center gap-1"
                  >
                    <span>{showCouponsList ? 'Thu gọn' : `Xem mã (${AVAILABLE_COUPONS.length})`}</span>
                    {showCouponsList ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Input & Apply Button */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleApplyCoupon();
                      }
                    }}
                    placeholder="Nhập mã (VD: VIETQR20)"
                    className="flex-1 h-9 px-3 text-[13px] font-mono text-[#181d26] bg-white border border-[#dddddd] rounded-[6px] focus:outline-none focus:border-[#e31837] uppercase placeholder:normal-case"
                  />
                  <button
                    type="button"
                    onClick={() => handleApplyCoupon()}
                    className="h-9 px-3.5 bg-[#e31837] hover:bg-[#be0e27] text-white text-[12px] font-semibold rounded-[6px] transition shrink-0"
                  >
                    Áp dụng
                  </button>
                </div>

                {couponError && (
                  <p className="text-[12px] text-[#e31837] font-medium">{couponError}</p>
                )}

                {couponSuccess && !couponError && (
                  <p className="text-[12px] text-[#006400] font-medium">{couponSuccess}</p>
                )}

                {appliedCoupon && (
                  <div className="flex items-center justify-between p-2.5 bg-[#006400]/10 border border-[#006400]/20 rounded-[6px] text-[12px]">
                    <div className="flex items-center gap-1.5 text-[#006400] font-medium">
                      <CheckCircle className="w-4 h-4 shrink-0" />
                      <span>
                        Mã <strong>{appliedCoupon.code}</strong> (-{formatVND(discountAmount)})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="text-[#e31837] font-semibold hover:underline shrink-0 ml-2"
                    >
                      Gỡ mã
                    </button>
                  </div>
                )}

                {/* Available Coupons Dropdown/List */}
                {showCouponsList && (
                  <div className="space-y-2 pt-2 border-t border-[#fecdd3]/60 max-h-56 overflow-y-auto pr-1">
                    {AVAILABLE_COUPONS.map((c) => {
                      const isApplied = appliedCoupon?.code === c.code;
                      const check = validateCoupon(c.code, effectiveTotalPrice, paymentMethod, isNewUser, tierInfo?.tier);
                      const isEligible = check.valid;

                      return (
                        <div
                          key={c.code}
                          className={`p-2.5 rounded-[8px] border text-[12px] transition ${
                            isApplied
                              ? 'border-[#006400] bg-[#006400]/5'
                              : isEligible
                              ? 'border-[#fecdd3] bg-white hover:border-[#e31837]'
                              : 'border-[#dddddd] bg-[#f8fafc] opacity-80'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-mono font-bold text-[#e31837]">{c.code}</span>
                              {c.badge && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#fff1f2] text-[#e31837] font-medium border border-[#fecdd3]">
                                  {c.badge}
                                </span>
                              )}
                            </div>
                            {isApplied ? (
                              <span className="text-[#006400] font-semibold text-[11px] flex items-center gap-1 shrink-0">
                                <CheckCircle className="w-3 h-3" /> Đang dùng
                              </span>
                            ) : (
                              <button
                                type="button"
                                disabled={!isEligible}
                                onClick={() => handleApplyCoupon(c.code)}
                                className={`px-2.5 py-1 rounded-[4px] text-[11px] font-semibold transition shrink-0 ${
                                  isEligible
                                    ? 'bg-[#e31837] text-white hover:bg-[#be0e27]'
                                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                }`}
                              >
                                Dùng mã
                              </button>
                            )}
                          </div>
                          <p className="text-[11px] text-[#41454d] mt-1">{c.name}</p>
                          {!isEligible && (
                            <p className="text-[10px] text-amber-700 mt-0.5 italic">
                              * {check.message}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Member Tier Perks Box */}
              {tierInfo && (
                <div className="flex items-center justify-between p-3 rounded-[8px] bg-white border border-[#fecdd3] shadow-2xs">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-[#e31837]" />
                    <span className="text-[12px] font-bold text-[#181d26]">{tierInfo.badge}</span>
                  </div>
                  <span className="text-[11px] text-[#16a34a] font-semibold">
                    {memberShippingDiscount > 0
                      ? `Được giảm ${formatVND(memberShippingDiscount)} ship`
                      : 'Thành viên NooNee'}
                  </span>
                </div>
              )}

              {/* Virtual Wallet Box */}
              {walletBalance > 0 && (
                <div className="p-3.5 rounded-[8px] bg-gradient-to-r from-[#eff6ff] to-[#f0fdf4] border border-[#bfdbfe] space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Wallet className="w-4 h-4 text-[#2563eb]" />
                      <span className="text-[13px] font-semibold text-[#181d26]">Số dư ví ảo NooNee</span>
                    </div>
                    <span className="text-[13px] font-bold text-[#16a34a]">{formatVND(walletBalance)}</span>
                  </div>
                  <label className="flex items-center gap-2 text-[12px] text-[#333840] cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={useWallet}
                      onChange={(e) => setUseWallet(e.target.checked)}
                      className="w-4 h-4 text-[#e31837] rounded accent-[#e31837] cursor-pointer"
                    />
                    <span>Sử dụng số dư ví để trừ vào đơn này</span>
                  </label>
                  {useWallet && walletDeduction > 0 && (
                    <div className="text-[11px] text-[#2563eb] font-medium bg-white/80 p-2 rounded border border-[#bfdbfe]">
                      Đã trừ <strong>{formatVND(walletDeduction)}</strong> từ số dư ví.
                      {isFullyCoveredByWallet && (
                        <span className="block text-[#16a34a] font-semibold mt-0.5">
                          ✓ Đơn hàng đã được thanh toán đủ 100% bằng ví!
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Totals Calculation */}
              <div className="space-y-2 pt-4 border-t border-[#fecdd3] text-[13px]">
                <div className="flex justify-between text-[#41454d]">
                  <span>Tạm tính ({groupOrder ? `${groupOrder.totalQuantity || 0} món` : `${cart.length} món`})</span>
                  <span className="font-semibold text-[#181d26]">{formatVND(effectiveTotalPrice)}</span>
                </div>

                {/* Direct Group Discount (giảm trực tiếp không cần voucher) */}
                {groupDiscountAmount > 0 && (
                  <div className="flex justify-between text-[#059669] font-medium">
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-4 h-4" /> Giảm giá đơn nhóm ({groupOrder?.discountPercentage}%)
                    </span>
                    <span>- {formatVND(groupDiscountAmount)}</span>
                  </div>
                )}

                {couponDiscountExcludingFreeship > 0 && (
                  <div className="flex justify-between text-[#e31837] font-medium">
                    <span>Giảm giá voucher ({appliedCoupon?.code})</span>
                    <span>- {formatVND(couponDiscountExcludingFreeship)}</span>
                  </div>
                )}

                <div className="flex justify-between text-[#41454d]">
                  <div>
                    <span>Phí giao hàng</span>
                    {isCalculatingDistance ? (
                      <span className="text-[11px] text-[#e31837] flex items-center gap-1 font-normal mt-0.5">
                        <Loader2 className="w-3 h-3 animate-spin" /> Đang tính phí theo khoảng cách...
                      </span>
                    ) : distanceData ? (
                      <span className="text-[11px] text-gray-500 block font-normal">
                        Khoảng cách: {distanceData.distanceText}
                      </span>
                    ) : (
                      <span className="text-[11px] text-gray-400 block font-normal">
                        (Ước tính theo khoảng cách)
                      </span>
                    )}
                  </div>
                  {isCalculatingDistance ? (
                    <div className="text-right">
                      <span className="text-[12px] text-gray-400 italic">Đang cập nhật...</span>
                    </div>
                  ) : effectiveShippingFee === 0 ? (
                    <div className="text-right">
                      <span className="text-[#16a34a] font-semibold">Miễn phí</span>
                      <span className="text-[10px] text-gray-500 block font-normal">
                        {appliedCoupon?.code === 'FREESHIP'
                          ? '(Voucher FREESHIP)'
                          : tierInfo && tierInfo.shippingDiscount >= baseShippingFee
                          ? `(Đã giảm ${formatVND(tierInfo.shippingDiscount)} ${tierInfo.badge})`
                          : ''}
                      </span>
                    </div>
                  ) : (
                    <div className="text-right">
                      {baseShippingFee !== effectiveShippingFee && (
                        <span className="line-through text-gray-400 text-[11px] mr-1.5">
                          {formatVND(baseShippingFee)}
                        </span>
                      )}
                      <span className="font-semibold text-[#181d26]">{formatVND(effectiveShippingFee)}</span>
                      {memberShippingDiscount > 0 && (
                        <span className="text-[10px] text-[#16a34a] block font-medium">
                          - {formatVND(memberShippingDiscount)} ({tierInfo?.name})
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {useWallet && walletDeduction > 0 && (
                  <div className="flex justify-between text-[#2563eb] font-semibold">
                    <span>Trừ từ số dư ví ảo</span>
                    <span>- {formatVND(walletDeduction)}</span>
                  </div>
                )}

                <div className="flex justify-between text-[16px] font-bold text-[#181d26] pt-3 border-t border-[#fecdd3]">
                  <span>Tổng thanh toán</span>
                  <span className="text-[#e31837] text-lg">
                    {isCalculatingDistance ? 'Đang cập nhật...' : formatVND(finalTotal)}
                  </span>
                </div>
              </div>

              {isOutOfRange && (
                <div className="p-3 bg-[#fff1f2] border border-[#fecdd3] text-[#e31837] rounded-[8px] text-[12px] font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>
                    Địa chỉ giao hàng ({distanceData?.distanceText}) vượt quá bán kính phục vụ 15km của quán. Vui lòng đổi địa chỉ gần hơn để đặt món.
                  </span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || isOutOfRange || isCalculatingDistance}
                className="w-full h-12 bg-[#e31837] hover:bg-[#be0e27] active:bg-[#a50b20] text-white font-semibold text-[14px] rounded-[12px] flex items-center justify-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-xs cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang xử lý đơn hàng...</span>
                  </>
                ) : isCalculatingDistance ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang tính phí giao hàng...</span>
                  </>
                ) : (
                  <>
                    <span>
                      {isFullyCoveredByWallet
                        ? 'Thanh toán bằng số dư ví (0₫)'
                        : paymentMethod === 'Sepay'
                        ? 'Thanh toán qua VietQR'
                        : 'Xác nhận đặt hàng'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[12px] text-[#9297a0] text-center">
                <ShieldCheck className="w-4 h-4 text-[#006400]" />
                <span>Cam kết an toàn và bảo mật thông tin đơn hàng</span>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-md mx-auto px-4 py-24 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#e31837]" />
          <p className="text-[14px] text-[#41454d] mt-3">Đang tải thông tin đơn hàng...</p>
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
