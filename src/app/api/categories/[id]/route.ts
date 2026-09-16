import { NextRequest, NextResponse } from 'next/server';
import { updateCategory, deleteCategory } from '@/lib/db';
import { requireAdmin, AuthError } from '@/lib/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    try {
      requireAdmin(request);
    } catch (authErr) {
      if (authErr instanceof AuthError) {
        return NextResponse.json({ success: false, message: authErr.message }, { status: authErr.status });
      }
      throw authErr;
    }

    const id = parseInt(params.id);
    if (!id || isNaN(id)) {
      return NextResponse.json({ success: false, message: 'ID danh mục không hợp lệ' }, { status: 400 });
    }

    const body = await request.json();
    if (body.name !== undefined && !body.name.trim()) {
      return NextResponse.json({ success: false, message: 'Tên danh mục không được để trống' }, { status: 400 });
    }

    const payload: { name?: string; slug?: string; description?: string; icon?: string } = {};
    if (body.name !== undefined) payload.name = body.name.trim();
    if (body.slug !== undefined) payload.slug = body.slug.trim();
    if (body.description !== undefined) payload.description = body.description.trim();
    if (body.icon !== undefined) payload.icon = body.icon.trim();

    const success = await updateCategory(id, payload);
    return NextResponse.json({ success, message: 'Cập nhật danh mục thành công' });
  } catch (error: any) {
    console.error('Error updating category:', error);
    return NextResponse.json({ success: false, message: 'Đã xảy ra lỗi khi cập nhật danh mục' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    try {
      requireAdmin(request);
    } catch (authErr) {
      if (authErr instanceof AuthError) {
        return NextResponse.json({ success: false, message: authErr.message }, { status: authErr.status });
      }
      throw authErr;
    }

    const id = parseInt(params.id);
    if (!id || isNaN(id)) {
      return NextResponse.json({ success: false, message: 'ID danh mục không hợp lệ' }, { status: 400 });
    }

    const success = await deleteCategory(id);
    return NextResponse.json({ success, message: 'Đã xóa danh mục thành công' });
  } catch (error: any) {
    console.error('Error deleting category:', error);
    return NextResponse.json({ success: false, message: 'Đã xảy ra lỗi khi xóa danh mục' }, { status: 500 });
  }
}
