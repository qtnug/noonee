import { NextRequest, NextResponse } from 'next/server';
import { verifyUserCredentials } from '@/lib/db';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rateCheck = checkRateLimit(`login:${ip}`, 10, 60000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          message: 'Bạn đã đăng nhập sai quá nhiều lần. Vui lòng chờ 1 phút trước khi thử lại.',
        },
        { status: 429 }
      );
    }

    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: 'Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu' },
        { status: 400 }
      );
    }

    const safeUsername = String(username).trim();
    const user = await verifyUserCredentials(safeUsername, String(password));

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Tên đăng nhập hoặc mật khẩu không chính xác' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Đăng nhập thành công',
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
