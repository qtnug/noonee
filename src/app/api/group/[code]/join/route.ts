import { NextRequest, NextResponse } from 'next/server';
import { joinGroupOrder } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    if (!code) {
      return NextResponse.json(
        { success: false, message: 'Mã nhóm không hợp lệ' },
        { status: 400 }
      );
    }

    const ip = getClientIp(request);
    const rateCheck = checkRateLimit(`group-join:${ip}`, 30, 60000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { success: false, message: 'Thao tác quá nhanh, vui lòng thử lại sau.' },
        { status: 429 }
      );
    }

    const authUser = authenticateRequest(request);
    const body = await request.json();
    const name = (body.name || authUser?.username || '').trim();
    const memberId = body.memberId || undefined;
    const userId = authUser?.userId || null;

    if (!name) {
      return NextResponse.json(
        { success: false, message: 'Vui lòng nhập tên của bạn để tham gia nhóm' },
        { status: 400 }
      );
    }

    const result = await joinGroupOrder(code, name, userId, memberId);
    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.group,
      member: result.member,
      message: 'Tham gia nhóm thành công!',
    });
  } catch (error: any) {
    console.error('Error joining group order:', error);
    return NextResponse.json(
      { success: false, message: 'Đã xảy ra lỗi khi tham gia nhóm' },
      { status: 500 }
    );
  }
}
