import { NextRequest, NextResponse } from 'next/server';
import { getOrders, createOrder, getProducts, hasUserPaidFirstVietqr, getUserSpendingStats, getGroupOrderByCode, completeGroupOrder } from '@/lib/db';
import { generateOrderCode } from '@/lib/utils';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';
import { requireAuth, requireAdmin, authenticateRequest, AuthError } from '@/lib/auth';
import { validateCoupon, incrementCouponUsage } from '@/lib/coupons';
import { getMembershipTier } from '@/lib/membership';
import { calculateGroupDiscount } from '@/lib/groupOrder';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authUser = authenticateRequest(request);
    if (!authUser) {
      return NextResponse.json({ success: false, message: 'Vui lòng đăng nhập để xem danh sách đơn hàng' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    const search = searchParams.get('search') || undefined;
    const userIdParam = searchParams.get('userId');
    const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;

    let targetUserId: number | undefined;

    if (authUser.role === 'admin') {
      targetUserId = userIdParam ? parseInt(userIdParam) : undefined;
    } else {
      // Regular customer can only see their own orders
      targetUserId = authUser.userId;
    }

    const orders = await getOrders({ status, search, userId: targetUserId, page, limit });
    return NextResponse.json({ success: true, data: orders });
  } catch (error: any) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ success: false, message: 'Đã xảy ra lỗi khi tải danh sách đơn hàng' }, { status: 500 });
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

    let authUser;
    try {
      authUser = requireAuth(request);
    } catch (authErr) {
      if (authErr instanceof AuthError) {
        return NextResponse.json({ success: false, message: authErr.message }, { status: authErr.status });
      }
      throw authErr;
    }

    const body = await request.json();
    const { customerName, customerPhone, deliveryAddress, notes, items, paymentMethod, couponCode, freeshipCouponCode, useWallet, groupCode, hp_bot_trap } = body;

    // Anti-bot honeypot check (STT 1)
    if (hp_bot_trap) {
      return NextResponse.json(
        { success: false, message: 'Yêu cầu bị từ chối do phát hiện hành vi bot tự động' },
        { status: 400 }
      );
    }

    // Use authenticated user ID directly
    const userId = authUser.userId;

    if (!customerName || !customerPhone || !deliveryAddress || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Vui lòng cung cấp đầy đủ thông tin nhận hàng và món ăn' },
        { status: 400 }
      );
    }

    // Validate phone number format (Vietnamese mobile 10 digits)
    const phoneRegex = /^(0)(3|5|7|8|9)[0-9]{8}$/;
    if (!phoneRegex.test(String(customerPhone).trim())) {
      return NextResponse.json(
        { success: false, message: 'Số điện thoại nhận hàng không đúng định dạng (10 chữ số, bắt đầu bằng 03, 05, 07, 08, 09)' },
        { status: 400 }
      );
    }

    // SERVER-SIDE PRICE VALIDATION (C8, H17)
    // Fetch products from database to ensure genuine prices
    const dbProducts = await getProducts();
    const validatedItems: {
      productId: number;
      productName: string;
      price: number;
      quantity: number;
      toppings?: string | null;
      note?: string | null;
    }[] = [];

    let subtotal = 0;

    for (const it of items) {
      const pId = Number(it.productId);
      const qty = parseInt(it.quantity);

      if (!pId || isNaN(pId) || !qty || isNaN(qty) || qty <= 0) {
        return NextResponse.json(
          { success: false, message: 'Thông tin món ăn hoặc số lượng không hợp lệ' },
          { status: 400 }
        );
      }

      const dbProduct = dbProducts.find((p) => p.id === pId);
      if (!dbProduct) {
        return NextResponse.json(
          { success: false, message: `Món ăn có ID ${pId} không tồn tại trong hệ thống` },
          { status: 400 }
        );
      }

      if (!dbProduct.isAvailable) {
        return NextResponse.json(
          { success: false, message: `Món "${dbProduct.name}" hiện tạm thời ngưng phục vụ` },
          { status: 400 }
        );
      }

      // Calculate toppings price securely from product toppings definition
      let toppingsExtra = 0;
      let toppingsStr: string | null = null;
      if (it.toppings || it.selectedToppings) {
        toppingsStr = typeof it.toppings === 'string' ? it.toppings : (it.toppings ? JSON.stringify(it.toppings) : null);
        if (Array.isArray(dbProduct.toppings)) {
          if (Array.isArray(it.selectedToppings) && it.selectedToppings.length > 0) {
            for (const st of it.selectedToppings) {
              const matchedTop = dbProduct.toppings.find((t) => t.id === st.id || t.name === st.name);
              if (matchedTop) {
                toppingsExtra += matchedTop.price || 0;
              }
            }
          } else if (typeof it.toppings === 'string' && it.toppings.trim()) {
            // Fallback: match topping names in toppings string
            for (const top of dbProduct.toppings) {
              if (it.toppings.includes(top.name)) {
                toppingsExtra += top.price || 0;
              }
            }
          }
        }
      }

      const finalItemUnitPrice = dbProduct.price + toppingsExtra;
      const lineTotal = finalItemUnitPrice * qty;
      subtotal += lineTotal;

      validatedItems.push({
        productId: dbProduct.id,
        productName: dbProduct.name,
        price: finalItemUnitPrice,
        quantity: qty,
        toppings: toppingsStr,
        note: it.note ? String(it.note).trim() : null,
      });
    }

    // Validate Food Discount Coupon
    let discountAmount = 0;
    let validCouponCode: string | null = null;

    if (couponCode) {
      const [isFirstPaid, spendingStats] = await Promise.all([
        hasUserPaidFirstVietqr(userId),
        getUserSpendingStats(userId),
      ]);
      const userTier = getMembershipTier(spendingStats.totalSpent).tier;
      const isNewUser = !isFirstPaid;
      const validation = validateCoupon(couponCode, subtotal, paymentMethod || 'Sepay', isNewUser, userTier, items);
      if (validation.valid) {
        discountAmount = validation.discountAmount;
        validCouponCode = validation.coupon ? validation.coupon.code : String(couponCode).toUpperCase();
        incrementCouponUsage(validCouponCode);
      }
    }

    // Validate Freeship Coupon
    let validFreeshipCode: string | null = null;
    let freeshipDiscount = 0;
    if (freeshipCouponCode) {
      const [isFirstPaid2, spendingStats2] = await Promise.all([
        hasUserPaidFirstVietqr(userId),
        getUserSpendingStats(userId),
      ]);
      const userTier2 = getMembershipTier(spendingStats2.totalSpent).tier;
      const isNewUser2 = !isFirstPaid2;
      const freeshipValidation = validateCoupon(freeshipCouponCode, subtotal, paymentMethod || 'Sepay', isNewUser2, userTier2, items);
      if (freeshipValidation.valid && freeshipValidation.coupon?.couponType === 'freeship') {
        validFreeshipCode = freeshipValidation.coupon.code;
        freeshipDiscount = freeshipValidation.discountAmount;
        incrementCouponUsage(validFreeshipCode);
      }
    }

    // Direct Group Discount (giảm trực tiếp không cần voucher: 3 người -> 2%, 5 người -> 5%, 10 người -> 10%)
    let groupDiscountAmount = 0;
    let validatedGroupCode: string | null = null;
    if (groupCode) {
      const group = await getGroupOrderByCode(groupCode);
      if (!group) {
        return NextResponse.json({ success: false, message: 'Nhóm đặt món không tồn tại trong hệ thống.' }, { status: 400 });
      }
      if (group.status === 'completed') {
        return NextResponse.json({ success: false, message: 'Đơn nhóm này đã được hoàn tất thanh toán trước đó!' }, { status: 400 });
      }
      // Authorization check (Test Case 4.1): Only the group host can checkout
      if (group.hostUserId && group.hostUserId !== userId) {
        return NextResponse.json({ success: false, message: 'Chỉ trưởng nhóm mới có quyền tiến hành thanh toán đơn nhóm này.' }, { status: 403 });
      }
      if ((group.members?.length || 0) < 2) {
        return NextResponse.json({ success: false, message: 'Đơn nhóm cần tối thiểu 2 người để đặt hàng.' }, { status: 400 });
      }

      validatedGroupCode = group.code;
      const memberCount = group.members?.length || 0;
      const groupDisc = calculateGroupDiscount(memberCount);
      if (groupDisc.percentage > 0) {
        groupDiscountAmount = Math.round(subtotal * (groupDisc.percentage / 100));
        discountAmount += groupDiscountAmount;
      }
    }

    const shippingFee = typeof body.shippingFee === 'number' ? Math.max(0, Math.round(body.shippingFee)) : 0;
    // Apply freeship coupon to shipping fee
    const isFullFreeship = validFreeshipCode === 'FREESHIP';
    const effectiveShippingDiscount = isFullFreeship ? shippingFee : Math.min(shippingFee, freeshipDiscount);
    const finalShippingFee = Math.max(0, shippingFee - effectiveShippingDiscount);
    const effectiveFoodDiscount = discountAmount; // includes food coupon + group discount
    // Remove unused variable
    // Calculate total: subtotal minus all discounts plus effective shipping
    const totalBeforeWallet = Math.max(0, subtotal - effectiveFoodDiscount + finalShippingFee);

    // Handle Virtual Wallet Balance Deduction
    let walletAmountUsed = 0;
    if (useWallet && userId) {
      const { getUserWalletBalance } = await import('@/lib/db');
      const currentWallet = await getUserWalletBalance(userId);
      if (currentWallet > 0) {
        walletAmountUsed = Math.min(currentWallet, totalBeforeWallet);
      }
    }

    const finalAmountToPay = Math.max(0, totalBeforeWallet - walletAmountUsed);
    const isFullyPaidByWallet = walletAmountUsed > 0 && finalAmountToPay === 0;
    const orderCode = generateOrderCode();

    const order = await createOrder({
      orderCode,
      userId,
      customerName: String(customerName).trim(),
      customerPhone: String(customerPhone).trim(),
      deliveryAddress: String(deliveryAddress).trim(),
      notes: notes ? String(notes).trim() : '',
      totalAmount: finalAmountToPay,
      shippingFee: finalShippingFee,
      discountAmount: effectiveFoodDiscount,
      couponCode: validCouponCode,
      groupCode: validatedGroupCode,
      paymentMethod: isFullyPaidByWallet ? 'Wallet' : (paymentMethod || 'Sepay'),
      paymentStatus: isFullyPaidByWallet ? 'Paid' : 'Unpaid',
      walletAmountUsed,
      items: validatedItems,
    });

    if (validatedGroupCode) {
      await completeGroupOrder(validatedGroupCode, orderCode);
    }

    return NextResponse.json(
      {
        success: true,
        data: order,
        groupDiscountAmount,
        fullyPaidByWallet: isFullyPaidByWallet,
        walletAmountUsed,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error in POST /api/orders:', error);
    return NextResponse.json({ success: false, message: 'Đã xảy ra lỗi hệ thống khi tạo đơn hàng' }, { status: 500 });
  }
}
