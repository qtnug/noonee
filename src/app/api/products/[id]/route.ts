import { NextRequest, NextResponse } from 'next/server';
import { getProductById, updateProduct, deleteProduct } from '@/lib/db';
import { resolveLiveUser, AuthError } from '@/lib/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
        { success: false, message: 'Bạn không có quyền chỉnh sửa món ăn' },
        { status: 403 }
      );
    }

    const id = parseInt(params.id);
    if (!id || isNaN(id)) {
      return NextResponse.json({ success: false, message: 'ID sản phẩm không hợp lệ' }, { status: 400 });
    }

    const body = await request.json();

    if (liveUser.role === 'manager') {
      const managerBranch = liveUser.branchId || 1;
      const existing = await getProductById(id);
      if (!existing) {
        return NextResponse.json({ success: false, message: 'Không tìm thấy món ăn' }, { status: 404 });
      }
      if (existing.branchId !== null && existing.branchId !== undefined && existing.branchId !== managerBranch) {
        return NextResponse.json(
          { success: false, message: 'Món ăn này thuộc cơ sở khác, bạn không có quyền chỉnh sửa' },
          { status: 403 }
        );
      }
      // Lock branchId so manager cannot reassign dish to another branch
      body.branchId = existing.branchId ?? null;
    }

    const success = await updateProduct(id, body);
    return NextResponse.json({ success, message: 'Cập nhật món ăn thành công' });
  } catch (error: any) {
    console.error('Error updating product:', error);
    return NextResponse.json({ success: false, message: 'Đã xảy ra lỗi khi cập nhật món ăn' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    if (liveUser.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Chỉ Tổng quản lý mới có quyền xóa món ăn' },
        { status: 403 }
      );
    }

    const id = parseInt(params.id);
    if (!id || isNaN(id)) {
      return NextResponse.json({ success: false, message: 'ID sản phẩm không hợp lệ' }, { status: 400 });
    }

    const success = await deleteProduct(id);
    return NextResponse.json({ success, message: 'Đã xóa món ăn thành công' });
  } catch (error: any) {
    console.error('Error deleting product:', error);
    return NextResponse.json({ success: false, message: 'Đã xảy ra lỗi khi xóa món ăn' }, { status: 500 });
  }
}
