import { NextRequest, NextResponse } from 'next/server';
import { getAdminStats } from '@/lib/db';
import { requireAdmin, AuthError } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    try {
      requireAdmin(request);
    } catch (authErr) {
      if (authErr instanceof AuthError) {
        return NextResponse.json({ success: false, message: authErr.message }, { status: authErr.status });
      }
      throw authErr;
    }

    const { searchParams } = new URL(request.url);
    const period = (searchParams.get('period') || 'all') as any;
    const branchParam = searchParams.get('branch');
    const branchId = branchParam === 'all' || !branchParam ? 'all' : parseInt(branchParam);

    const stats = await getAdminStats(period, branchId);
    return NextResponse.json({ success: true, data: stats });
  } catch (error: any) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json({ success: false, message: 'Đã xảy ra lỗi khi lấy thống kê quản trị' }, { status: 500 });
  }
}
