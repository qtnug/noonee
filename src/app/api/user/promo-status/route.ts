import { NextRequest, NextResponse } from 'next/server';
import { hasUserPaidFirstVietqr } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userIdStr = searchParams.get('userId');

    if (!userIdStr) {
      return NextResponse.json({
        success: true,
        hasPaidFirstVietqr: false,
        isNewUser: true,
      });
    }

    const userId = parseInt(userIdStr);
    if (isNaN(userId)) {
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
    return NextResponse.json(
      { success: false, error: error.message, hasPaidFirstVietqr: false, isNewUser: true },
      { status: 500 }
    );
  }
}
