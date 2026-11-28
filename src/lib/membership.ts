export type MembershipTierName = 'Bronze' | 'Silver' | 'Gold' | 'Diamond';

interface TierVoucher {
  code: string;
  name: string;
  description: string;
  discountType: 'fixed' | 'percentage';
  discountValue: number;
  minOrderAmount: number;
  badge?: string;
}

export interface MembershipTierInfo {
  tier: MembershipTierName;
  name: string;
  badge: string;
  color: string;
  bgBadge: string;
  bgGradient: string;
  minSpent: number;
  nextTier: MembershipTierName | null;
  nextSpent: number;
  progress: number; // 0 - 100%
  amountNeeded: number;
  shippingDiscount: number; // in VND
  benefits: string[];
  vouchers: TierVoucher[];
}

const SILVER_VOUCHERS: TierVoucher[] = [
  {
    code: 'SILVER10',
    name: 'Voucher Hạng Bạc - Giảm 10k',
    description: 'Giảm ngay 10.000 ₫ cho đơn từ 80.000 ₫',
    discountType: 'fixed',
    discountValue: 10000,
    minOrderAmount: 80000,
    badge: 'Đặc quyền Bạc',
  },
];

const GOLD_VOUCHERS: TierVoucher[] = [
  {
    code: 'GOLD25',
    name: 'Voucher Hạng Vàng - Giảm 25k',
    description: 'Giảm 25.000 ₫ cho đơn từ 150.000 ₫',
    discountType: 'fixed',
    discountValue: 25000,
    minOrderAmount: 150000,
    badge: 'Đặc quyền Vàng',
  },
  {
    code: 'GOLDVIP',
    name: 'Voucher Hạng Vàng - Giảm 15%',
    description: 'Giảm 15% tổng tiền cho đơn từ 200.000 ₫',
    discountType: 'percentage',
    discountValue: 15,
    minOrderAmount: 200000,
    badge: 'VIP Vàng 15%',
  },
];

const DIAMOND_VOUCHERS: TierVoucher[] = [
  {
    code: 'DIAMOND50',
    name: 'Voucher VIP Kim Cương - Giảm 50k',
    description: 'Giảm ngay 50.000 ₫ cho đơn từ 200.000 ₫',
    discountType: 'fixed',
    discountValue: 50000,
    minOrderAmount: 200000,
    badge: 'Đặc quyền Kim Cương',
  },
  {
    code: 'DIAMONDVIP',
    name: 'Voucher VIP Kim Cương - Giảm 20%',
    description: 'Giảm 20% cho đơn từ 250.000 ₫',
    discountType: 'percentage',
    discountValue: 20,
    minOrderAmount: 250000,
    badge: 'VIP Kim Cương 20%',
  },
];

type TierSpec = Omit<MembershipTierInfo, 'progress' | 'amountNeeded'>;

const TIER_SPECS: TierSpec[] = [
  {
    tier: 'Bronze',
    name: 'Thành viên Đồng',
    badge: '🥉 Hạng Đồng',
    color: '#b45309',
    bgBadge: 'bg-amber-100 text-amber-800 border-amber-300',
    bgGradient: 'from-amber-500/10 via-orange-500/5 to-transparent border-amber-200',
    minSpent: 0,
    nextTier: 'Silver',
    nextSpent: 500000,
    shippingDiscount: 0,
    benefits: [
      'Tích lũy chi tiêu tự động sau mỗi đơn hoàn thành',
      'Chi tiêu thêm đạt 500.000 ₫ để thăng hạng Bạc và nhận mã giảm giá',
    ],
    vouchers: [
      {
        code: 'VIETQR20',
        name: 'Giảm 20% đơn đầu tiên',
        description: 'Ưu đãi dành cho thành viên mới khi quét mã VietQR',
        discountType: 'percentage',
        discountValue: 20,
        minOrderAmount: 0,
        badge: 'Khách mới 20%',
      },
    ],
  },
  {
    tier: 'Silver',
    name: 'Thành viên Bạc',
    badge: '🥈 Hạng Bạc',
    color: '#475569',
    bgBadge: 'bg-slate-100 text-slate-800 border-slate-300',
    bgGradient: 'from-slate-500/10 via-gray-500/5 to-transparent border-slate-300',
    minSpent: 500000,
    nextTier: 'Gold',
    nextSpent: 1500000,
    shippingDiscount: 5000,
    benefits: [
      'Giảm 5.000 ₫ phí vận chuyển cho mọi đơn hàng',
      'Tặng Voucher độc quyền Hạng Bạc (SILVER10: Giảm 10k)',
      'Ưu tiên xử lý đơn hàng trong giờ cao điểm',
    ],
    vouchers: [...SILVER_VOUCHERS],
  },
  {
    tier: 'Gold',
    name: 'Thành viên Vàng',
    badge: '🥇 Hạng Vàng',
    color: '#d97706',
    bgBadge: 'bg-amber-100 text-amber-900 border-amber-400',
    bgGradient: 'from-amber-400/20 via-yellow-500/10 to-transparent border-amber-300',
    minSpent: 1500000,
    nextTier: 'Diamond',
    nextSpent: 3500000,
    shippingDiscount: 10000,
    benefits: [
      'Giảm 10.000 ₫ phí vận chuyển cho mọi đơn hàng',
      'Hưởng toàn bộ voucher Hạng Bạc (SILVER10: Giảm 10k)',
      'Tặng Voucher độc quyền Hạng Vàng (GOLD25: Giảm 25k, GOLDVIP: Giảm 15%)',
      'Ưu tiên nhà bếp chế biến nhanh',
    ],
    vouchers: [...SILVER_VOUCHERS, ...GOLD_VOUCHERS],
  },
  {
    tier: 'Diamond',
    name: 'Thành viên Kim Cương (VIP)',
    badge: '💎 Hạng Kim Cương',
    color: '#0284c7',
    bgBadge: 'bg-sky-100 text-sky-900 border-sky-400',
    bgGradient: 'from-sky-500/20 via-blue-500/10 to-transparent border-sky-300',
    minSpent: 3500000,
    nextTier: null,
    nextSpent: 3500000,
    shippingDiscount: 25000,
    benefits: [
      'Giảm ngay 25.000 ₫ phí vận chuyển cho mỗi đơn hàng',
      'Hưởng trọn vẹn toàn bộ voucher các hạng trước (SILVER10, GOLD25, GOLDVIP)',
      'Tặng Voucher VIP độc quyền Kim Cương (DIAMOND50: Giảm 50k, DIAMONDVIP: Giảm 20%)',
      'Ưu tiên giao hàng siêu tốc và hỗ trợ CSKH VIP',
    ],
    vouchers: [...SILVER_VOUCHERS, ...GOLD_VOUCHERS, ...DIAMOND_VOUCHERS],
  },
];

export function getMembershipTier(totalSpent: number): MembershipTierInfo {
  const spent = Math.max(0, Number(totalSpent) || 0);
  const spec = TIER_SPECS.find((t) => t.nextTier === null || spent < t.nextSpent) || TIER_SPECS[TIER_SPECS.length - 1];
  const progress =
    spec.nextTier === null
      ? 100
      : Math.min(100, Math.max(0, Math.round(((spent - spec.minSpent) / (spec.nextSpent - spec.minSpent)) * 100)));

  return {
    ...spec,
    progress,
    amountNeeded: spec.nextTier === null ? 0 : spec.nextSpent - spent,
  };
}
