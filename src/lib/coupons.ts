import { Coupon } from '@/types';
import { formatVND } from './utils';

export const AVAILABLE_COUPONS: Coupon[] = [
  {
    code: 'VIETQR20',
    name: 'Giảm 20% đơn đầu tiên bằng VietQR',
    description: 'Ưu đãi dành riêng cho người dùng mới khi thanh toán quét mã VietQR.',
    discountType: 'percentage',
    discountValue: 20,
    minOrderAmount: 0,
    requiresVietQR: true,
    forNewUserOnly: true,
    badge: 'Khách mới 20%',
  },
  {
    code: 'NOONEE20',
    name: 'Giảm 20.000đ đơn từ 100.000đ',
    description: 'Giảm ngay 20.000đ vào tổng tiền khi đơn hàng đạt từ 100.000đ.',
    discountType: 'fixed',
    discountValue: 20000,
    minOrderAmount: 100000,
    badge: 'Đơn từ 100k',
  },
  {
    code: 'NOONEE40',
    name: 'Giảm 40.000đ đơn từ 200.000đ',
    description: 'Giảm ngay 40.000đ vào tổng tiền khi đơn hàng đạt từ 200.000đ.',
    discountType: 'fixed',
    discountValue: 40000,
    minOrderAmount: 200000,
    badge: 'Đơn từ 200k',
  },
  {
    code: 'NOONEE70',
    name: 'Giảm 70.000đ đơn từ 300.000đ',
    description: 'Giảm sâu 70.000đ khi đơn hàng đạt từ 300.000đ trở lên.',
    discountType: 'fixed',
    discountValue: 70000,
    minOrderAmount: 300000,
    badge: 'Đơn từ 300k',
  },
  {
    code: 'FREESHIP',
    name: 'Miễn phí giao hàng (Giảm 15k)',
    description: 'Tặng 15.000đ phí giao hàng cho mọi đơn từ 120.000đ.',
    discountType: 'fixed',
    discountValue: 15000,
    minOrderAmount: 120000,
    badge: 'Freeship 15k',
  },
];

export interface ValidateCouponResult {
  valid: boolean;
  message?: string;
  discountAmount: number;
  coupon?: Coupon;
}

export function validateCoupon(
  inputCode: string,
  subtotal: number,
  paymentMethod: 'Sepay' | 'COD' | string,
  isNewUser: boolean
): ValidateCouponResult {
  const code = (inputCode || '').trim().toUpperCase();
  if (!code) {
    return { valid: false, message: 'Vui lòng nhập mã giảm giá', discountAmount: 0 };
  }

  const coupon = AVAILABLE_COUPONS.find((c) => c.code.toUpperCase() === code);
  if (!coupon) {
    return {
      valid: false,
      message: `Mã giảm giá "${code}" không tồn tại hoặc đã hết hiệu lực`,
      discountAmount: 0,
    };
  }

  if (coupon.forNewUserOnly && !isNewUser) {
    return {
      valid: false,
      message: 'Mã VIETQR20 chỉ áp dụng cho đơn hàng đầu tiên của khách hàng mới',
      discountAmount: 0,
    };
  }

  if (coupon.requiresVietQR && paymentMethod !== 'Sepay') {
    return {
      valid: false,
      message: 'Mã giảm giá này yêu cầu phương thức thanh toán bằng chuyển khoản VietQR',
      discountAmount: 0,
    };
  }

  if (subtotal < coupon.minOrderAmount) {
    return {
      valid: false,
      message: `Đơn hàng của bạn cần đạt tối thiểu ${formatVND(coupon.minOrderAmount)} để sử dụng mã này`,
      discountAmount: 0,
    };
  }

  let discountAmount = 0;
  if (coupon.discountType === 'percentage') {
    discountAmount = Math.min(subtotal, Math.round((subtotal * coupon.discountValue) / 100));
  } else {
    discountAmount = Math.min(subtotal, coupon.discountValue);
  }

  return {
    valid: true,
    discountAmount,
    coupon,
  };
}
