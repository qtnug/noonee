import { NextRequest, NextResponse } from 'next/server';
import { validateCoupon } from '@/lib/coupons';
import { hasUserPaidFirstVietqr } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { code, subtotal, paymentMethod, userId } = await request.json();

    let isNewUser = true;
    if (userId) {
      const hasPaid = await hasUserPaidFirstVietqr(Number(userId));
      isNewUser = !hasPaid;
    }

    const result = validateCoupon(
      code,
      Number(subtotal) || 0,
      paymentMethod || 'Sepay',
      isNewUser
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
    return NextResponse.json(
      { success: false, message: error.message || 'Lỗi kiểm tra mã giảm giá' },
      { status: 500 }
    );
  }
}
