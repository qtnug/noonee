export type MembershipTierName = 'Bronze' | 'Silver' | 'Gold' | 'Diamond';

export interface TierVoucher {
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

export function getMembershipTier(totalSpent: number): MembershipTierInfo {
  const spent = Math.max(0, Number(totalSpent) || 0);

  // 1. Bronze: 0 - 499,999đ
  if (spent < 500000) {
    const nextSpent = 500000;
    const progress = Math.min(100, Math.round((spent / nextSpent) * 100));
    return {
      tier: 'Bronze',
      name: 'Thành viên Đồng',
      badge: '🥉 Hạng Đồng',
      color: '#b45309',
      bgBadge: 'bg-amber-100 text-amber-800 border-amber-300',
      bgGradient: 'from-amber-500/10 via-orange-500/5 to-transparent border-amber-200',
      minSpent: 0,
      nextTier: 'Silver',
      nextSpent,
      progress,
      amountNeeded: nextSpent - spent,
      shippingDiscount: 0,
      benefits: [
        'Tích lũy chi tiêu tự động sau mỗi đơn hoàn thành',
        'Chi tiêu thêm đạt 500.000 ₫ để thăng hạng Bạc và giảm ship',
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
    };
  }

  // 2. Silver: 500,000 - 1,499,999đ
  if (spent < 1500000) {
    const nextSpent = 1500000;
    const currentBase = 500000;
    const progress = Math.min(
      100,
      Math.max(0, Math.round(((spent - currentBase) / (nextSpent - currentBase)) * 100))
    );
    return {
      tier: 'Silver',
      name: 'Thành viên Bạc',
      badge: '🥈 Hạng Bạc',
      color: '#475569',
      bgBadge: 'bg-slate-100 text-slate-800 border-slate-300',
      bgGradient: 'from-slate-500/10 via-gray-500/5 to-transparent border-slate-300',
      minSpent: 500000,
      nextTier: 'Gold',
      nextSpent,
      progress,
      amountNeeded: nextSpent - spent,
      shippingDiscount: 5000, // Giảm 5.000đ ship
      benefits: [
        'Giảm 5.000 ₫ phí vận chuyển cho mọi đơn hàng',
        'Tặng Voucher độc quyền SILVER10 giảm 10.000 ₫',
        'Ưu tiên xử lý đơn hàng trong giờ cao điểm',
      ],
      vouchers: [
        {
          code: 'SILVER10',
          name: 'Voucher Hạng Bạc - Giảm 10k',
          description: 'Giảm ngay 10.000 ₫ cho đơn từ 80.000 ₫',
          discountType: 'fixed',
          discountValue: 10000,
          minOrderAmount: 80000,
          badge: 'Đặc quyền Bạc',
        },
      ],
    };
  }

  // 3. Gold: 1,500,000 - 3,499,999đ
  if (spent < 3500000) {
    const nextSpent = 3500000;
    const currentBase = 1500000;
    const progress = Math.min(
      100,
      Math.max(0, Math.round(((spent - currentBase) / (nextSpent - currentBase)) * 100))
    );
    return {
      tier: 'Gold',
      name: 'Thành viên Vàng',
      badge: '🥇 Hạng Vàng',
      color: '#d97706',
      bgBadge: 'bg-amber-100 text-amber-900 border-amber-400',
      bgGradient: 'from-amber-400/20 via-yellow-500/10 to-transparent border-amber-300',
      minSpent: 1500000,
      nextTier: 'Diamond',
      nextSpent,
      progress,
      amountNeeded: nextSpent - spent,
      shippingDiscount: 10000, // Giảm 10.000đ ship
      benefits: [
        'Giảm 10.000 ₫ phí vận chuyển cho mọi đơn hàng',
        'Tặng Voucher độc quyền GOLD25 giảm 25.000 ₫ đơn từ 150k',
        'Tặng Voucher GOLDVIP giảm 15% (tối đa 40k) đơn từ 200k',
        'Ưu tiên nhà bếp chế biến nhanh',
      ],
      vouchers: [
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
      ],
    };
  }

  // 4. Diamond: 3,500,000đ+
  return {
    tier: 'Diamond',
    name: 'Thành viên Kim Cương (VIP)',
    badge: '💎 Hạng Kim Cương',
    color: '#0284c7',
    bgBadge: 'bg-sky-100 text-sky-900 border-sky-400',
    bgGradient: 'from-sky-500/20 via-blue-500/10 to-transparent border-sky-300',
    minSpent: 3500000,
    nextTier: null,
    nextSpent: 3500000,
    progress: 100,
    amountNeeded: 0,
    shippingDiscount: 25000, // Giảm 25.000đ phí vận chuyển
    benefits: [
      'Giảm ngay 25.000 ₫ phí vận chuyển cho mỗi đơn hàng',
      'Tặng Voucher độc quyền DIAMOND50 giảm 50.000 ₫ đơn từ 200k',
      'Tặng Voucher DIAMONDVIP giảm 20% đơn từ 250k',
      'Ưu tiên giao hàng siêu tốc và hỗ trợ CSKH VIP',
    ],
    vouchers: [
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
    ],
  };
}
