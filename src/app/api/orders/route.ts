import { NextRequest, NextResponse } from 'next/server';
import { getOrders, createOrder, getProducts, hasUserPaidFirstVietqr, getUserSpendingStats, getGroupOrderByCode, completeGroupOrder, getCouponByCode } from '@/lib/db';
import { generateOrderCode, maskPhoneNumber } from '@/lib/utils';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';
import { requireAuth, resolveLiveUser, AuthError } from '@/lib/auth';
import { validateCoupon } from '@/lib/coupons';
import { getMembershipTier } from '@/lib/membership';
import { calculateGroupDiscount } from '@/lib/groupOrder';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    const search = searchParams.get('search') || undefined;
    const branchParam = searchParams.get('branchId') || searchParams.get('branch');
    let branchId = branchParam && branchParam !== 'all' ? parseInt(branchParam) : undefined;
    const userIdParam = searchParams.get('userId');
    const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;

    let targetUserId: number | undefined;
    const isPersonalLookup = userIdParam && parseInt(userIdParam) === liveUser.id;

    if (liveUser.role === 'admin') {
      targetUserId = userIdParam ? parseInt(userIdParam) : undefined;
    } else if ((liveUser.role === 'manager' || liveUser.role === 'staff') && !isPersonalLookup) {
      targetUserId = undefined;
      branchId = liveUser.branchId || 1;
    } else {
      // Regular customer (or staff viewing personal orders) can only see their own orders
      targetUserId = liveUser.id;
    }

    let orders = await getOrders({ status, search, userId: targetUserId, branchId, page, limit });

    // Staff only sees customer name, delivery address, and partially masked phone number
    if (liveUser.role === 'staff' && !isPersonalLookup) {
      orders = orders.map((o) => ({
        ...o,
        customerPhone: maskPhoneNumber(o.customerPhone),
      }));
    }

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
    const { customerName, customerPhone, deliveryAddress, notes, items, paymentMethod, couponCode, freeshipCouponCode, useWallet, groupCode, hp_bot_trap, branchId, branchName } = body;

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
      let isFirstPaid = false;
      let spendingStats = { totalSpent: 0, orderCount: 0 };
      let dbCoupon = null;

      try {
        const [p1, p2, p3] = await Promise.all([
          hasUserPaidFirstVietqr(userId),
          getUserSpendingStats(userId),
          getCouponByCode(couponCode),
        ]);
        isFirstPaid = p1;
        spendingStats = p2;
        dbCoupon = p3;
      } catch (err: any) {
        console.error('Error fetching coupon or user stats for order creation:', err);
      }

      const userTier = getMembershipTier(spendingStats.totalSpent).tier;
      const isNewUser = !isFirstPaid;
      const validation = validateCoupon(couponCode, subtotal, paymentMethod || 'Sepay', isNewUser, userTier, items, dbCoupon ? [dbCoupon] : []);
      if (validation.valid) {
        discountAmount = validation.discountAmount;
        validCouponCode = validation.coupon ? validation.coupon.code : String(couponCode).toUpperCase();
      } else {
        return NextResponse.json(
          { success: false, message: `Mã giảm giá "${couponCode}" không hợp lệ: ${validation.message || 'Không đủ điều kiện'}` },
          { status: 400 }
        );
      }
    }

    // Validate Freeship Coupon
    let validFreeshipCode: string | null = null;
    let freeshipDiscount = 0;
    if (freeshipCouponCode) {
      let isFirstPaid2 = false;
      let spendingStats2 = { totalSpent: 0, orderCount: 0 };
      let dbFreeship = null;

      try {
        const [p1, p2, p3] = await Promise.all([
          hasUserPaidFirstVietqr(userId),
          getUserSpendingStats(userId),
          getCouponByCode(freeshipCouponCode),
        ]);
        isFirstPaid2 = p1;
        spendingStats2 = p2;
        dbFreeship = p3;
      } catch (err: any) {
        console.error('Error fetching freeship coupon for order creation:', err);
      }

      const userTier2 = getMembershipTier(spendingStats2.totalSpent).tier;
      const isNewUser2 = !isFirstPaid2;
      const freeshipValidation = validateCoupon(freeshipCouponCode, subtotal, paymentMethod || 'Sepay', isNewUser2, userTier2, items, dbFreeship ? [dbFreeship] : []);
      if (freeshipValidation.valid && freeshipValidation.coupon?.couponType === 'freeship') {
        validFreeshipCode = freeshipValidation.coupon.code;
        freeshipDiscount = freeshipValidation.discountAmount;
      } else {
        return NextResponse.json(
          { success: false, message: `Mã freeship "${freeshipCouponCode}" không hợp lệ: ${freeshipValidation.message || 'Không đủ điều kiện'}` },
          { status: 400 }
        );
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
      if (group.status !== 'locked') {
        return NextResponse.json({ success: false, message: 'Đơn nhóm này đã được hoàn tất thanh toán trước đó!' }, { status: 400 });
      }
      // Authorization check (Test Case 4.1): Only the group host can checkout
      if (group.hostUserId !== userId) {
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

    const chosenBranchId = branchId ? Number(branchId) : 1;
    const chosenBranchName = branchName || (chosenBranchId === 2 ? 'NooNee - Cơ sở 269 Cầu Giấy' : 'NooNee - Cơ sở 120 Yên Lãng');

    const { calculateDistanceFromStore } = await import('@/lib/goong');
    const distanceResult = await calculateDistanceFromStore({
      address: String(deliveryAddress).trim(),
      branchId: chosenBranchId,
    });
    if (process.env.NODE_ENV === 'production' && distanceResult.isSimulated) {
      return NextResponse.json({ success: false, message: 'Chưa xác minh được phí giao hàng. Vui lòng thử lại.' }, { status: 503 });
    }
    if (distanceResult.isOutOfRange) return NextResponse.json({ success: false, message: 'Địa chỉ ngoài phạm vi giao hàng' }, { status: 400 });
    const shippingFee = distanceResult.shippingFee;
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
      freeshipCouponCode: validFreeshipCode,
      groupCode: validatedGroupCode,
      paymentMethod: isFullyPaidByWallet ? 'Wallet' : (paymentMethod || 'Sepay'),
      paymentStatus: isFullyPaidByWallet ? 'Paid' : 'Unpaid',
      walletAmountUsed,
      branchId: chosenBranchId,
      branchName: chosenBranchName,
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
