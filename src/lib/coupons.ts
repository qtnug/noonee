import { Coupon } from '@/types';
import { formatVND } from './utils';
import { MembershipTierName } from './membership';

// Coupons are strictly loaded and managed in database (MSSQL)
export const AVAILABLE_COUPONS: Coupon[] = [];

// Helper to generate non-guessable random coupon codes
export function generateRandomCouponCode(prefix: string = 'NOONEE'): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let rand = '';
  for (let i = 0; i < 5; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}_${rand}`;
}

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

export function getAllCoupons(): Coupon[] {
  return [];
}

export function findCouponByCode(code: string): Coupon | undefined {
  return undefined;
}

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
  userTier?: MembershipTierName | null,
  cartItems?: { categoryId?: number; isFeatured?: boolean; name?: string; [key: string]: any }[],
  couponsList?: Coupon[]
): ValidateCouponResult {
  const code = (inputCode || '').trim().toUpperCase();
  if (!code) {
    return { valid: false, message: 'Vui lòng nhập mã giảm giá', discountAmount: 0 };
  }

  const coupon = couponsList && couponsList.length > 0
    ? couponsList.find((c) => c.code.toUpperCase() === code)
    : findCouponByCode(code);
  if (!coupon) {
    return {
      valid: false,
      message: `Mã giảm giá "${code}" không tồn tại hoặc đã hết hiệu lực`,
      discountAmount: 0,
    };
  }

  if (coupon.isActive === false) {
    return {
      valid: false,
      message: `Mã giảm giá "${coupon.code}" đang tạm dừng áp dụng`,
      discountAmount: 0,
    };
  }

  // 1. Expiry date check
  if (coupon.expiryDate) {
    const now = new Date();
    const exp = new Date(coupon.expiryDate);
    exp.setHours(23, 59, 59, 999);
    if (now.getTime() > exp.getTime()) {
      return {
        valid: false,
        message: `Mã giảm giá "${coupon.code}" đã hết hạn sử dụng vào ngày ${coupon.expiryDate}`,
        discountAmount: 0,
      };
    }
  }

  // 2. Usage limit check
  if (coupon.usageLimit && (coupon.usedCount || 0) >= coupon.usageLimit) {
    return {
      valid: false,
      message: `Mã giảm giá "${coupon.code}" đã hết lượt sử dụng (${coupon.usageLimit} lượt)`,
      discountAmount: 0,
    };
  }

  // 3. Category exclusivity check
  if (coupon.categoryExclusive && cartItems && cartItems.length > 0) {
    if (coupon.categoryExclusive === 'rice') {
      const hasRice = cartItems.some(
        item => item.categoryId === 1 || item.categoryId === 4 || item.categoryId === 5 || (item.name && (item.name.toLowerCase().includes('cơm') || item.name.toLowerCase().includes('bún') || item.name.toLowerCase().includes('phở') || item.name.toLowerCase().includes('mì')))
      );
      if (!hasRice) {
        return {
          valid: false,
          message: 'Mã giảm giá này chỉ áp dụng cho đơn hàng có món Cơm, Bún mì hoặc Phở',
          discountAmount: 0,
        };
      }
    } else if (coupon.categoryExclusive === 'drinks') {
      const hasDrinks = cartItems.some(
        item =>
          item.categoryId === 3 ||
          (item.name &&
            (item.name.toLowerCase().includes('trà') ||
              item.name.toLowerCase().includes('nước') ||
              item.name.toLowerCase().includes('sữa') ||
              item.name.toLowerCase().includes('chè') ||
              item.name.toLowerCase().includes('cà phê')))
      );
      if (!hasDrinks) {
        return {
          valid: false,
          message: 'Mã giảm giá này chỉ áp dụng cho đơn hàng có món Đồ uống',
          discountAmount: 0,
        };
      }
    } else if (coupon.categoryExclusive === 'best_seller') {
      const hasBestSeller = cartItems.some(item => item.isFeatured);
      if (!hasBestSeller) {
        return {
          valid: false,
          message: 'Mã giảm giá này chỉ áp dụng cho đơn hàng có món Bán Chạy (Best Seller)',
          discountAmount: 0,
        };
      }
    }
  }

  // 4. Tier check: Higher tiers get all lower tier vouchers
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

  // 5. New user check
  if (coupon.forNewUserOnly && !isNewUser) {
    return {
      valid: false,
      message: 'Mã VIETQR20 chỉ áp dụng cho đơn hàng đầu tiên của khách hàng mới',
      discountAmount: 0,
    };
  }

  // 6. VietQR check
  if (coupon.requiresVietQR && paymentMethod !== 'Sepay') {
    return {
      valid: false,
      message: 'Mã giảm giá này yêu cầu phương thức thanh toán bằng chuyển khoản VietQR',
      discountAmount: 0,
    };
  }

  // 7. Min order amount check
  if (subtotal < coupon.minOrderAmount) {
    return {
      valid: false,
      message: `Đơn hàng của bạn cần đạt tối thiểu ${formatVND(coupon.minOrderAmount)} để sử dụng mã này`,
      discountAmount: 0,
    };
  }

  // Freeship coupons: discountAmount = 0 (handled separately via shippingFee logic)
  if (coupon.couponType === 'freeship' && coupon.code === 'FREESHIP') {
    return { valid: true, discountAmount: 0, coupon };
  }

  let discountAmount = 0;
  if (coupon.discountType === 'percentage') {
    const calculated = Math.round((subtotal * coupon.discountValue) / 100);
    discountAmount = coupon.maxDiscountAmount
      ? Math.min(coupon.maxDiscountAmount, calculated)
      : Math.min(subtotal, calculated);
  } else {
    discountAmount = Math.min(subtotal, coupon.discountValue);
  }

  return {
    valid: true,
    discountAmount,
    coupon,
  };
}
