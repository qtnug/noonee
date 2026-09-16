import { Coupon } from '@/types';
import { formatVND } from './utils';
import { MembershipTierName } from './membership';

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
  // Exclusive Membership Tier Vouchers (Hạng cao hơn có trọn bộ voucher của hạng trước)
  {
    code: 'SILVER10',
    name: 'Voucher Thành Viên Bạc - Giảm 10k',
    description: 'Đặc quyền từ Hạng Bạc trở lên: Giảm 10.000đ cho đơn từ 80.000đ.',
    discountType: 'fixed',
    discountValue: 10000,
    minOrderAmount: 80000,
    badge: 'Từ Hạng Bạc',
    minTier: 'Silver',
  },
  {
    code: 'GOLD25',
    name: 'Voucher Thành Viên Vàng - Giảm 25k',
    description: 'Đặc quyền từ Hạng Vàng trở lên: Giảm 25.000đ cho đơn từ 150.000đ.',
    discountType: 'fixed',
    discountValue: 25000,
    minOrderAmount: 150000,
    badge: 'Từ Hạng Vàng',
    minTier: 'Gold',
  },
  {
    code: 'GOLDVIP',
    name: 'Voucher VIP Vàng - Giảm 15%',
    description: 'Đặc quyền từ Hạng Vàng trở lên: Giảm 15% cho đơn từ 200.000đ.',
    discountType: 'percentage',
    discountValue: 15,
    minOrderAmount: 200000,
    badge: 'Từ Hạng Vàng',
    minTier: 'Gold',
  },
  {
    code: 'DIAMOND50',
    name: 'Voucher VIP Kim Cương - Giảm 50k',
    description: 'Đặc quyền Hạng Kim Cương: Giảm 50.000đ cho đơn từ 200.000đ.',
    discountType: 'fixed',
    discountValue: 50000,
    minOrderAmount: 200000,
    badge: 'VIP Kim Cương',
    minTier: 'Diamond',
  },
  {
    code: 'DIAMONDVIP',
    name: 'Voucher VIP Kim Cương - Giảm 20%',
    description: 'Đặc quyền Hạng Kim Cương: Giảm 20% cho đơn từ 250.000đ.',
    discountType: 'percentage',
    discountValue: 20,
    minOrderAmount: 250000,
    badge: 'VIP Kim Cương',
    minTier: 'Diamond',
  },
];

const TIER_RANK: Record<MembershipTierName, number> = {
  Bronze: 0,
  Silver: 1,
  Gold: 2,
  Diamond: 3,
};

const TIER_VI_NAME: Record<MembershipTierName, string> = {
  Bronze: 'Đồng',
  Silver: 'Bạc',
  Gold: 'Vàng',
  Diamond: 'Kim Cương',
};

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
  isNewUser: boolean,
  userTier?: MembershipTierName | null
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

  // Tier check: Higher tiers get all lower tier vouchers
  if (coupon.minTier) {
    const requiredRank = TIER_RANK[coupon.minTier] ?? 0;
    const currentRank = userTier ? (TIER_RANK[userTier] ?? 0) : 0;
    if (currentRank < requiredRank) {
      return {
        valid: false,
        message: `Mã ${coupon.code} chỉ dành cho thành viên từ Hạng ${TIER_VI_NAME[coupon.minTier]} trở lên`,
        discountAmount: 0,
      };
    }
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
