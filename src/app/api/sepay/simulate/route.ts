import { NextRequest, NextResponse } from 'next/server';
import { updateOrderStatus, getOrderByCode } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { orderCode, amount } = await request.json();

    if (!orderCode) {
      return NextResponse.json({ success: false, message: 'Thiếu mã đơn hàng' }, { status: 400 });
    }

    const order = await getOrderByCode(orderCode);
    if (!order) {
      return NextResponse.json({ success: false, message: 'Đơn hàng không tồn tại' }, { status: 404 });
    }

    // Keep order in Pending (Wait for Admin to confirm to Processing)
    await updateOrderStatus(orderCode, 'Pending', 'Paid');

    return NextResponse.json({
      success: true,
      message: `Giả lập thanh toán thành công cho đơn hàng ${orderCode}`,
      orderCode,
      paidAmount: amount || order.totalAmount,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
