import { NextRequest, NextResponse } from 'next/server';
import { getGroupOrderByCode } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
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

    const group = await getGroupOrderByCode(code);
    if (!group) {
      return NextResponse.json(
        { success: false, message: 'Không tìm thấy nhóm đặt đơn này' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: group,
    });
  } catch (error: any) {
    console.error('Error getting group order:', error);
    return NextResponse.json(
      { success: false, message: 'Đã xảy ra lỗi khi tải thông tin nhóm' },
      { status: 500 }
    );
  }
}
