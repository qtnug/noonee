import { NextRequest, NextResponse } from 'next/server';
import { parseOrderCodeFromMemo } from '@/lib/sepay';
import { updateOrderStatus, getOrderByCode } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    // 1. Strict verification of SePay API Key / Token (C9)
    const expectedToken = process.env.SEPAY_API_TOKEN;
    if (!expectedToken || expectedToken === 'demo_sepay_token' || expectedToken.trim() === '') {
      console.error('[Sepay Webhook] SEPAY_API_TOKEN is not configured securely');
      return NextResponse.json(
        { success: false, message: 'Cổng thanh toán chưa được cấu hình khóa bảo mật' },
        { status: 500 }
      );
    }

    const authHeader = (request.headers.get('authorization') || '').trim();
    // Sepay sends authorization as "Apikey <TOKEN>" or raw token
    const tokenFromHeader = authHeader.startsWith('Apikey ') ? authHeader.slice(7).trim() : authHeader;

    if (tokenFromHeader !== expectedToken.trim()) {
      console.warn('[Sepay Webhook] Unauthorized: Token mismatch');
      return NextResponse.json(
        { success: false, message: 'Sai mã xác thực SePay API Key (Unauthorized)' },
        { status: 401 }
      );
    }

    const payload = await request.json();
    console.log('[Sepay Webhook Received]:', {
      id: payload.id,
      gateway: payload.gateway,
      amount: payload.transferAmount || payload.amount,
      content: payload.content,
    });

    const content = String(payload.content || payload.description || payload.code || '');
    let orderCode = parseOrderCodeFromMemo(content);

    if (!orderCode) {
      return NextResponse.json({
        success: false,
        message: 'Không tìm thấy mã đơn hàng (NOONEE...) trong nội dung chuyển khoản',
      });
    }

    let order = await getOrderByCode(orderCode);
    // Fallback: if order not found, check underscore / non-underscore variations
    if (!order) {
      if (orderCode.includes('_')) {
        order = await getOrderByCode(orderCode.replace('_', ''));
        if (order) orderCode = order.orderCode;
      } else if (orderCode.startsWith('NOONEE')) {
        const withUnderscore = 'NOONEE_' + orderCode.slice(6);
        order = await getOrderByCode(withUnderscore);
        if (order) orderCode = order.orderCode;
      }
    }

    if (!order) {
      return NextResponse.json({
        success: false,
        message: `Không tìm thấy đơn hàng ${orderCode}`,
      });
    }

    // Check if order is already cancelled or already paid
    if (order.status === 'Cancelled') {
      return NextResponse.json({
        success: false,
        message: `Đơn hàng ${orderCode} đã bị hủy trước đó`,
      });
    }

    if (order.paymentStatus === 'Paid') {
      return NextResponse.json({
        success: true,
        message: `Đơn hàng ${orderCode} đã được thanh toán trước đó`,
        orderCode,
      });
    }

    // Verify transfer amount strictly (H3)
    const transferAmount = Number(payload.transferAmount || payload.amount || 0);
    if (transferAmount < order.totalAmount) {
      console.warn(`[Sepay] Underpaid: Received ${transferAmount}, expected ${order.totalAmount} for order ${orderCode}`);
      return NextResponse.json({
        success: false,
        message: `Số tiền chuyển khoản (${transferAmount}đ) không đủ so với tổng tiền đơn hàng (${order.totalAmount}đ)`,
      }, { status: 400 });
    }

    // Update order payment status to Paid
    await updateOrderStatus(orderCode, 'Pending', 'Paid');

    return NextResponse.json({
      success: true,
      message: `Đã xác nhận thanh toán thành công cho đơn hàng ${orderCode}`,
      orderCode,
    });
  } catch (error: any) {
    console.error('[Sepay Webhook Error]:', error);
    return NextResponse.json({ success: false, message: 'Đã xảy ra lỗi xử lý webhook' }, { status: 500 });
  }
}
