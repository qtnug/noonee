import { NextRequest, NextResponse } from 'next/server';
import { updateUserPassword } from '@/lib/db';
import { requireAuth, AuthError } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    let authUser;
    try {
      authUser = requireAuth(request);
    } catch (authErr) {
      if (authErr instanceof AuthError) {
        return NextResponse.json({ success: false, message: authErr.message }, { status: authErr.status });
      }
      throw authErr;
    }

    const body = await request.json();
    const { userId, currentPassword, newPassword, confirmPassword } = body;

    const targetUserId = userId ? parseInt(userId) : authUser.userId;

    if (authUser.role !== 'admin' && authUser.userId !== targetUserId) {
      return NextResponse.json(
        { success: false, message: 'Bạn không có quyền đổi mật khẩu của tài khoản khác' },
        { status: 403 }
      );
    }

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, message: 'Vui lòng nhập đầy đủ mật khẩu hiện tại và mật khẩu mới' },
        { status: 400 }
      );
    }

    // Aligned password strength validation (H6): min 8 chars, 1 upper, 1 lower, 1 number, 1 special
    const cleanPassword = String(newPassword);
    if (cleanPassword.length < 8) {
      return NextResponse.json(
        { success: false, message: 'Mật khẩu mới phải có độ dài tối thiểu 8 ký tự' },
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
          message: 'Mật khẩu mới phải chứa ít nhất 1 chữ hoa, 1 chữ thường, 1 chữ số và 1 ký tự đặc biệt',
        },
        { status: 400 }
      );
    }

    if (confirmPassword && newPassword !== confirmPassword) {
      return NextResponse.json(
        { success: false, message: 'Mật khẩu xác nhận không khớp với mật khẩu mới' },
        { status: 400 }
      );
    }

    const res = await updateUserPassword(targetUserId, currentPassword, newPassword);

    if (!res.success) {
      return NextResponse.json(
        { success: false, message: res.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Đổi mật khẩu thành công! Vui lòng ghi nhớ mật khẩu mới.',
    });
  } catch (error: any) {
    console.error('Change password error:', error);
    return NextResponse.json(
      { success: false, message: 'Đã xảy ra lỗi khi đổi mật khẩu' },
      { status: 500 }
    );
  }
}
