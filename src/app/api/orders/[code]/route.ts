import { NextRequest, NextResponse } from 'next/server';
import { getOrderByCode, updateOrderStatus, cancelOrder } from '@/lib/db';
import { authenticateRequest, requireAdmin, AuthError } from '@/lib/auth';
import { OrderStatus } from '@/types';

export const dynamic = 'force-dynamic';

const VALID_STATUSES: OrderStatus[] = ['Pending', 'Processing', 'Delivering', 'Completed', 'Cancelled'];

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
    console.error('Error fetching order by code:', error);
    return NextResponse.json({ success: false, message: 'Đã xảy ra lỗi khi tìm kiếm đơn hàng' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const authUser = authenticateRequest(request);
    const body = await request.json();
    const { status, paymentStatus, cancelReason, action } = body;

    const existingOrder = await getOrderByCode(params.code);
    if (!existingOrder) {
      return NextResponse.json({ success: false, message: 'Không tìm thấy đơn hàng' }, { status: 404 });
    }

    // Cancellation request
    if (status === 'Cancelled' || action === 'cancel') {
      // If user is authenticated, check ownership (or admin)
      if (authUser) {
        if (authUser.role !== 'admin' && existingOrder.userId && existingOrder.userId !== authUser.userId) {
          return NextResponse.json({ success: false, message: 'Bạn không có quyền hủy đơn hàng này' }, { status: 403 });
        }
      }

      const result = await cancelOrder(params.code, cancelReason || 'Hủy theo yêu cầu');
      if (!result.success) {
        return NextResponse.json({ success: false, message: result.message }, { status: 400 });
      }
      return NextResponse.json({
        success: true,
        message: result.message,
        refundedAmount: result.refundedAmount,
      });
    }

    // Changing status (Processing, Delivering, Completed) requires Admin
    if (!authUser || authUser.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Chỉ Quản trị viên mới có quyền thay đổi trạng thái đơn hàng' },
        { status: 403 }
      );
    }

    // Validate status value (H16)
    if (status && !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { success: false, message: `Trạng thái "${status}" không hợp lệ` },
        { status: 400 }
      );
    }

    const success = await updateOrderStatus(params.code, status, paymentStatus, cancelReason);
    return NextResponse.json({ success, message: 'Cập nhật trạng thái đơn hàng thành công' });
  } catch (error: any) {
    console.error('Error updating order status:', error);
    return NextResponse.json({ success: false, message: 'Đã xảy ra lỗi khi cập nhật đơn hàng' }, { status: 500 });
  }
}
