import { NextRequest, NextResponse } from 'next/server';
import { getTables, createTable, logAdminAction } from '@/lib/db';
import { resolveLiveUser, isPortalRole, AuthError } from '@/lib/auth';
import { sanitizeText } from '@/lib/security';

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

    if (!isPortalRole(liveUser.role)) {
      return NextResponse.json({ success: false, message: 'Không có quyền truy cập' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const branchParam = searchParams.get('branchId');
    const branchId =
      liveUser.role === 'admin'
        ? branchParam && branchParam !== 'all'
          ? parseInt(branchParam, 10)
          : null
        : liveUser.branchId || 1;

    const tables = await getTables(branchId);
    return NextResponse.json({ success: true, data: tables });
  } catch (error) {
    console.error('GET /api/admin/tables error:', error);
    return NextResponse.json({ success: false, message: 'Lỗi tải danh sách bàn' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
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
      return NextResponse.json({ success: false, message: 'Chỉ Admin hoặc Quản lý mới được thêm bàn' }, { status: 403 });
    }

    const body = await request.json();
    const branchId = liveUser.role === 'manager' ? liveUser.branchId || 1 : (Number(body.branchId) === 2 ? 2 : 1);
    const tableNumber = sanitizeText(String(body.tableNumber || ''), 20).toUpperCase();
    const tableName = sanitizeText(String(body.tableName || ''), 100) || `Bàn ${tableNumber}`;
    const capacity = Math.max(1, Math.min(30, Number(body.capacity || 4)));

    if (!tableNumber) {
      return NextResponse.json({ success: false, message: 'Vui lòng nhập mã bàn (VD: B05)' }, { status: 400 });
    }

    let created;
    try {
      created = await createTable({ branchId, tableNumber, tableName, capacity });
    } catch (dupErr: any) {
      return NextResponse.json({ success: false, message: dupErr.message || 'Mã bàn không hợp lệ' }, { status: 400 });
    }

    await logAdminAction({
      adminId: liveUser.id,
      adminName: liveUser.fullName || liveUser.username,
      adminRole: liveUser.role,
      branchId,
      action: 'CREATE_TABLE',
      targetType: 'Table',
      targetId: created.tableNumber,
      details: `Thêm bàn ${created.tableNumber} (${created.tableName}, ${created.capacity} chỗ) tại CS${branchId}`,
    });

    return NextResponse.json({ success: true, data: created });
  } catch (error) {
    console.error('POST /api/admin/tables error:', error);
    return NextResponse.json({ success: false, message: 'Lỗi tạo bàn mới' }, { status: 500 });
  }
}
