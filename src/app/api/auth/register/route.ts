import { NextRequest, NextResponse } from 'next/server';
import { getUserByUsername, createUser } from '@/lib/db';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';
import { generateToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rateCheck = checkRateLimit(`register:${ip}`, 5, 60000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          message: 'Bạn đang thao tác quá nhanh. Vui lòng chờ 1 phút trước khi đăng ký tài khoản mới.',
        },
        { status: 429 }
      );
    }

    const { username, password, confirmPassword, fullName, phone, address, email, hp_bot_trap } = await request.json();

    // Anti-bot honeypot check (STT 1)
    if (hp_bot_trap) {
      return NextResponse.json(
        { success: false, message: 'Yêu cầu bị từ chối do phát hiện bot tự động.' },
        { status: 400 }
      );
    }

    // 1. Validate required fields
    if (!username || !password || !fullName) {
      return NextResponse.json(
        { success: false, message: 'Vui lòng điền đầy đủ Họ tên, Tên đăng nhập và Mật khẩu' },
        { status: 400 }
      );
    }

    // 2. Validate Full Name
    const cleanFullName = String(fullName).trim();
    if (cleanFullName.length < 2 || cleanFullName.length > 70) {
      return NextResponse.json(
        { success: false, message: 'Họ và tên phải có từ 2 đến 70 ký tự' },
        { status: 400 }
      );
    }

    // 3. Validate Username format: only alphanumeric and underscore, 4-20 chars
    const cleanUsername = String(username).trim();
    const usernameRegex = /^[a-zA-Z0-9_]{4,20}$/;
    if (!usernameRegex.test(cleanUsername)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Tên đăng nhập phải dài từ 4-20 ký tự, chỉ gồm chữ cái, số và dấu gạch dưới (_), không có dấu cách.',
        },
        { status: 400 }
      );
    }

    // 4. Validate Password Confirmation
    if (confirmPassword && password !== confirmPassword) {
      return NextResponse.json(
        { success: false, message: 'Mật khẩu xác nhận không khớp với mật khẩu đã nhập' },
        { status: 400 }
      );
    }

    // 5. Validate Password Strength: Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
    const cleanPassword = String(password);
    if (cleanPassword.length < 8) {
      return NextResponse.json(
        { success: false, message: 'Mật khẩu phải có độ dài tối thiểu 8 ký tự' },
        { status: 400 }
      );
    }
    const hasUpperCase = /[A-Z]/.test(cleanPassword);
    const hasLowerCase = /[a-z]/.test(cleanPassword);
    const hasNumbers = /\d/.test(cleanPassword);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(cleanPassword);

    if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecial) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường, 1 chữ số và 1 ký tự đặc biệt (ví dụ: !@#$%^&*)',
        },
        { status: 400 }
      );
    }

    // 6. Validate Phone format if provided
    let cleanPhone = phone ? String(phone).trim() : '';
    if (cleanPhone) {
      const phoneRegex = /^(0)(3|5|7|8|9)[0-9]{8}$/;
      if (!phoneRegex.test(cleanPhone)) {
        return NextResponse.json(
          { success: false, message: 'Số điện thoại không đúng định dạng di động Việt Nam (10 chữ số, bắt đầu bằng 03, 05, 07, 08, 09)' },
          { status: 400 }
        );
      }
    }

    // 7. Validate Email format if provided
    let cleanEmail = email ? String(email).trim() : undefined;
    if (cleanEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanEmail)) {
        return NextResponse.json(
          { success: false, message: 'Địa chỉ email không đúng định dạng hợp lệ' },
          { status: 400 }
        );
      }
    }

    // 8. Check if username already exists in SQL Server
    const existingUser = await getUserByUsername(cleanUsername);
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: `Tên đăng nhập "${cleanUsername}" đã có người sử dụng. Vui lòng chọn tên khác.` },
        { status: 409 }
      );
    }

    // 9. Create user in SQL Server
    const newUser = await createUser({
      username: cleanUsername,
      password: cleanPassword,
      fullName: cleanFullName,
      phone: cleanPhone,
      address: address ? String(address).trim() : '',
      email: cleanEmail,
      role: 'customer',
    });

    const token = generateToken(newUser);

    const response = NextResponse.json(
      {
        success: true,
        message: 'Đăng ký tài khoản thành công',
        token,
        user: {
          id: newUser.id,
          username: newUser.username,
          fullName: newUser.fullName,
          email: newUser.email,
          phone: newUser.phone,
          address: newUser.address,
          role: newUser.role,
          walletBalance: 0,
          token,
        },
      },
      { status: 201 }
    );

    // Set auth_token cookie
    response.cookies.set('auth_token', token, {
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
      sameSite: 'lax',
    });

    return response;
  } catch (error: any) {
    console.error('Register error:', error);
    return NextResponse.json({ success: false, message: 'Đã xảy ra lỗi hệ thống trong quá trình đăng ký' }, { status: 500 });
  }
}
