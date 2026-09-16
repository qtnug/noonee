import { NextRequest, NextResponse } from 'next/server';
import { getOrderByCode, updateOrderStatus, cancelOrder } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const order = await getOrderByCode(params.code);
    if (!order) {
      return NextResponse.json({ success: false, message: 'Không tìm thấy đơn hàng' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: order });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const body = await request.json();
    const { status, paymentStatus, cancelReason, action } = body;

    if (status === 'Cancelled' || action === 'cancel') {
      const result = await cancelOrder(params.code, cancelReason || 'Hủy theo yêu cầu');
      if (!result.success) {
        return NextResponse.json({ success: false, message: result.message }, { status: 400 });
      }
      return NextResponse.json({ 
        success: true, 
        message: result.message, 
        refundedAmount: result.refundedAmount 
      });
    }

    const success = await updateOrderStatus(params.code, status, paymentStatus, cancelReason);
    return NextResponse.json({ success });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
