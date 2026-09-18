import { NextRequest, NextResponse } from 'next/server';
import { getAllCoupons, addCustomCoupon, deleteCustomCoupon, findCouponByCode, generateRandomCouponCode } from '@/lib/coupons';
import { authenticateRequest } from '@/lib/auth';
import { Coupon } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const coupons = getAllCoupons();
    return NextResponse.json({
      success: true,
      data: coupons,
    });
  } catch (error: any) {
    console.error('Error fetching coupons:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi khi tải danh sách mã giảm giá' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = authenticateRequest(request);
    if (!authUser || authUser.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Chỉ Quản trị viên mới có quyền tạo mã ưu đãi' },
        { status: 403 }
      );
    }

    const body = await request.json();
    let {
      code,
      name,
      description,
      discountType,
      discountValue,
      minOrderAmount,
      maxDiscountAmount,
      expiryDate,
      usageLimit,
      categoryExclusive,
      minTier,
      isOneTimeUse,
    } = body;

    // Generate code if not provided or requested random
    if (!code || code.trim() === '') {
      code = generateRandomCouponCode();
    } else {
      code = code.trim().toUpperCase();
    }

    if (!name || !discountValue) {
      return NextResponse.json(
        { success: false, message: 'Vui lòng nhập đầy đủ tên mã và giá trị giảm' },
        { status: 400 }
      );
    }

    const newCoupon: Coupon = {
      code,
      name: name.trim(),
      description: description ? description.trim() : `Ưu đãi ${discountType === 'percentage' ? discountValue + '%' : discountValue + 'đ'} từ NooNee`,
      discountType: discountType === 'percentage' ? 'percentage' : 'fixed',
      discountValue: Number(discountValue) || 0,
      minOrderAmount: Number(minOrderAmount) || 0,
      maxDiscountAmount: maxDiscountAmount ? Number(maxDiscountAmount) : undefined,
      expiryDate: expiryDate || '2026-12-31',
      usageLimit: usageLimit ? Number(usageLimit) : 100,
      usedCount: 0,
      categoryExclusive: categoryExclusive || 'all',
      minTier: minTier || undefined,
      isOneTimeUse: Boolean(isOneTimeUse),
      isActive: true,
      createdAt: new Date().toISOString(),
      badge: discountType === 'percentage' ? `Giảm ${discountValue}%` : `Giảm ${Math.round(discountValue / 1000)}k`,
    };

    addCustomCoupon(newCoupon);

    return NextResponse.json({
      success: true,
      data: newCoupon,
      message: `Đã tạo mã giảm giá "${newCoupon.code}" thành công`,
    });
  } catch (error: any) {
    console.error('Error creating coupon:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi máy chủ khi tạo mã giảm giá' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authUser = authenticateRequest(request);
    if (!authUser || authUser.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Chỉ Quản trị viên mới có quyền xóa mã ưu đãi' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json(
        { success: false, message: 'Mã ưu đãi không hợp lệ' },
        { status: 400 }
      );
    }

    const deleted = deleteCustomCoupon(code);
    const target = findCouponByCode(code);
    if (target) {
      target.isActive = false;
    }

    return NextResponse.json({
      success: true,
      message: `Đã xóa hoặc vô hiệu hóa mã "${code}"`,
    });
  } catch (error: any) {
    console.error('Error deleting coupon:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi máy chủ khi xóa mã giảm giá' },
      { status: 500 }
    );
  }
}
