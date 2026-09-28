import { NextRequest, NextResponse } from 'next/server';
import { getSupportMessages, createSupportMessage } from '@/lib/db';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';
import { authenticateRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderCode = searchParams.get('orderCode') || undefined;
    const userIdParam = searchParams.get('userId');
    const userId = userIdParam ? parseInt(userIdParam) : undefined;

    const messages = await getSupportMessages({ orderCode, userId });
    return NextResponse.json({ success: true, data: messages });
  } catch (error: any) {
    console.error('Error fetching support messages:', error);
    return NextResponse.json({ success: false, message: 'Đã xảy ra lỗi khi tải tin nhắn hỗ trợ' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rateCheck = checkRateLimit(`support:${ip}`, 20, 60000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { success: false, message: 'Bạn đang gửi tin nhắn quá nhanh. Vui lòng chờ giây lát.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { orderCode, userId, senderRole, senderName, message, isComplaint } = body;

    if (!senderName || !message || !String(message).trim()) {
      return NextResponse.json(
        { success: false, message: 'Vui lòng nhập nội dung tin nhắn hoặc khiếu nại' },
        { status: 400 }
      );
    }

    // Prevent role spoofing (H12)
    // Only verified admin users can post with senderRole === 'admin'
    const authUser = authenticateRequest(request);
    let resolvedRole: 'admin' | 'customer' = 'customer';
    if (senderRole === 'admin' && authUser && authUser.role === 'admin') {
      resolvedRole = 'admin';
    }

    // Require orderCode for customer support inquiries
    const cleanOrderCode = orderCode ? String(orderCode).trim().replace(/^#+/, '') : '';
    if (resolvedRole === 'customer' && !cleanOrderCode) {
      return NextResponse.json(
        { success: false, message: 'Vui lòng chọn hoặc nhập mã đơn hàng trước khi gửi yêu cầu hỗ trợ' },
        { status: 400 }
      );
    }

    const resolvedUserId = authUser ? authUser.userId : (userId ? parseInt(String(userId)) : null);

    const newMsg = await createSupportMessage({
      orderCode: orderCode ? String(orderCode).trim() : null,
      userId: resolvedUserId,
      senderRole: resolvedRole,
      senderName: String(senderName).trim(),
      message: String(message).trim(),
      isComplaint: Boolean(isComplaint),
    });

    return NextResponse.json({ success: true, data: newMsg }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating support message:', error);
    return NextResponse.json({ success: false, message: 'Đã xảy ra lỗi khi gửi tin nhắn hỗ trợ' }, { status: 500 });
  }
}
