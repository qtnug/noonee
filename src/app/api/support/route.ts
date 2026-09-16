import { NextRequest, NextResponse } from 'next/server';
import { getSupportMessages, createSupportMessage } from '@/lib/db';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

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
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
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

    const newMsg = await createSupportMessage({
      orderCode: orderCode ? String(orderCode).trim() : null,
      userId: userId ? parseInt(String(userId)) : null,
      senderRole: senderRole === 'admin' ? 'admin' : 'customer',
      senderName: String(senderName).trim(),
      message: String(message).trim(),
      isComplaint: Boolean(isComplaint),
    });

    return NextResponse.json({ success: true, data: newMsg }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating support message:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
