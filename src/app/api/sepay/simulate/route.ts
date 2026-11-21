import { NextRequest, NextResponse } from 'next/server';
import { updateOrderStatus, getOrderByCode } from '@/lib/db';
import { isPaymentSimulationEnabled } from '@/lib/sepay';

export async function POST(request: NextRequest) {
  try {
    // Allow payment simulation only in non-production when NEXT_PUBLIC_ENABLE_PAYMENT_SIMULATION=true
    if (!isPaymentSimulationEnabled()) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Chức năng giả lập thanh toán đang tắt (cần chạy môi trường local dev với NEXT_PUBLIC_ENABLE_PAYMENT_SIMULATION=true)',
        },
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

    const updated = await updateOrderStatus(orderCode, 'Pending', 'Paid');
    if (!updated) return NextResponse.json({ success: false, message: 'Không cập nhật được thanh toán' }, { status: 500 });

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
