import { NextRequest, NextResponse } from 'next/server';
import { getSupportMessages, createSupportMessage, getOrderByCode } from '@/lib/db';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';
import { authenticateRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authUser = authenticateRequest(request);
    if (!authUser) return NextResponse.json({ success: false, message: 'Vui lòng đăng nhập' }, { status: 401 });
    const { searchParams } = new URL(request.url);
    const orderCode = searchParams.get('orderCode') || undefined;
    const userIdParam = searchParams.get('userId');
    const userId = authUser.role === 'admin' ? (userIdParam ? parseInt(userIdParam) : undefined) : authUser.userId;
    if (authUser.role !== 'admin' && orderCode) {
      const order = await getOrderByCode(orderCode);
      if (!order || order.userId !== authUser.userId) return NextResponse.json({ success: false, message: 'Không có quyền xem hội thoại này' }, { status: 403 });
    }

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
    if (!authUser) return NextResponse.json({ success: false, message: 'Vui lòng đăng nhập' }, { status: 401 });
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
    if (resolvedRole === 'customer') {
      const order = await getOrderByCode(cleanOrderCode);
      if (!order || order.userId !== authUser.userId) return NextResponse.json({ success: false, message: 'Không có quyền gửi tin nhắn cho đơn này' }, { status: 403 });
    }

    let resolvedUserId = authUser.userId;
    if (resolvedRole === 'admin' && cleanOrderCode) {
      const order = await getOrderByCode(cleanOrderCode);
      if (!order) return NextResponse.json({ success: false, message: 'Không tìm thấy đơn hàng' }, { status: 404 });
      resolvedUserId = order.userId || authUser.userId;
    }

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
