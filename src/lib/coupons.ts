import { Coupon } from '@/types';
import { formatVND } from './utils';
import { MembershipTierName } from './membership';

// In-memory store for custom coupons created by Admin
let customCoupons: Coupon[] = [];

// Helper to generate non-guessable random coupon codes
export function generateRandomCouponCode(prefix: string = 'NOONEE'): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let rand = '';
  for (let i = 0; i < 5; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}_${rand}`;
}

export const AVAILABLE_COUPONS: Coupon[] = [
  // 1. New User & VietQR
  {
    code: 'VIETQR20',
    name: 'Giảm 20% đơn đầu tiên bằng VietQR',
    description: 'Ưu đãi đặc quyền cho khách hàng mới khi thanh toán quét mã VietQR.',
    discountType: 'percentage',
    discountValue: 20,
    minOrderAmount: 0,
    maxDiscountAmount: 40000,
    requiresVietQR: true,
    forNewUserOnly: true,
    badge: 'Khách mới 20%',
    expiryDate: '2026-12-31',
    usageLimit: 1000,
    usedCount: 84,
  },
  {
    code: 'FREESHIP',
    name: 'Miễn phí giao hàng (Tặng 15k)',
    description: 'Hỗ trợ 15.000 ₫ chi phí vận chuyển cho mọi đơn hàng từ 120.000 ₫.',
    discountType: 'fixed',
    discountValue: 15000,
    minOrderAmount: 120000,
    badge: 'Freeship 15k',
    expiryDate: '2026-12-31',
    usageLimit: 500,
    usedCount: 162,
  },

  // 2. Đơn Cơm & Món chính độc quyền (STT 3: mã ngẫu nhiên khó đoán)
  {
    code: 'COM_R9X4A',
    name: 'Độc quyền Cơm & Món chính - Giảm 20k',
    description: 'Giảm 20.000 ₫ cho các đơn có Cơm rang, Cơm tấm, Phở bò từ 70.000 ₫.',
    discountType: 'fixed',
    discountValue: 20000,
    minOrderAmount: 70000,
    categoryExclusive: 'rice',
    badge: 'Đơn cơm -20k',
    expiryDate: '2026-12-31',
    usageLimit: 200,
    usedCount: 43,
  },
  {
    code: 'COM_M82K7',
    name: 'Độc quyền Cơm trưa NooNee - Giảm 15k',
    description: 'Giảm 15.000 ₫ cho đơn có món Cơm & Món chính từ 50.000 ₫.',
    discountType: 'fixed',
    discountValue: 15000,
    minOrderAmount: 50000,
    categoryExclusive: 'rice',
    badge: 'Đơn cơm -15k',
    expiryDate: '2026-12-31',
    usageLimit: 300,
    usedCount: 78,
  },

  // 3. Đồ uống độc quyền (STT 3: mã ngẫu nhiên khó đoán)
  {
    code: 'NUOC_D7H1P',
    name: 'Độc quyền Trà sữa & Đồ uống - Giảm 15k',
    description: 'Giảm 15.000 ₫ cho đơn có Trà sữa, Trà đào, Cà phê hoặc Chè từ 45.000 ₫.',
    discountType: 'fixed',
    discountValue: 15000,
    minOrderAmount: 45000,
    categoryExclusive: 'drinks',
    badge: 'Đồ uống -15k',
    expiryDate: '2026-12-31',
    usageLimit: 250,
    usedCount: 56,
  },
  {
    code: 'NUOC_T5W9E',
    name: 'Tiệc Trà chiều NooNee - Giảm 25k',
    description: 'Giảm 25.000 ₫ cho hóa đơn Đồ uống từ 80.000 ₫ trở lên.',
    discountType: 'fixed',
    discountValue: 25000,
    minOrderAmount: 80000,
    categoryExclusive: 'drinks',
    badge: 'Đồ uống -25k',
    expiryDate: '2026-12-31',
    usageLimit: 150,
    usedCount: 29,
  },

  // 4. Mã giảm phần trăm 20% - 30% - 50% (STT 3)
  {
    code: 'GIAM_P20X8',
    name: 'Ưu đãi tiệc ngon - Giảm 20%',
    description: 'Giảm 20% tối đa 35.000 ₫ cho toàn bộ thực đơn đơn từ 80.000 ₫.',
    discountType: 'percentage',
    discountValue: 20,
    maxDiscountAmount: 35000,
    minOrderAmount: 80000,
    badge: 'Giảm 20%',
    expiryDate: '2026-12-31',
    usageLimit: 200,
    usedCount: 88,
  },
  {
    code: 'GIAM_P30K9',
    name: 'Đại tiệc NooNee - Giảm 30%',
    description: 'Giảm sâu 30% tối đa 50.000 ₫ cho hóa đơn từ 120.000 ₫.',
    discountType: 'percentage',
    discountValue: 30,
    maxDiscountAmount: 50000,
    minOrderAmount: 120000,
    badge: 'Giảm 30%',
    expiryDate: '2026-11-30',
    usageLimit: 100,
    usedCount: 61,
  },
  {
    code: 'GIAM_P50Q3',
    name: 'Siêu Deal Vàng - Giảm 50%',
    description: 'Giảm cực lớn 50% tối đa 70.000 ₫ cho đơn hàng từ 160.000 ₫.',
    discountType: 'percentage',
    discountValue: 50,
    maxDiscountAmount: 70000,
    minOrderAmount: 160000,
    badge: 'Siêu Deal 50%',
    expiryDate: '2026-10-31',
    usageLimit: 60,
    usedCount: 37,
  },

  // 5. Mã giảm tiền mặt 10k - 20k - 30k - 50k (STT 3)
  {
    code: 'GIAM_10K7D',
    name: 'Tiết kiệm nhanh - Giảm 10k',
    description: 'Giảm ngay 10.000 ₫ cho đơn hàng từ 50.000 ₫.',
    discountType: 'fixed',
    discountValue: 10000,
    minOrderAmount: 50000,
    badge: 'Giảm 10k',
    expiryDate: '2026-12-31',
    usageLimit: 500,
    usedCount: 145,
  },
  {
    code: 'GIAM_20W4F',
    name: 'Ăn ngon chuẩn vị - Giảm 20k',
    description: 'Giảm ngay 20.000 ₫ cho đơn hàng từ 90.000 ₫.',
    discountType: 'fixed',
    discountValue: 20000,
    minOrderAmount: 90000,
    badge: 'Giảm 20k',
    expiryDate: '2026-12-31',
    usageLimit: 300,
    usedCount: 112,
  },
  {
    code: 'GIAM_30Z8C',
    name: 'Ăn no thỏa thích - Giảm 30k',
    description: 'Giảm ngay 30.000 ₫ cho đơn hàng từ 140.000 ₫.',
    discountType: 'fixed',
    discountValue: 30000,
    minOrderAmount: 140000,
    badge: 'Giảm 30k',
    expiryDate: '2026-12-31',
    usageLimit: 200,
    usedCount: 83,
  },
  {
    code: 'GIAM_50M2B',
    name: 'Combo bạn bè - Giảm 50k',
    description: 'Giảm ngay 50.000 ₫ cho đơn hàng từ 220.000 ₫.',
    discountType: 'fixed',
    discountValue: 50000,
    minOrderAmount: 220000,
    badge: 'Giảm 50k',
    expiryDate: '2026-12-31',
    usageLimit: 120,
    usedCount: 49,
  },

  // 6. Mã độc quyền Bán Chạy (STT 11: 1 lần dùng)
  {
    code: 'BEST_HOT25',
    name: 'Độc quyền Bán Chạy - Giảm 25k (1 lần dùng)',
    description: 'Ưu đãi dành riêng cho đơn có món Best Seller từ 80.000 ₫. Mỗi khách dùng 1 lần.',
    discountType: 'fixed',
    discountValue: 25000,
    minOrderAmount: 80000,
    categoryExclusive: 'best_seller',
    isOneTimeUse: true,
    badge: 'Hot Deal 25k',
    expiryDate: '2026-12-31',
    usageLimit: 150,
    usedCount: 42,
  },
  {
    code: 'BEST_HOT35',
    name: 'Top Món Hot NooNee - Giảm 35k (1 lần dùng)',
    description: 'Ưu đãi độc quyền cho đơn có món Bán Chạy từ 130.000 ₫. Mỗi khách dùng 1 lần.',
    discountType: 'fixed',
    discountValue: 35000,
    minOrderAmount: 130000,
    categoryExclusive: 'best_seller',
    isOneTimeUse: true,
    badge: 'Best Seller 35k',
    expiryDate: '2026-12-31',
    usageLimit: 100,
    usedCount: 31,
  },

  // 7. Đặc quyền Hạng Thành Viên
  {
    code: 'SILVER10',
    name: 'Voucher Thành Viên Bạc - Giảm 10k',
    description: 'Đặc quyền từ Hạng Bạc trở lên: Giảm 10.000 ₫ cho đơn từ 80.000 ₫.',
    discountType: 'fixed',
    discountValue: 10000,
    minOrderAmount: 80000,
    badge: 'Từ Hạng Bạc',
    minTier: 'Silver',
    expiryDate: '2026-12-31',
    usageLimit: 9999,
    usedCount: 19,
  },
  {
    code: 'GOLD25',
    name: 'Voucher Thành Viên Vàng - Giảm 25k',
    description: 'Đặc quyền từ Hạng Vàng trở lên: Giảm 25.000 ₫ cho đơn từ 150.000 ₫.',
    discountType: 'fixed',
    discountValue: 25000,
    minOrderAmount: 150000,
    badge: 'Từ Hạng Vàng',
    minTier: 'Gold',
    expiryDate: '2026-12-31',
    usageLimit: 9999,
    usedCount: 8,
  },
  {
    code: 'GOLDVIP',
    name: 'Voucher VIP Vàng - Giảm 15%',
    description: 'Đặc quyền từ Hạng Vàng trở lên: Giảm 15% tối đa 45.000 ₫ cho đơn từ 200.000 ₫.',
    discountType: 'percentage',
    discountValue: 15,
    maxDiscountAmount: 45000,
    minOrderAmount: 200000,
    badge: 'Từ Hạng Vàng',
    minTier: 'Gold',
    expiryDate: '2026-12-31',
    usageLimit: 9999,
    usedCount: 6,
  },
  {
    code: 'DIAMOND50',
    name: 'Voucher VIP Kim Cương - Giảm 50k',
    description: 'Đặc quyền Hạng Kim Cương: Giảm 50.000 ₫ cho đơn từ 200.000 ₫.',
    discountType: 'fixed',
    discountValue: 50000,
    minOrderAmount: 200000,
    badge: 'VIP Kim Cương',
    minTier: 'Diamond',
    expiryDate: '2026-12-31',
    usageLimit: 9999,
    usedCount: 3,
  },
  {
    code: 'DIAMONDVIP',
    name: 'Voucher VIP Kim Cương - Giảm 20%',
    description: 'Đặc quyền Hạng Kim Cương: Giảm 20% tối đa 80.000 ₫ cho đơn từ 250.000 ₫.',
    discountType: 'percentage',
    discountValue: 20,
    maxDiscountAmount: 80000,
    minOrderAmount: 250000,
    badge: 'VIP Kim Cương',
    minTier: 'Diamond',
    expiryDate: '2026-12-31',
    usageLimit: 9999,
    usedCount: 2,
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

// Functions to query & manage coupons
export function getAllCoupons(): Coupon[] {
  return [...AVAILABLE_COUPONS, ...customCoupons];
}

export function findCouponByCode(code: string): Coupon | undefined {
  const clean = (code || '').trim().toUpperCase();
  return getAllCoupons().find((c) => c.code.toUpperCase() === clean);
}

export function addCustomCoupon(coupon: Coupon): Coupon {
  const existingIndex = customCoupons.findIndex(c => c.code.toUpperCase() === coupon.code.toUpperCase());
  if (existingIndex >= 0) {
    customCoupons[existingIndex] = coupon;
  } else {
    customCoupons.unshift(coupon);
  }
  return coupon;
}

export function deleteCustomCoupon(code: string): boolean {
  const initialLen = customCoupons.length;
  customCoupons = customCoupons.filter(c => c.code.toUpperCase() !== code.toUpperCase());
  return customCoupons.length < initialLen;
}

export function incrementCouponUsage(code: string): void {
  const coupon = findCouponByCode(code);
  if (coupon) {
    coupon.usedCount = (coupon.usedCount || 0) + 1;
  }
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
  cartItems?: { categoryId?: number; isFeatured?: boolean; name?: string; [key: string]: any }[]
): ValidateCouponResult {
  const code = (inputCode || '').trim().toUpperCase();
  if (!code) {
    return { valid: false, message: 'Vui lòng nhập mã giảm giá', discountAmount: 0 };
  }

  const coupon = findCouponByCode(code);
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
