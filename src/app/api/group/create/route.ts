import { NextRequest, NextResponse } from 'next/server';
import { createGroupOrder } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rateCheck = checkRateLimit(`group-create:${ip}`, 10, 60000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { success: false, message: 'Bạn đang tạo phòng nhóm quá nhanh. Vui lòng thử lại sau.' },
        { status: 429 }
      );
    }

    const authUser = authenticateRequest(request);
    if (!authUser) return NextResponse.json({ success: false, message: 'Vui lòng đăng nhập để tạo nhóm' }, { status: 401 });
    let hostName = authUser?.username || '';
    let hostUserId = authUser.userId;

    try {
      const body = await request.json();
      if (body.hostName && body.hostName.trim()) {
        hostName = body.hostName.trim();
      }
    } catch {
      // Body might be empty, use authUser or default
    }

    if (!hostName) {
      hostName = 'Trưởng nhóm';
    }

    const group = await createGroupOrder({ hostName, hostUserId });
    const hostMember = group.members[0];

    return NextResponse.json({
      success: true,
      data: group,
      memberId: hostMember?.id,
      message: 'Tạo nhóm đặt món thành công!',
    });
  } catch (error: any) {
    console.error('Error creating group order:', error);
    return NextResponse.json(
      { success: false, message: 'Đã xảy ra lỗi khi tạo nhóm đặt đơn' },
      { status: 500 }
    );
  }
}
