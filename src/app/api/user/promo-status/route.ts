import { NextRequest, NextResponse } from 'next/server';
import { hasUserPaidFirstVietqr } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authUser = authenticateRequest(request);
    const userId = authUser?.userId ?? null;

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
