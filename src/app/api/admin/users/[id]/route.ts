import { NextRequest, NextResponse } from 'next/server';
import { getUserById, updateInternalUser, deleteInternalUser } from '@/lib/db';
import { resolveLiveUser, AuthError } from '@/lib/auth';
import { sanitizeText } from '@/lib/security';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const actor = await resolveLiveUser(request);
    if (actor.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Chỉ Tổng quản lý mới có quyền chỉnh sửa tài khoản' },
        { status: 403 }
      );
    }

    const targetId = parseInt(params.id);
    if (!targetId || isNaN(targetId)) {
      return NextResponse.json({ success: false, message: 'ID tài khoản không hợp lệ' }, { status: 400 });
    }

    const target = await getUserById(targetId);
    if (!target) {
      return NextResponse.json({ success: false, message: 'Không tìm thấy tài khoản' }, { status: 404 });
    }

    const body = await request.json();

    if (target.role === 'admin') {
      if (body.isActive === false || (body.role && body.role !== 'admin')) {
        return NextResponse.json(
          { success: false, message: 'Không thể khóa hoặc hạ quyền tài khoản Tổng quản lý' },
          { status: 400 }
        );
      }
    }

    const updatePayload: {
      fullName?: string;
      phone?: string;
      email?: string | null;
      password?: string;
      role?: 'admin' | 'manager' | 'staff';
      branchId?: number | null;
      isActive?: boolean;
    } = {};

    if (body.fullName !== undefined) {
      const cleanName = sanitizeText(String(body.fullName).trim(), 100);
      if (!cleanName) {
        return NextResponse.json({ success: false, message: 'Họ tên không được để trống' }, { status: 400 });
      }
      updatePayload.fullName = cleanName;
    }

    if (body.phone !== undefined) {
      updatePayload.phone = sanitizeText(String(body.phone).trim(), 20);
    }

    if (body.email !== undefined) {
      updatePayload.email = body.email ? sanitizeText(String(body.email).trim(), 100) : null;
    }

    if (body.role !== undefined && target.role !== 'admin') {
      if (body.role !== 'manager' && body.role !== 'staff') {
        return NextResponse.json({ success: false, message: 'Vai trò không hợp lệ' }, { status: 400 });
      }
      updatePayload.role = body.role;
    }

    if (body.branchId !== undefined && target.role !== 'admin') {
      const bId = Number(body.branchId);
      if (bId !== 1 && bId !== 2) {
        return NextResponse.json({ success: false, message: 'Cơ sở làm việc phải là Cơ sở 1 hoặc Cơ sở 2' }, { status: 400 });
      }
      updatePayload.branchId = bId;
    }

    if (body.isActive !== undefined && target.role !== 'admin') {
      updatePayload.isActive = Boolean(body.isActive);
    }

    if (body.password !== undefined && String(body.password).trim().length > 0) {
      if (String(body.password).trim().length < 6) {
        return NextResponse.json({ success: false, message: 'Mật khẩu mới phải từ 6 ký tự trở lên' }, { status: 400 });
      }
      updatePayload.password = String(body.password).trim();
    }

    const updated = await updateInternalUser(targetId, updatePayload);
    return NextResponse.json({
      success: true,
      message: 'Cập nhật tài khoản thành công',
      data: updated,
    });
  } catch (err: any) {
    if (err instanceof AuthError) {
      return NextResponse.json({ success: false, message: err.message }, { status: err.status });
    }
    console.error('PATCH /api/admin/users/[id] error:', err);
    return NextResponse.json({ success: false, message: 'Đã xảy ra lỗi khi cập nhật tài khoản' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const actor = await resolveLiveUser(request);
    if (actor.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Chỉ Tổng quản lý mới có quyền xóa tài khoản' },
        { status: 403 }
      );
    }

    const targetId = parseInt(params.id);
    if (!targetId || isNaN(targetId)) {
      return NextResponse.json({ success: false, message: 'ID tài khoản không hợp lệ' }, { status: 400 });
    }

    const target = await getUserById(targetId);
    if (!target) {
      return NextResponse.json({ success: false, message: 'Không tìm thấy tài khoản' }, { status: 404 });
    }

    if (target.role === 'admin') {
      return NextResponse.json(
        { success: false, message: 'Không thể xóa tài khoản Tổng quản lý' },
        { status: 400 }
      );
    }

    await deleteInternalUser(targetId);
    return NextResponse.json({
      success: true,
      message: `Đã xóa tài khoản "${target.username}" thành công`,
    });
  } catch (err: any) {
    if (err instanceof AuthError) {
      return NextResponse.json({ success: false, message: err.message }, { status: err.status });
    }
    console.error('DELETE /api/admin/users/[id] error:', err);
    return NextResponse.json({ success: false, message: 'Đã xảy ra lỗi khi xóa tài khoản' }, { status: 500 });
  }
}
