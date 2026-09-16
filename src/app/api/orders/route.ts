import { NextRequest, NextResponse } from 'next/server';
import { getOrders, createOrder } from '@/lib/db';
import { generateOrderCode } from '@/lib/utils';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    const search = searchParams.get('search') || undefined;
    const userIdParam = searchParams.get('userId');
    const userId = userIdParam ? parseInt(userIdParam) : undefined;

    const orders = await getOrders({ status, search, userId });
    return NextResponse.json({ success: true, data: orders });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rateCheck = checkRateLimit(`order:${ip}`, 15, 60000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { success: false, message: 'Bạn đang tạo đơn quá nhanh. Vui lòng chờ 1 phút trước khi thử lại.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { customerName, customerPhone, deliveryAddress, notes, items, paymentMethod, userId, couponCode } = body;

    // Requirement: User must be logged in to order
    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'Vui lòng đăng nhập tài khoản trước khi đặt hàng' },
        { status: 401 }
      );
    }

    if (!customerName || !customerPhone || !deliveryAddress || !items || items.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Vui lòng cung cấp đầy đủ thông tin nhận hàng và món ăn' },
        { status: 400 }
      );
    }

    const subtotal = items.reduce(
      (sum: number, it: any) => sum + (Number(it.price) || 0) * (Number(it.quantity) || 1),
      0
    );

    let discountAmount = 0;
    let validCouponCode: string | null = null;

    if (couponCode) {
      const { validateCoupon } = await import('@/lib/coupons');
      const { hasUserPaidFirstVietqr, getUserSpendingStats } = await import('@/lib/db');
      const { getMembershipTier } = await import('@/lib/membership');
      const parsedUserId = parseInt(String(userId));
      const [isFirstPaid, spendingStats] = await Promise.all([
        hasUserPaidFirstVietqr(parsedUserId),
        getUserSpendingStats(parsedUserId),
      ]);
      const userTier = getMembershipTier(spendingStats.totalSpent).tier;
      const isNewUser = !isFirstPaid;
      const validation = validateCoupon(couponCode, subtotal, paymentMethod || 'Sepay', isNewUser, userTier);
      if (validation.valid) {
        discountAmount = validation.discountAmount;
        validCouponCode = validation.coupon ? validation.coupon.code : String(couponCode).toUpperCase();
      }
    }

    const shippingFee = typeof body.shippingFee === 'number' ? Math.max(0, body.shippingFee) : 0;
    const couponDiscountExcludingFreeship = validCouponCode === 'FREESHIP' ? 0 : discountAmount;
    const totalBeforeWallet = Math.max(0, subtotal - couponDiscountExcludingFreeship + shippingFee);

    // Handle Virtual Wallet Balance Deduction
    let walletAmountUsed = 0;
    const parsedUserId = parseInt(String(userId));
    if (body.useWallet && parsedUserId) {
      const { getUserWalletBalance, deductUserWallet } = await import('@/lib/db');
      const currentWallet = await getUserWalletBalance(parsedUserId);
      if (currentWallet > 0) {
        walletAmountUsed = Math.min(currentWallet, totalBeforeWallet);
        if (walletAmountUsed > 0) {
          await deductUserWallet(parsedUserId, walletAmountUsed);
        }
      }
    }

    const finalAmountToPay = Math.max(0, totalBeforeWallet - walletAmountUsed);
    const isFullyPaidByWallet = walletAmountUsed > 0 && finalAmountToPay === 0;
    const orderCode = generateOrderCode();

    const order = await createOrder({
      orderCode,
      userId: parsedUserId,
      customerName: String(customerName).trim(),
      customerPhone: String(customerPhone).trim(),
      deliveryAddress: String(deliveryAddress).trim(),
      notes: notes ? String(notes).trim() : '',
      totalAmount: finalAmountToPay,
      discountAmount,
      couponCode: validCouponCode,
      paymentMethod: isFullyPaidByWallet ? 'Wallet' : (paymentMethod || 'Sepay'),
      paymentStatus: isFullyPaidByWallet ? 'Paid' : 'Unpaid',
      walletAmountUsed,
      items,
    });

    return NextResponse.json({ 
      success: true, 
      data: order,
      fullyPaidByWallet: isFullyPaidByWallet,
      walletAmountUsed,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error in POST /api/orders:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
