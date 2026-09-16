import { NextRequest, NextResponse } from 'next/server';
import { updateProduct, deleteProduct } from '@/lib/db';
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
      return NextResponse.json({ success: false, message: 'ID sản phẩm không hợp lệ' }, { status: 400 });
    }

    const body = await request.json();
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
      return NextResponse.json({ success: false, message: 'ID sản phẩm không hợp lệ' }, { status: 400 });
    }

    const success = await deleteProduct(id);
    return NextResponse.json({ success, message: 'Đã xóa món ăn thành công' });
  } catch (error: any) {
    console.error('Error deleting product:', error);
    return NextResponse.json({ success: false, message: 'Đã xảy ra lỗi khi xóa món ăn' }, { status: 500 });
  }
}
