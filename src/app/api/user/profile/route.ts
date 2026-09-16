import { NextRequest, NextResponse } from 'next/server';
import { getUserById, getUserSpendingStats, updateUserProfile } from '@/lib/db';
import { getMembershipTier } from '@/lib/membership';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userIdParam = searchParams.get('userId');

    if (!userIdParam) {
      return NextResponse.json(
        { success: false, message: 'Thiếu userId' },
        { status: 400 }
      );
    }

    const userId = parseInt(userIdParam);
    const [user, stats] = await Promise.all([
      getUserById(userId),
      getUserSpendingStats(userId),
    ]);

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Người dùng không tồn tại' },
        { status: 404 }
      );
    }

    // Strip out password
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
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, fullName, phone, address } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'Thiếu userId' },
        { status: 400 }
      );
    }

    const updated = await updateUserProfile(parseInt(userId), {
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
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
