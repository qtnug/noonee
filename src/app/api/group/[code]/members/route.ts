import { NextRequest, NextResponse } from 'next/server';
import { removeGroupMember } from '@/lib/db';
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

    const body = await request.json();
    const { memberIdToRemove, requesterMemberId } = body;
    const authUser = authenticateRequest(request);
    if (!authUser) return NextResponse.json({ success: false, message: 'Vui lòng đăng nhập' }, { status: 401 });
    const { getGroupOrderByCode } = await import('@/lib/db');
    const group = await getGroupOrderByCode(code);
    const requester = group?.members.find(m => m.userId === authUser.userId);
    if (!requester || (requesterMemberId && requesterMemberId !== requester.id)) return NextResponse.json({ success: false, message: 'Không có quyền xóa thành viên' }, { status: 403 });

    if (!memberIdToRemove) {
      return NextResponse.json(
        { success: false, message: 'Thiếu thông tin thành viên cần xóa' },
        { status: 400 }
      );
    }

    const res = await removeGroupMember(code, memberIdToRemove, requester.id);
    if (!res.success) {
      return NextResponse.json(
        { success: false, message: res.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: res.group,
      message: 'Đã xóa thành viên khỏi nhóm thành công.',
    });
  } catch (error: any) {
    console.error('Error removing group member:', error);
    return NextResponse.json(
      { success: false, message: 'Đã xảy ra lỗi khi xóa thành viên' },
      { status: 500 }
    );
  }
}
