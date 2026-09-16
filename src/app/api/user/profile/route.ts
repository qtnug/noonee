import { NextRequest, NextResponse } from 'next/server';
import { getUserById, getUserSpendingStats, updateUserProfile } from '@/lib/db';
import { getMembershipTier } from '@/lib/membership';
import { requireAuth, AuthError } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const userIdParam = searchParams.get('userId');

    // Default to the authenticated user's own id if not specified
    const targetUserId = userIdParam ? parseInt(userIdParam) : authUser.userId;

    // Check ownership: customer can only view their own profile
    if (authUser.role !== 'admin' && authUser.userId !== targetUserId) {
      return NextResponse.json(
        { success: false, message: 'Bạn không có quyền truy cập thông tin tài khoản này' },
        { status: 403 }
      );
    }

    const [user, stats] = await Promise.all([
      getUserById(targetUserId),
      getUserSpendingStats(targetUserId),
    ]);

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Người dùng không tồn tại' },
        { status: 404 }
      );
    }

    const { password, ...safeUser } = user as any;
    const tier = getMembershipTier(stats.totalSpent);

    return NextResponse.json({
      success: true,
      data: {
        user: safeUser,
        stats,
        tier,
      },
    });
  } catch (error: any) {
    console.error('Profile GET error:', error);
    return NextResponse.json(
      { success: false, message: 'Đã xảy ra lỗi khi lấy thông tin tài khoản' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
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
    const { userId, fullName, phone, address } = body;

    const targetUserId = userId ? parseInt(userId) : authUser.userId;

    // Check ownership: customer can only update their own profile
    if (authUser.role !== 'admin' && authUser.userId !== targetUserId) {
      return NextResponse.json(
        { success: false, message: 'Bạn không có quyền chỉnh sửa tài khoản này' },
        { status: 403 }
      );
    }

    // Validate phone format if provided
    if (phone && phone.trim()) {
      const phoneRegex = /^(0)(3|5|7|8|9)[0-9]{8}$/;
      if (!phoneRegex.test(String(phone).trim())) {
        return NextResponse.json(
          { success: false, message: 'Số điện thoại không đúng định dạng di động Việt Nam' },
          { status: 400 }
        );
      }
    }

    const updated = await updateUserProfile(targetUserId, {
      fullName: fullName?.trim(),
      phone: phone?.trim(),
      address: address?.trim(),
    });

    if (!updated) {
      return NextResponse.json(
        { success: false, message: 'Cập nhật thông tin thất bại' },
        { status: 400 }
      );
    }

    const { password, ...safeUser } = updated as any;

    return NextResponse.json({
      success: true,
      user: safeUser,
      message: 'Cập nhật thông tin cá nhân thành công!',
    });
  } catch (error: any) {
    console.error('Profile PATCH error:', error);
    return NextResponse.json(
      { success: false, message: 'Đã xảy ra lỗi khi cập nhật thông tin cá nhân' },
      { status: 500 }
    );
  }
}
