import { NextRequest, NextResponse } from 'next/server';
import { getOrderByCode, updateOrderStatus, cancelOrder, logAdminAction } from '@/lib/db';
import { resolveLiveUser, isPortalRole, AuthError } from '@/lib/auth';
import { maskPhoneNumber } from '@/lib/utils';
import { OrderStatus } from '@/types';

export const dynamic = 'force-dynamic';

const VALID_STATUSES: OrderStatus[] = ['Pending', 'Processing', 'Delivering', 'Completed', 'Cancelled'];

export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    let liveUser;
    try {
      liveUser = await resolveLiveUser(request);
    } catch (authErr) {
      if (authErr instanceof AuthError) {
        return NextResponse.json({ success: false, message: authErr.message }, { status: authErr.status });
      }
      throw authErr;
    }

    const order = await getOrderByCode(params.code);
    if (!order) {
      return NextResponse.json({ success: false, message: 'Không tìm thấy đơn hàng' }, { status: 404 });
    }

    const orderBranch = order.branchId || 1;
    const isOwnOrder = order.userId === liveUser.id;

    if (liveUser.role === 'admin') {
      return NextResponse.json({ success: true, data: order });
    }

    if (liveUser.role === 'manager' || liveUser.role === 'staff') {
      const assignedBranch = liveUser.branchId || 1;
      if (!isOwnOrder && orderBranch !== assignedBranch) {
        return NextResponse.json(
          { success: false, message: 'Đơn hàng này thuộc cơ sở khác, bạn không có quyền xem' },
          { status: 403 }
        );
      }
      if (liveUser.role === 'staff' && !isOwnOrder) {
        return NextResponse.json({
          success: true,
          data: {
            ...order,
            customerPhone: maskPhoneNumber(order.customerPhone),
          },
        });
      }
      return NextResponse.json({ success: true, data: order });
    }

    if (!isOwnOrder) {
      return NextResponse.json({ success: false, message: 'Không có quyền xem đơn hàng' }, { status: 403 });
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
    let liveUser;
    try {
      liveUser = await resolveLiveUser(request);
    } catch (authErr) {
      if (authErr instanceof AuthError) {
        return NextResponse.json({ success: false, message: authErr.message }, { status: authErr.status });
      }
      throw authErr;
    }

    const body = await request.json();
    const { status, paymentStatus, cancelReason, action } = body;

    const existingOrder = await getOrderByCode(params.code);
    if (!existingOrder) {
      return NextResponse.json({ success: false, message: 'Không tìm thấy đơn hàng' }, { status: 404 });
    }

    const orderBranch = existingOrder.branchId || 1;
    const hasBranchAccess =
      liveUser.role === 'admin' ||
      ((liveUser.role === 'manager' || liveUser.role === 'staff') && orderBranch === (liveUser.branchId || 1));

    // Lock completed orders strictly before any action (cancel or status/payment edit)
    if (existingOrder.status === 'Completed') {
      return NextResponse.json(
        { success: false, message: 'Đơn hàng đã hoàn thành, không thể chỉnh sửa trạng thái' },
        { status: 400 }
      );
    }

    // Cancellation request
    if (status === 'Cancelled' || action === 'cancel') {
      if (!hasBranchAccess && existingOrder.userId !== liveUser.id) {
        return NextResponse.json({ success: false, message: 'Bạn không có quyền hủy đơn hàng này' }, { status: 403 });
      }

      const reason = cancelReason || 'Hủy theo yêu cầu';
      const result = await cancelOrder(params.code, reason, hasBranchAccess);
      if (!result.success) {
        return NextResponse.json({ success: false, message: result.message }, { status: 400 });
      }
      if (isPortalRole(liveUser.role) && hasBranchAccess) {
        await logAdminAction({
          adminId: liveUser.id,
          adminName: liveUser.fullName || liveUser.username,
          adminRole: liveUser.role,
          branchId: orderBranch,
          action: 'CANCEL_ORDER',
          targetType: 'Order',
          targetId: params.code,
          details: `Hủy đơn #${params.code} (Lý do: ${reason})`,
        });
      }
      return NextResponse.json({
        success: true,
        message: result.message,
        refundedAmount: result.refundedAmount,
      });
    }

    // Changing status (Processing, Delivering, Completed) requires Admin, Manager, or Staff of that branch
    if (!isPortalRole(liveUser.role) || !hasBranchAccess) {
      return NextResponse.json(
        { success: false, message: 'Bạn không có quyền duyệt hoặc cập nhật đơn hàng của cơ sở này' },
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
    if (success) {
      await logAdminAction({
        adminId: liveUser.id,
        adminName: liveUser.fullName || liveUser.username,
        adminRole: liveUser.role,
        branchId: orderBranch,
        action: 'UPDATE_ORDER_STATUS',
        targetType: 'Order',
        targetId: params.code,
        details: `Đổi trạng thái: ${existingOrder.status} -> ${status}${paymentStatus ? ` (Thanh toán: ${paymentStatus})` : ''}`,
      });
    }
    return NextResponse.json({ success, message: 'Cập nhật trạng thái đơn hàng thành công' });
  } catch (error: any) {
    console.error('Error updating order status:', error);
    return NextResponse.json({ success: false, message: 'Đã xảy ra lỗi khi cập nhật đơn hàng' }, { status: 500 });
  }
}
