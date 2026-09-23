'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  CiBarcode as QrCode,
  CiMoneyBill as Banknote,
  CiCircleCheck as ShieldCheck,
  CiCircleChevLeft as ArrowLeft,
  CiCircleChevRight as ArrowRight,
  CiRedo as Loader2,
  CiShoppingTag as Tag,
  CiCircleCheck as CheckCircle,
  CiCircleChevDown as ChevronDown,
  CiCircleChevUp as ChevronUp,
  CiMedal as Award,
  CiWallet as Wallet,
  CiCircleAlert as AlertCircle,
  CiUser as Users,
  CiStar as Sparkles,
  CiCircleRemove as X,
  CiDeliveryTruck as Truck,
} from 'react-icons/ci';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { formatVND } from '@/lib/utils';
import { getAllCoupons, validateCoupon } from '@/lib/coupons';
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

  // Coupon state - dual coupon system: 1 food discount + 1 freeship
  const [couponInput, setCouponInput] = useState('');
  const [appliedFoodCoupon, setAppliedFoodCoupon] = useState<Coupon | null>(null);
  const [foodDiscountAmount, setFoodDiscountAmount] = useState(0);
  const [appliedFreeshipCoupon, setAppliedFreeshipCoupon] = useState<Coupon | null>(null);
  const [freeshipDiscountAmount, setFreeshipDiscountAmount] = useState(0);
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');
  const [showCouponsList, setShowCouponsList] = useState(false);
  // couponSlot tracks which slot user is currently selecting for
  const [couponSlot, setCouponSlot] = useState<'food' | 'freeship'>('food');
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

    // Auto-populate from localStorage if not provided
    if (typeof window !== 'undefined') {
      const savedPhone = localStorage.getItem('noonee_saved_phone');
      if (savedPhone && !customerPhone) setCustomerPhone(savedPhone);
      const savedAddr = localStorage.getItem('noonee_saved_address');
      if (savedAddr && !deliveryAddress) setDeliveryAddress(savedAddr);
    }
  }, [user]);

  const handlePaymentMethodChange = (method: 'Sepay' | 'COD') => {
    setPaymentMethod(method);
    if (appliedFoodCoupon && appliedFoodCoupon.requiresVietQR && method !== 'Sepay') {
      setAppliedFoodCoupon(null);
      setFoodDiscountAmount(0);
      setCouponSuccess('');
      setCouponError(`Mã ${appliedFoodCoupon.code} chỉ áp dụng cho Chuyển khoản VietQR. Mã đã được gỡ.`);
    }
  };

  const effectiveTotalPrice = groupOrder ? (groupOrder.subtotal || 0) : totalPrice;
  const groupDiscountAmount = groupOrder ? (groupOrder.discountAmount || 0) : 0;

  const cartProductItems = cart.map((it) => ({
    categoryId: it.product.categoryId,
    isFeatured: it.product.isFeatured,
    name: it.product.name,
  }));

  // Sorted food coupons with discount recommendation
  const sortedFoodCoupons = useMemo(() => {
    const list = getAllCoupons().filter(c => c.couponType === 'food_discount' || !c.couponType);
    return list.map((c) => {
      const check = validateCoupon(c.code, effectiveTotalPrice, paymentMethod, isNewUser, tierInfo?.tier, cartProductItems);
      return {
        coupon: c,
        check,
        discountAmount: check.valid ? check.discountAmount : 0,
      };
    }).sort((a, b) => {
      if (a.check.valid && !b.check.valid) return -1;
      if (!a.check.valid && b.check.valid) return 1;
      return b.discountAmount - a.discountAmount;
    });
  }, [effectiveTotalPrice, paymentMethod, isNewUser, tierInfo, cartProductItems]);

  // Sorted freeship coupons
  const sortedFreeshipCoupons = useMemo(() => {
    const list = getAllCoupons().filter(c => c.couponType === 'freeship');
    return list.map((c) => {
      const check = validateCoupon(c.code, effectiveTotalPrice, paymentMethod, isNewUser, tierInfo?.tier, cartProductItems);
      return {
        coupon: c,
        check,
        discountAmount: check.valid ? check.discountAmount : 0,
      };
    }).sort((a, b) => {
      if (a.check.valid && !b.check.valid) return -1;
      if (!a.check.valid && b.check.valid) return 1;
      return 0;
    });
  }, [effectiveTotalPrice, paymentMethod, isNewUser, tierInfo, cartProductItems]);

  // Combined sorted coupons for modal (food first, then freeship)
  const sortedCouponsWithDiscount = useMemo(() => {
    return [...sortedFoodCoupons, ...sortedFreeshipCoupons];
  }, [sortedFoodCoupons, sortedFreeshipCoupons]);

  const bestFoodCoupon = useMemo(() => {
    const first = sortedFoodCoupons[0];
    if (first && first.check.valid && first.discountAmount > 0) return first;
    return null;
  }, [sortedFoodCoupons]);

  const bestFreeshipCoupon = useMemo(() => {
    const first = sortedFreeshipCoupons[0];
    if (first && first.check.valid) return first;
    return null;
  }, [sortedFreeshipCoupons]);

  // Revalidate food coupon if subtotal changes
  useEffect(() => {
    if (appliedFoodCoupon && effectiveTotalPrice > 0) {
      const recheck = validateCoupon(appliedFoodCoupon.code, effectiveTotalPrice, paymentMethod, isNewUser, tierInfo?.tier, cartProductItems);
      if (!recheck.valid) {
        setAppliedFoodCoupon(null);
        setFoodDiscountAmount(0);
        setCouponSuccess('');
        setCouponError(`Mã giảm giá "${appliedFoodCoupon.code}" đã bị hủy: ${recheck.message || 'Không đủ điều kiện'}`);
      } else {
        setFoodDiscountAmount(recheck.discountAmount);
      }
    }
  }, [effectiveTotalPrice, paymentMethod, isNewUser, tierInfo, appliedFoodCoupon, cart]);

  // Revalidate freeship coupon if subtotal changes
  useEffect(() => {
    if (appliedFreeshipCoupon && effectiveTotalPrice > 0) {
      const recheck = validateCoupon(appliedFreeshipCoupon.code, effectiveTotalPrice, paymentMethod, isNewUser, tierInfo?.tier, cartProductItems);
      if (!recheck.valid) {
        setAppliedFreeshipCoupon(null);
        setFreeshipDiscountAmount(0);
        setCouponError(`Mã freeship "${appliedFreeshipCoupon.code}" đã bị hủy: ${recheck.message || 'Không đủ điều kiện'}`);
      }
    }
  }, [effectiveTotalPrice, paymentMethod, isNewUser, tierInfo, appliedFreeshipCoupon, cart]);

  const handleApplyCoupon = (codeToApply?: string) => {
    const code = (codeToApply || couponInput).trim().toUpperCase();
    setCouponError('');
    setCouponSuccess('');

    if (!code) {
      setCouponError('Vui lòng nhập mã giảm giá');
      return;
    }

    const res = validateCoupon(code, effectiveTotalPrice, paymentMethod, isNewUser, tierInfo?.tier, cartProductItems);
    if (!res.valid) {
      setCouponError(res.message || 'Mã không hợp lệ');
      return;
    }

    const coupon = res.coupon!;
    const isFreeship = coupon.couponType === 'freeship';

    if (isFreeship) {
      setAppliedFreeshipCoupon(coupon);
      setFreeshipDiscountAmount(res.discountAmount);
      setCouponSuccess(`Đã áp dụng mã freeship "${code}" thành công!`);
    } else {
      setAppliedFoodCoupon(coupon);
      setFoodDiscountAmount(res.discountAmount);
      setCouponSuccess(`Đã áp dụng mã "${code}" thành công! Tiết kiệm ${formatVND(res.discountAmount)}`);
    }
    setCouponInput('');
  };

  const handleRemoveFoodCoupon = () => {
    setAppliedFoodCoupon(null);
    setFoodDiscountAmount(0);
    setCouponSuccess('');
    setCouponError('');
  };

  const handleRemoveFreeshipCoupon = () => {
    setAppliedFreeshipCoupon(null);
    setFreeshipDiscountAmount(0);
    setCouponSuccess('');
    setCouponError('');
  };

  const [distanceData, setDistanceData] = useState<DistanceCalculationResult | null>(null);
  const [isCalculatingDistance, setIsCalculatingDistance] = useState(false);
  const isOutOfRange = Boolean(distanceData && (distanceData.isOutOfRange || distanceData.distanceKm > 15));

  const baseShippingFee = distanceData ? distanceData.shippingFee : 15000;
  const memberShippingDiscount = tierInfo ? Math.min(baseShippingFee, tierInfo.shippingDiscount) : 0;
  const shippingFeeAfterMember = Math.max(0, baseShippingFee - memberShippingDiscount);
  // Freeship coupon: nếu mã là FREESHIP thì miễn toàn bộ, nếu mã freeship có discountValue thì giảm theo giá trị đó
  const freeshipCouponDiscount = appliedFreeshipCoupon
    ? (appliedFreeshipCoupon.code === 'FREESHIP'
      ? shippingFeeAfterMember
      : Math.min(shippingFeeAfterMember, freeshipDiscountAmount))
    : 0;
  const effectiveShippingFee = Math.max(0, shippingFeeAfterMember - freeshipCouponDiscount);
  const totalDiscounts = foodDiscountAmount + (groupOrder ? (groupOrder.discountAmount || 0) : 0);
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
            className="px-6 py-3 bg-[#e31837] hover:bg-[#be0e27] text-white font-medium text-[14px] rounded-[6px] shadow-xs transition"
          >
            Đăng nhập tài khoản
          </Link>
          <Link
            href={groupOrder ? `/group/${groupOrder.code}` : '/cart'}
            className="px-6 py-3 bg-white border border-[#dddddd] text-[#181d26] font-medium text-[14px] rounded-[6px] hover:bg-[#f8fafc] transition"
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
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#e31837] text-white font-medium text-[14px] rounded-[6px] hover:bg-[#be0e27] transition"
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
      const currentFreeshipDisc = appliedFreeshipCoupon
        ? (appliedFreeshipCoupon.code === 'FREESHIP'
          ? currentShippingAfterMember
          : Math.min(currentShippingAfterMember, freeshipDiscountAmount))
        : 0;
      const finalShippingFee = Math.max(0, currentShippingAfterMember - currentFreeshipDisc);

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
        couponCode: appliedFoodCoupon ? appliedFoodCoupon.code : null,
        freeshipCouponCode: appliedFreeshipCoupon ? appliedFreeshipCoupon.code : null,
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

      // Automatically save address & phone for next orders (STT 10)
      if (typeof window !== 'undefined') {
        if (deliveryAddress.trim()) localStorage.setItem('noonee_saved_address', deliveryAddress.trim());
        if (customerPhone.trim()) localStorage.setItem('noonee_saved_phone', customerPhone.trim());
      }
      if (user?.id) {
        fetch('/api/user/profile', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
          body: JSON.stringify({
            userId: user.id,
            address: deliveryAddress.trim(),
            phone: customerPhone.trim(),
          }),
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
    <div className="bg-[#FFFAF0] min-h-screen py-6 sm:py-10 pb-20 md:pb-10">
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
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0f172a]">
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

                {/* Virtual Wallet with On/Off Switch (STT 6) */}
                {walletBalance > 0 && (
                  <div className={`p-4 rounded-[10px] border transition-all ${useWallet ? 'bg-gradient-to-r from-blue-50/70 to-emerald-50/70 border-blue-300 shadow-xs' : 'bg-[#f8fafc] border-[#dddddd]'}`}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-[8px] bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                          <Wallet className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[14px] font-bold text-[#181d26]">Ví ảo NooNee Pay</span>
                            <span className="text-[13px] font-extrabold text-[#16a34a] bg-white px-2 py-0.5 rounded border border-emerald-200">
                              {formatVND(walletBalance)}
                            </span>
                          </div>
                          <p className="text-[12px] text-[#41454d] mt-0.5 truncate">
                            {useWallet ? 'Đang bật: tự động trừ số dư ví vào đơn hàng này' : 'Bật công tắc để thanh toán bằng số dư ví'}
                          </p>
                        </div>
                      </div>

                      {/* On / Off Toggle Switch */}
                      <button
                        type="button"
                        role="switch"
                        aria-checked={useWallet}
                        onClick={() => setUseWallet(!useWallet)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          useWallet ? 'bg-[#16a34a]' : 'bg-gray-300'
                        }`}
                        title={useWallet ? 'Tắt thanh toán bằng ví' : 'Bật thanh toán bằng ví'}
                      >
                        <span
                          aria-hidden="true"
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                            useWallet ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {useWallet && walletDeduction > 0 && (
                      <div className="mt-3 pt-3 border-t border-blue-100 space-y-1 text-[12px]">
                        <div className="flex items-center justify-between">
                          <span className="text-blue-950 font-medium">Trừ từ số dư ví:</span>
                          <span className="text-[#006400] font-bold">-{formatVND(walletDeduction)}</span>
                        </div>
                        {isFullyCoveredByWallet ? (
                          <div className="p-2 rounded bg-emerald-100/60 text-emerald-800 font-semibold text-[11px] sm:text-[12px] flex items-center gap-1.5 mt-1">
                            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>Đơn hàng đã được thanh toán 100% bằng số dư ví! Bạn không cần thanh toán thêm.</span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between text-[#e31837] font-semibold pt-1">
                            <span>Số tiền còn lại cần thanh toán:</span>
                            <span>{formatVND(finalTotal)}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-3">
                  {isFullyCoveredByWallet ? (
                    <div className="p-3.5 rounded-[8px] bg-emerald-50 border border-emerald-200 text-emerald-800 text-[13px] font-medium flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Phương thức thanh toán chính: <strong>Ví NooNee Pay</strong> (Đã trừ đủ toàn bộ giá trị đơn hàng)</span>
                    </div>
                  ) : (
                    <>
                      {useWallet && walletDeduction > 0 && (
                        <p className="text-[12px] text-[#9297a0] font-medium">
                          Chọn phương thức thanh toán cho phần tiền còn lại ({formatVND(finalTotal)}):
                        </p>
                      )}
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
                        Quét mã QR qua ứng dụng ngân hàng, khớp lệnh tự động.
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
                        Thanh toán trực tiếp tiền mặt khi nhận hàng.
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
                  </>
                )}
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

              {/* Coupon Section - Dual: 1 Giảm đồ ăn + 1 Freeship */}
              <div className="pt-4 border-t border-[#fecdd3] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-semibold text-[#181d26] flex items-center gap-1.5">
                    <Tag className="w-4 h-4 text-[#e31837]" />
                    <span>Mã ưu đãi</span>
                  </span>
                  <span className="text-[11px] text-[#9297a0]">Tối đa 2 mã / đơn</span>
                </div>

                {/* Slot 1: Giảm đồ ăn */}
                <div>
                  <p className="text-[11px] font-bold text-[#e31837] uppercase tracking-wide mb-1.5 flex items-center gap-1">
                    <Tag className="w-3 h-3" /> Mã giảm đồ ăn
                  </p>
                  {appliedFoodCoupon ? (
                    <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-[8px] flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                        <div className="min-w-0">
                          <span className="font-mono font-bold text-emerald-900 text-[12px]">{appliedFoodCoupon.code}</span>
                          <span className="ml-2 text-[11px] font-extrabold text-emerald-700 bg-white px-1.5 py-0.5 rounded border border-emerald-300">
                            -{formatVND(foodDiscountAmount)}
                          </span>
                          <p className="text-[10px] text-emerald-700 truncate mt-0.5">{appliedFoodCoupon.name}</p>
                        </div>
                      </div>
                      <button type="button" onClick={handleRemoveFoodCoupon} className="p-1 text-gray-400 hover:text-red-500 cursor-pointer shrink-0" title="Gỡ mã">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {bestFoodCoupon && (
                        <div className="p-2.5 bg-red-50/80 border border-[#fecdd3] rounded-[8px] flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <Sparkles className="w-3.5 h-3.5 text-[#e31837] shrink-0" />
                            <div className="min-w-0">
                              <div className="flex items-center gap-1 flex-wrap">
                                <span className="text-[9px] font-extrabold uppercase bg-[#e31837] text-white px-1 py-0.5 rounded">Gợi ý</span>
                                <span className="font-mono font-bold text-[#181d26] text-[12px]">{bestFoodCoupon.coupon.code}</span>
                              </div>
                              <span className="text-[10px] text-[#006400] font-bold">Tiết kiệm {formatVND(bestFoodCoupon.discountAmount)}</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleApplyCoupon(bestFoodCoupon.coupon.code)}
                            className="px-2.5 py-1 bg-[#e31837] hover:bg-[#be0e27] text-white text-[11px] font-bold rounded-[4px] shrink-0 cursor-pointer"
                          >Áp dụng</button>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => { setCouponSlot('food'); setShowCouponsList(true); }}
                        className="w-full p-2.5 bg-white hover:bg-red-50/40 border border-dashed border-[#e31837] rounded-[8px] flex items-center justify-between transition cursor-pointer"
                      >
                        <span className="text-[12px] font-semibold text-[#e31837]">Chọn mã giảm đồ ăn</span>
                        <ArrowRight className="w-3.5 h-3.5 text-[#e31837]" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Slot 2: Freeship */}
                <div>
                  <p className="text-[11px] font-bold text-[#2563eb] uppercase tracking-wide mb-1.5 flex items-center gap-1">
                    <Truck className="w-3 h-3" /> Mã Freeship (giảm phí giao)
                  </p>
                  {appliedFreeshipCoupon ? (
                    <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-[8px] flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <CheckCircle className="w-4 h-4 text-blue-600 shrink-0" />
                        <div className="min-w-0">
                          <span className="font-mono font-bold text-blue-900 text-[12px]">{appliedFreeshipCoupon.code}</span>
                          <span className="ml-2 text-[11px] font-extrabold text-blue-700 bg-white px-1.5 py-0.5 rounded border border-blue-300">
                            Miễn/giảm phí ship
                          </span>
                          <p className="text-[10px] text-blue-700 truncate mt-0.5">{appliedFreeshipCoupon.name}</p>
                        </div>
                      </div>
                      <button type="button" onClick={handleRemoveFreeshipCoupon} className="p-1 text-gray-400 hover:text-red-500 cursor-pointer shrink-0" title="Gỡ mã">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {bestFreeshipCoupon && (
                        <div className="p-2.5 bg-blue-50/80 border border-blue-200 rounded-[8px] flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <Truck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            <div className="min-w-0">
                              <div className="flex items-center gap-1 flex-wrap">
                                <span className="text-[9px] font-extrabold uppercase bg-blue-600 text-white px-1 py-0.5 rounded">Gợi ý</span>
                                <span className="font-mono font-bold text-[#181d26] text-[12px]">{bestFreeshipCoupon.coupon.code}</span>
                              </div>
                              <span className="text-[10px] text-blue-700 font-bold">Miễn phí giao hàng</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleApplyCoupon(bestFreeshipCoupon.coupon.code)}
                            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold rounded-[4px] shrink-0 cursor-pointer"
                          >Áp dụng</button>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => { setCouponSlot('freeship'); setShowCouponsList(true); }}
                        className="w-full p-2.5 bg-white hover:bg-blue-50/40 border border-dashed border-blue-400 rounded-[8px] flex items-center justify-between transition cursor-pointer"
                      >
                        <span className="text-[12px] font-semibold text-blue-600">Chọn mã freeship</span>
                        <ArrowRight className="w-3.5 h-3.5 text-blue-600" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Error / Success messages */}
                {couponError && <p className="text-[12px] text-[#e31837] font-medium">{couponError}</p>}
                {couponSuccess && !couponError && <p className="text-[12px] text-[#006400] font-medium">{couponSuccess}</p>}

                {/* Voucher Modal / Dialog */}
                {showCouponsList && (
                  <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in">
                    <div className="bg-white rounded-[12px] border border-[#dddddd] shadow-2xl max-w-md w-full overflow-hidden flex flex-col max-h-[85vh]">
                      {/* Modal Header */}
                      <div className={`p-4 text-white flex items-center justify-between ${couponSlot === 'freeship' ? 'bg-gradient-to-r from-blue-700 to-blue-500' : 'bg-gradient-to-r from-[#181d26] to-[#2c3440]'}`}>
                        <div className="flex items-center gap-2">
                          {couponSlot === 'freeship' ? <Truck className="w-4 h-4 text-blue-200" /> : <Tag className="w-4 h-4 text-[#e31837]" />}
                          <h3 className="font-bold text-[15px] text-white">
                            {couponSlot === 'freeship' ? 'Chọn mã Freeship' : 'Chọn mã giảm đồ ăn'}
                          </h3>
                        </div>
                        <button type="button" onClick={() => setShowCouponsList(false)} className="p-1 text-gray-300 hover:text-white rounded cursor-pointer">
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Modal Body */}
                      <div className="p-4 overflow-y-auto space-y-4">
                        {/* Custom Input Bar inside modal */}
                        <div>
                          <label className="block text-[12px] font-bold text-[#181d26] mb-1.5">
                            Nhập mã {couponSlot === 'freeship' ? 'freeship' : 'giảm giá'} khác:
                          </label>
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
                              placeholder={couponSlot === 'freeship' ? 'VD: FREESHIP, SHIP15K...' : 'VD: GIAM20K, VIETQR20...'}
                              className={`flex-1 h-9 px-3 text-[12px] uppercase font-mono font-bold bg-[#f8fafc] border rounded-[6px] focus:outline-none ${couponSlot === 'freeship' ? 'border-blue-200 focus:border-blue-500' : 'border-[#dddddd] focus:border-[#e31837]'}`}
                            />
                            <button
                              type="button"
                              onClick={() => handleApplyCoupon()}
                              disabled={!couponInput.trim()}
                              className={`h-9 px-4 text-white text-[12px] font-semibold rounded-[6px] transition cursor-pointer disabled:opacity-50 shrink-0 ${couponSlot === 'freeship' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-[#e31837] hover:bg-[#be0e27]'}`}
                            >
                              Áp dụng
                            </button>
                          </div>
                          {couponError && <p className="text-[12px] text-[#e31837] font-medium mt-1.5">{couponError}</p>}
                          {couponSuccess && !couponError && <p className="text-[12px] text-[#006400] font-medium mt-1.5">{couponSuccess}</p>}
                        </div>

                        {/* Available Coupons List (filtered by slot) */}
                        <div className="space-y-2.5 pt-2 border-t border-[#dddddd]">
                          <span className="text-[12px] font-bold text-[#181d26] block">
                            {couponSlot === 'freeship' ? 'Mã Freeship có sẵn:' : 'Mã giảm đồ ăn có sẵn:'}
                          </span>
                          {(couponSlot === 'freeship' ? sortedFreeshipCoupons : sortedFoodCoupons).map(({ coupon: c, check, discountAmount: disc }) => {
                            const isFreeship = c.couponType === 'freeship';
                            const isApplied = isFreeship
                              ? appliedFreeshipCoupon?.code === c.code
                              : appliedFoodCoupon?.code === c.code;
                            const isEligible = check.valid;
                            const isBestFood = !isFreeship && isEligible && bestFoodCoupon?.coupon.code === c.code;

                            return (
                              <div
                                key={c.code}
                                className={`p-3 rounded-[8px] border text-[12px] transition ${
                                  isApplied
                                    ? (isFreeship ? 'border-blue-400 bg-blue-50/70' : 'border-[#006400] bg-emerald-50/70')
                                    : isBestFood
                                    ? 'border-[#e31837] bg-[#fff1f2]/30 shadow-xs'
                                    : isEligible
                                    ? (isFreeship ? 'border-blue-200 bg-white hover:border-blue-400' : 'border-red-200 bg-white hover:border-[#e31837]')
                                    : 'border-[#dddddd] bg-[#f8fafc] opacity-75'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className={`font-mono font-bold text-[13px] ${isFreeship ? 'text-blue-700' : 'text-[#e31837]'}`}>{c.code}</span>
                                    {isBestFood && (
                                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#e31837] text-white font-extrabold">Tốt nhất</span>
                                    )}
                                    {c.badge && (
                                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold border ${isFreeship ? 'bg-blue-50 text-blue-800 border-blue-200' : 'bg-[#fff1f2] text-[#e31837] border-[#fecdd3]'}`}>
                                        {c.badge}
                                      </span>
                                    )}
                                  </div>
                                  {isApplied ? (
                                    <span className={`font-bold text-[12px] flex items-center gap-1 shrink-0 ${isFreeship ? 'text-blue-700' : 'text-[#006400]'}`}>
                                      <CheckCircle className="w-3.5 h-3.5" /> Đang áp dụng
                                    </span>
                                  ) : (
                                    <button
                                      type="button"
                                      disabled={!isEligible}
                                      onClick={() => {
                                        handleApplyCoupon(c.code);
                                        if (isEligible) setShowCouponsList(false);
                                      }}
                                      className={`px-3 py-1.5 rounded-[4px] text-[12px] font-bold transition shrink-0 cursor-pointer ${
                                        isEligible
                                          ? (isFreeship ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-[#e31837] text-white hover:bg-[#be0e27]')
                                          : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                      }`}
                                    >
                                      Áp dụng
                                    </button>
                                  )}
                                </div>
                                <p className="text-[12px] font-medium text-[#181d26] mt-1.5">{c.name}</p>
                                <p className="text-[11px] text-[#64748b] mt-0.5">{c.description}</p>
                                {isEligible && disc > 0 && (
                                  <p className="text-[11px] text-[#006400] font-bold mt-1">Tiết kiệm: -{formatVND(disc)}</p>
                                )}
                                {isEligible && isFreeship && disc === 0 && (
                                  <p className="text-[11px] text-blue-700 font-bold mt-1">Miễn toàn bộ phí giao hàng!</p>
                                )}
                                {!isEligible && (
                                  <p className="text-[11px] text-amber-700 mt-1 font-medium italic">* {check.message}</p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Modal Footer */}
                      <div className="p-3 bg-[#f8fafc] border-t border-[#dddddd] flex justify-end">
                        <button
                          type="button"
                          onClick={() => setShowCouponsList(false)}
                          className="px-4 py-2 bg-white hover:bg-gray-100 text-[#181d26] text-[13px] font-semibold rounded-[6px] border border-[#dddddd] transition cursor-pointer"
                        >
                          Xong
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>



              {/* Receipt Bill Breakdown (Item 12: Món ăn -> Phí ship -> Mã giảm -> Giảm thành viên -> Tổng tiền) */}
              <div className="bg-white rounded-[8px] p-4 sm:p-5 border border-[#dddddd] space-y-3 shadow-2xs font-mono text-[13px]">
                <div className="text-center font-bold text-[14px] text-[#181d26] pb-2 border-b border-dashed border-[#dddddd] font-sans tracking-wide uppercase">
                  Hóa Đơn Thanh Toán
                </div>

                {/* 1. Tiền món ăn */}
                <div className="flex justify-between text-[#41454d]">
                  <span>Tiền món ăn ({groupOrder ? `${groupOrder.totalQuantity || 0}` : `${cart.length}`} món):</span>
                  <span className="font-semibold text-[#181d26]">{formatVND(effectiveTotalPrice)}</span>
                </div>

                {/* 2. Phí giao hàng (phí ship) */}
                <div className="flex justify-between text-[#41454d]">
                  <div>
                    <span>Phí giao hàng:</span>
                    {isCalculatingDistance ? (
                      <span className="text-[10px] text-[#e31837] flex items-center gap-1 font-normal block font-sans">
                        <Loader2 className="w-3 h-3 animate-spin" /> Đang tính khoảng cách...
                      </span>
                    ) : distanceData ? (
                      <span className="text-[10px] text-gray-500 block font-normal font-sans">
                        {distanceData.distanceText}
                      </span>
                    ) : null}
                  </div>
                  <div>
                    {isCalculatingDistance ? (
                      <span className="text-gray-400 italic text-[11px]">Đang tính...</span>
                    ) : effectiveShippingFee === 0 ? (
                      <span className="text-[#16a34a] font-bold">0₫ (Miễn phí)</span>
                    ) : (
                      <span className="font-semibold text-[#181d26]">
                        {formatVND(effectiveShippingFee)}
                      </span>
                    )}
                  </div>
                </div>

                {/* 3. Mã freeship nếu có */}
                {appliedFreeshipCoupon && freeshipCouponDiscount > 0 && (
                  <div className="flex justify-between text-blue-700 font-semibold">
                    <span>Mã freeship ({appliedFreeshipCoupon.code}):</span>
                    <span>-{formatVND(freeshipCouponDiscount)}</span>
                  </div>
                )}

                {/* 4. Mã giảm đồ ăn nếu có */}
                {appliedFoodCoupon && foodDiscountAmount > 0 && (
                  <div className="flex justify-between text-[#e31837] font-semibold">
                    <span>Mã giảm giá ({appliedFoodCoupon.code}):</span>
                    <span>-{formatVND(foodDiscountAmount)}</span>
                  </div>
                )}

                {/* 5. Giảm giá thành viên / đơn nhóm nếu có */}
                {memberShippingDiscount > 0 && !appliedFreeshipCoupon && (
                  <div className="flex justify-between text-[#16a34a] font-medium">
                    <span>Ưu đãi thành viên ({tierInfo?.name}):</span>
                    <span>-{formatVND(memberShippingDiscount)}</span>
                  </div>
                )}
                {groupOrder && (groupOrder.discountAmount || 0) > 0 && (
                  <div className="flex justify-between text-[#16a34a] font-medium">
                    <span>Giảm giá đơn nhóm ({groupOrder?.discountPercentage}%):</span>
                    <span>-{formatVND(groupOrder.discountAmount || 0)}</span>
                  </div>
                )}

                {/* 6. Trừ ví ảo nếu có */}
                {useWallet && walletDeduction > 0 && (
                  <div className="flex justify-between text-[#2563eb] font-semibold">
                    <span>Trừ từ số dư ví ảo:</span>
                    <span>-{formatVND(walletDeduction)}</span>
                  </div>
                )}

                {/* 7. Tổng thanh toán */}
                <div className="flex justify-between text-[15px] sm:text-[16px] font-extrabold text-[#181d26] pt-3 border-t border-dashed border-[#dddddd]">
                  <span>TỔNG TIỀN:</span>
                  <span className="text-[#e31837] text-lg">
                    {isCalculatingDistance ? 'Đang tính...' : formatVND(finalTotal)}
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
                className="w-full h-12 bg-[#e31837] hover:bg-[#be0e27] active:bg-[#a50b20] text-white font-semibold text-[14px] rounded-[6px] flex items-center justify-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-xs cursor-pointer"
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
