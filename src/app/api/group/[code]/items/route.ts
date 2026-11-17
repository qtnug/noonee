import { NextRequest, NextResponse } from 'next/server';
import { updateGroupMemberItem, getProducts } from '@/lib/db';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';
import { authenticateRequest } from '@/lib/auth';

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
    const { memberId, action, item, requesterMemberId } = body;
    const authUser = authenticateRequest(request);
    if (!authUser) return NextResponse.json({ success: false, message: 'Vui lòng đăng nhập' }, { status: 401 });
    const { getGroupOrderByCode } = await import('@/lib/db');
    const group = await getGroupOrderByCode(code);
    const requester = group?.members.find(m => m.userId === authUser.userId);
    if (!requester || (requesterMemberId && requesterMemberId !== requester.id)) return NextResponse.json({ success: false, message: 'Không có quyền sửa đơn nhóm' }, { status: 403 });

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

    // Validate genuine price and availability if adding item (Test Case 2.1)
    if (action === 'add' && item?.productId) {
      const dbProducts = await getProducts();
      const genuineProd = dbProducts.find((p) => p.id === Number(item.productId));
      if (!genuineProd) {
        return NextResponse.json(
          { success: false, message: 'Món ăn không tồn tại trong hệ thống' },
          { status: 400 }
        );
      }

      if (!genuineProd.isAvailable) {
        return NextResponse.json(
          { success: false, message: `Món "${genuineProd.name}" hiện tạm thời ngưng phục vụ, vui lòng chọn món khác.` },
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

    const result = await updateGroupMemberItem(code, memberId, action, item || {}, requester.id);
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
