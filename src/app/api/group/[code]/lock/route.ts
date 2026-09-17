import { NextRequest, NextResponse } from 'next/server';
import { lockGroupOrder, unlockGroupOrder } from '@/lib/db';

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
    const action = body.action || 'lock';

    if (action === 'unlock') {
      const res = await unlockGroupOrder(code);
      if (!res.success) {
        return NextResponse.json(
          { success: false, message: res.message },
          { status: 400 }
        );
      }
      return NextResponse.json({
        success: true,
        data: res.group,
        message: 'Đã mở khóa nhóm, mọi người có thể tiếp tục chọn món.',
      });
    }

    const res = await lockGroupOrder(code);
    if (!res.success) {
      return NextResponse.json(
        { success: false, message: res.message },
        { status: 400 }
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
