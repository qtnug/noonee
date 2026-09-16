import { NextRequest, NextResponse } from 'next/server';
import { hasUserPaidFirstVietqr } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authUser = authenticateRequest(request);
    const { searchParams } = new URL(request.url);
    const userIdStr = searchParams.get('userId');

    let userId: number | null = null;
    if (authUser) {
      userId = authUser.userId;
    } else if (userIdStr) {
      const parsed = parseInt(userIdStr);
      if (!isNaN(parsed)) userId = parsed;
    }

    if (!userId) {
      return NextResponse.json({
        success: true,
        hasPaidFirstVietqr: false,
        isNewUser: true,
      });
    }

    const hasPaidFirstVietqr = await hasUserPaidFirstVietqr(userId);

    return NextResponse.json({
      success: true,
      hasPaidFirstVietqr,
      isNewUser: !hasPaidFirstVietqr,
    });
  } catch (error: any) {
    console.error('Promo status error:', error);
    return NextResponse.json(
      { success: false, message: 'Đã xảy ra lỗi khi kiểm tra trạng thái khuyến mãi', hasPaidFirstVietqr: false, isNewUser: true },
      { status: 500 }
    );
  }
}
