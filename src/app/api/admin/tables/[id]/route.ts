import { NextRequest, NextResponse } from 'next/server';
import { getTableById, updateTable, deleteTable, logAdminAction } from '@/lib/db';
import { resolveLiveUser, AuthError } from '@/lib/auth';
import { sanitizeText } from '@/lib/security';

export const dynamic = 'force-dynamic';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
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
      return NextResponse.json({ success: false, message: 'Không có quyền chỉnh sửa bàn' }, { status: 403 });
    }

    const id = parseInt(params.id, 10);
    if (!Number.isFinite(id) || id <= 0) {
      return NextResponse.json({ success: false, message: 'ID bàn không hợp lệ' }, { status: 400 });
    }

    const existing = await getTableById(id);
    if (!existing) {
      return NextResponse.json({ success: false, message: 'Không tìm thấy bàn' }, { status: 404 });
    }

    if (liveUser.role === 'manager' && existing.branchId !== (liveUser.branchId || 1)) {
      return NextResponse.json({ success: false, message: 'Bàn này thuộc cơ sở khác, bạn không có quyền sửa' }, { status: 403 });
    }

    const body = await request.json();
    const patch: {
      branchId?: number;
      tableNumber?: string;
      tableName?: string;
      capacity?: number;
      isActive?: boolean;
      regenerateQr?: boolean;
    } = {};

    if (liveUser.role === 'admin' && body.branchId !== undefined) {
      patch.branchId = Number(body.branchId) === 2 ? 2 : 1;
    }
    if (body.tableNumber !== undefined) {
      const num = sanitizeText(String(body.tableNumber), 20).toUpperCase();
      if (!num) return NextResponse.json({ success: false, message: 'Mã bàn không được để trống' }, { status: 400 });
      patch.tableNumber = num;
    }
    if (body.tableName !== undefined) {
      patch.tableName = sanitizeText(String(body.tableName), 100) || `Bàn ${patch.tableNumber || existing.tableNumber}`;
    }
    if (body.capacity !== undefined) {
      patch.capacity = Math.max(1, Math.min(30, Number(body.capacity || 4)));
    }
    if (body.isActive !== undefined) {
      patch.isActive = Boolean(body.isActive);
    }
    if (body.regenerateQr) {
      patch.regenerateQr = true;
    }

    let ok = false;
    try {
      ok = await updateTable(id, patch);
    } catch (dupErr: any) {
      return NextResponse.json({ success: false, message: dupErr.message || 'Dữ liệu bàn không hợp lệ' }, { status: 400 });
    }

    if (ok) {
      const action = patch.regenerateQr
        ? 'REGENERATE_TABLE_QR'
        : patch.isActive !== undefined && Object.keys(patch).length === 1
        ? patch.isActive ? 'UNLOCK_TABLE' : 'LOCK_TABLE'
        : 'UPDATE_TABLE';
      const details = patch.regenerateQr
        ? `Cấp lại mã QR mới cho bàn ${existing.tableNumber} (${existing.tableName}) - mã QR cũ đã vô hiệu`
        : patch.isActive !== undefined && Object.keys(patch).length === 1
        ? `${patch.isActive ? 'Mở lại' : 'Tạm khóa'} bàn ${existing.tableNumber} (${existing.tableName})`
        : `Cập nhật bàn ${existing.tableNumber} -> ${patch.tableNumber || existing.tableNumber} (${patch.tableName || existing.tableName}, ${patch.capacity || existing.capacity} chỗ)`;

      await logAdminAction({
        adminId: liveUser.id,
        adminName: liveUser.fullName || liveUser.username,
        adminRole: liveUser.role,
        branchId: patch.branchId || existing.branchId,
        action,
        targetType: 'Table',
        targetId: patch.tableNumber || existing.tableNumber,
        details,
      });
    }

    return NextResponse.json({ success: ok, message: ok ? 'Cập nhật bàn thành công' : 'Không tìm thấy bàn' });
  } catch (error) {
    console.error('PATCH /api/admin/tables/[id] error:', error);
    return NextResponse.json({ success: false, message: 'Lỗi cập nhật bàn' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
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
      return NextResponse.json({ success: false, message: 'Không có quyền xóa bàn' }, { status: 403 });
    }

    const id = parseInt(params.id, 10);
    if (!Number.isFinite(id) || id <= 0) {
      return NextResponse.json({ success: false, message: 'ID bàn không hợp lệ' }, { status: 400 });
    }

    const existing = await getTableById(id);
    if (!existing) {
      return NextResponse.json({ success: false, message: 'Không tìm thấy bàn' }, { status: 404 });
    }

    if (liveUser.role === 'manager' && existing.branchId !== (liveUser.branchId || 1)) {
      return NextResponse.json({ success: false, message: 'Bàn này thuộc cơ sở khác, bạn không có quyền xóa' }, { status: 403 });
    }

    const ok = await deleteTable(id);
    if (ok) {
      await logAdminAction({
        adminId: liveUser.id,
        adminName: liveUser.fullName || liveUser.username,
        adminRole: liveUser.role,
        branchId: existing.branchId,
        action: 'DELETE_TABLE',
        targetType: 'Table',
        targetId: existing.tableNumber,
        details: `Xóa bàn ${existing.tableNumber} (${existing.tableName}) tại CS${existing.branchId}`,
      });
    }

    return NextResponse.json({ success: ok, message: ok ? 'Đã xóa bàn' : 'Không tìm thấy bàn' });
  } catch (error) {
    console.error('DELETE /api/admin/tables/[id] error:', error);
    return NextResponse.json({ success: false, message: 'Lỗi xóa bàn' }, { status: 500 });
  }
}
