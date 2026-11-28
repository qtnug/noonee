import { NextRequest, NextResponse } from 'next/server';
import { getAdminLogs } from '@/lib/db';
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
      return NextResponse.json({ success: false, message: 'Không có quyền xem nhật ký hệ thống' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const branchParam = searchParams.get('branchId');
    const branchId =
      liveUser.role === 'manager'
        ? liveUser.branchId || 1
        : branchParam && branchParam !== 'all'
        ? parseInt(branchParam, 10)
        : null;

    const logs = await getAdminLogs(branchId, 150);
    return NextResponse.json({ success: true, data: logs });
  } catch (error) {
    console.error('GET /api/admin/logs error:', error);
    return NextResponse.json({ success: false, message: 'Lỗi tải nhật ký hệ thống' }, { status: 500 });
  }
}
