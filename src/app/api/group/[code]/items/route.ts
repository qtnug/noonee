import { NextRequest, NextResponse } from 'next/server';
import { updateGroupMemberItem, getProducts } from '@/lib/db';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    if (!code) {
      return NextResponse.json(
        { success: false, message: 'Mã nhóm không hợp lệ' },
        { status: 400 }
      );
    }

    const ip = getClientIp(request);
    const rateCheck = checkRateLimit(`group-item:${ip}`, 60, 60000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { success: false, message: 'Thao tác quá nhanh, vui lòng thử lại sau.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { memberId, action, item } = body;

    if (!memberId) {
      return NextResponse.json(
        { success: false, message: 'Không xác định được danh tính thành viên' },
        { status: 400 }
      );
    }

    if (!['add', 'remove', 'update_qty'].includes(action)) {
      return NextResponse.json(
        { success: false, message: 'Hành động không hợp lệ' },
        { status: 400 }
      );
    }

    // Validate genuine price if adding item
    if (action === 'add' && item?.productId) {
      const dbProducts = await getProducts();
      const genuineProd = dbProducts.find((p) => p.id === Number(item.productId));
      if (!genuineProd) {
        return NextResponse.json(
          { success: false, message: 'Món ăn không tồn tại trong hệ thống' },
          { status: 400 }
        );
      }
      
      let unitPrice = genuineProd.price;
      // Calculate topping prices
      if (item.toppings && Array.isArray(item.toppings)) {
        for (const top of item.toppings) {
          const matchedTop = genuineProd.toppings?.find((t) => t.id === top.id || t.name === top.name);
          if (matchedTop) {
            unitPrice += matchedTop.price;
          }
        }
      }
      item.price = unitPrice;
      item.productName = genuineProd.name;
    }

    const result = await updateGroupMemberItem(code, memberId, action, item || {});
    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.group,
    });
  } catch (error: any) {
    console.error('Error updating group member items:', error);
    return NextResponse.json(
      { success: false, message: 'Đã xảy ra lỗi khi cập nhật món' },
      { status: 500 }
    );
  }
}
