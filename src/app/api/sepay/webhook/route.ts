import { NextRequest, NextResponse } from 'next/server';
import { parseOrderCodeFromMemo } from '@/lib/sepay';
import { updateOrderStatus, getOrderByCode } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    console.log('[Sepay Webhook Received]:', payload);

    // Payload fields from Sepay: { id, gateway, transactionDate, accountNumber, content, transferAmount, ... }
    const content = payload.content || payload.description || '';
    const orderCode = parseOrderCodeFromMemo(content);

    if (!orderCode) {
      return NextResponse.json({
        success: false,
        message: 'Không tìm thấy mã đơn hàng (DH...) trong nội dung chuyển khoản',
      });
    }

    const order = await getOrderByCode(orderCode);
    if (!order) {
      return NextResponse.json({
        success: false,
        message: `Không tìm thấy đơn hàng ${orderCode}`,
      });
    }

    // Verify transfer amount if provided
    const transferAmount = payload.transferAmount || payload.amount;
    if (transferAmount && Number(transferAmount) < order.totalAmount) {
      console.warn(`[Sepay] Amount paid (${transferAmount}) is less than order total (${order.totalAmount})`);
    }

    // Update order status to Processing & Paid
    await updateOrderStatus(orderCode, 'Processing', 'Paid');

    return NextResponse.json({
      success: true,
      message: `Đã xác nhận thanh toán thành công cho đơn hàng ${orderCode}`,
      orderCode,
    });
  } catch (error: any) {
    console.error('[Sepay Webhook Error]:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
