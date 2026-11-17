import { NextRequest, NextResponse } from 'next/server';
import { lockGroupOrder, unlockGroupOrder } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth';

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

    const authUser = authenticateRequest(request);
    if (!authUser) return NextResponse.json({ success: false, message: 'Vui lòng đăng nhập' }, { status: 401 });
    const { getGroupOrderByCode } = await import('@/lib/db');
    const group = await getGroupOrderByCode(code);
    if (!group || group.hostUserId !== authUser.userId) return NextResponse.json({ success: false, message: 'Chỉ trưởng nhóm có quyền này' }, { status: 403 });
    const body = await request.json();
    const action = body.action || 'lock';
    const requesterMemberId = group.members.find(m => m.userId === authUser.userId && m.isHost)?.id;

    if (action === 'unlock') {
      const res = await unlockGroupOrder(code, requesterMemberId, authUser?.userId);
      if (!res.success) {
        return NextResponse.json(
          { success: false, message: res.message },
          { status: 403 }
        );
      }
      return NextResponse.json({
        success: true,
        data: res.group,
        message: 'Đã mở khóa nhóm, mọi người có thể tiếp tục chọn món.',
      });
    }

    const res = await lockGroupOrder(code, requesterMemberId, authUser?.userId);
    if (!res.success) {
      return NextResponse.json(
        { success: false, message: res.message },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: res.group,
      message: 'Đã chốt đơn nhóm thành công! Trưởng nhóm có thể tiến hành thanh toán.',
    });
  } catch (error: any) {
    console.error('Error locking group order:', error);
    return NextResponse.json(
      { success: false, message: 'Đã xảy ra lỗi khi chốt đơn nhóm' },
      { status: 500 }
    );
  }
}
