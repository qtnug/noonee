import { NextRequest, NextResponse } from 'next/server';
import { validateCoupon } from '@/lib/coupons';
import { hasUserPaidFirstVietqr, getUserSpendingStats } from '@/lib/db';
import { getMembershipTier } from '@/lib/membership';
import { authenticateRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const authUser = authenticateRequest(request);
    const { code, subtotal, paymentMethod, userId } = await request.json();

    const targetUserId = authUser ? authUser.userId : (userId ? Number(userId) : null);

    let isNewUser = true;
    let userTier = null;

    if (targetUserId) {
      const [hasPaid, stats] = await Promise.all([
        hasUserPaidFirstVietqr(targetUserId),
        getUserSpendingStats(targetUserId),
      ]);
      isNewUser = !hasPaid;
      userTier = getMembershipTier(stats.totalSpent).tier;
    }

    const result = validateCoupon(
      code,
      Number(subtotal) || 0,
      paymentMethod || 'Sepay',
      isNewUser,
      userTier
    );

    if (!result.valid) {
      return NextResponse.json(
        {
          success: false,
          message: result.message || 'Mã giảm giá không hợp lệ',
          discountAmount: 0,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Áp dụng mã giảm giá thành công',
      discountAmount: result.discountAmount,
      coupon: result.coupon,
    });
  } catch (error: any) {
    console.error('Coupon validation error:', error);
    return NextResponse.json(
      { success: false, message: 'Đã xảy ra lỗi khi kiểm tra mã giảm giá' },
      { status: 500 }
    );
  }
}
