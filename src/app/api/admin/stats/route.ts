import { NextRequest, NextResponse } from 'next/server';
import { getAdminStats } from '@/lib/db';
import { resolveLiveUser, AuthError } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    let liveUser;
    try {
      liveUser = await resolveLiveUser(request);
    } catch (authErr) {
      if (authErr instanceof AuthError) {
        return NextResponse.json({ success: false, message: authErr.message }, { status: authErr.status });
      }
      throw authErr;
    }

    if (liveUser.role !== 'admin' && liveUser.role !== 'manager') {
      return NextResponse.json(
        { success: false, message: 'Bạn không có quyền xem thống kê doanh thu' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    let period = (searchParams.get('period') || 'all') as any;
    const branchParam = searchParams.get('branch');
    let branchId: number | 'all' = branchParam === 'all' || !branchParam ? 'all' : parseInt(branchParam);

    // Manager can ONLY view today's revenue of their assigned branch
    if (liveUser.role === 'manager') {
      period = 'today';
      branchId = liveUser.branchId || 1;
    }

    const stats = await getAdminStats(period, branchId);
    return NextResponse.json({ success: true, data: stats });
  } catch (error: any) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json({ success: false, message: 'Đã xảy ra lỗi khi lấy thống kê quản trị' }, { status: 500 });
  }
}
