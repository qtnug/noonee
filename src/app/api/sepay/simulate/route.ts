import { NextRequest, NextResponse } from 'next/server';
import { updateOrderStatus, getOrderByCode } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    // Disable payment simulation in production environment (C10)
    const isSimulationAllowed = 
      process.env.NODE_ENV !== 'production' && 
      process.env.NEXT_PUBLIC_ENABLE_PAYMENT_SIMULATION === 'true';

    if (!isSimulationAllowed) {
      return NextResponse.json(
        { success: false, message: 'Chức năng giả lập thanh toán bị vô hiệu hóa trong môi trường thực tế' },
        { status: 403 }
      );
    }

    const { orderCode, amount } = await request.json();

    if (!orderCode) {
      return NextResponse.json({ success: false, message: 'Thiếu mã đơn hàng' }, { status: 400 });
    }

    const order = await getOrderByCode(orderCode);
    if (!order) {
      return NextResponse.json({ success: false, message: 'Đơn hàng không tồn tại' }, { status: 404 });
    }

    if (order.status === 'Cancelled') {
      return NextResponse.json({ success: false, message: 'Không thể thanh toán cho đơn hàng đã bị hủy' }, { status: 400 });
    }

    await updateOrderStatus(orderCode, 'Pending', 'Paid');

    return NextResponse.json({
      success: true,
      message: `Giả lập thanh toán thành công cho đơn hàng ${orderCode}`,
      orderCode,
      paidAmount: amount || order.totalAmount,
    });
  } catch (error: any) {
    console.error('Simulate payment error:', error);
    return NextResponse.json({ success: false, message: 'Đã xảy ra lỗi khi giả lập thanh toán' }, { status: 500 });
  }
}
