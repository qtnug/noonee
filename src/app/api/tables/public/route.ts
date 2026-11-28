import { NextRequest, NextResponse } from 'next/server';
import { getTableByParams } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const branchId = parseInt(searchParams.get('branch') || '1', 10) === 2 ? 2 : 1;
    const tableNumber = (searchParams.get('table') || '').trim();
    const token = (searchParams.get('token') || '').trim();

    if (!tableNumber || !token) {
      return NextResponse.json(
        { success: false, message: 'Mã QR không đầy đủ. Vui lòng quét trực tiếp mã QR đặt trên bàn.' },
        { status: 400 }
      );
    }

    const table = await getTableByParams(branchId, tableNumber, token);
    if (!table) {
      return NextResponse.json(
        { success: false, message: 'Bàn đang tạm khóa hoặc mã QR đã được thay mới. Vui lòng quét lại mã QR trên bàn.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: table });
  } catch (error) {
    console.error('GET /api/tables/public error:', error);
    return NextResponse.json({ success: false, message: 'Lỗi kiểm tra thông tin bàn' }, { status: 500 });
  }
}
