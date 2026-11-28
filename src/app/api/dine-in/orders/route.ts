import { NextRequest, NextResponse } from 'next/server';
import { createOrder, getOrderByCode, getProducts, getTableByParams, logAdminAction } from '@/lib/db';
import { generateOrderCode } from '@/lib/utils';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';
import { resolveLiveUser, isPortalRole } from '@/lib/auth';
import { sanitizeText } from '@/lib/security';
import { computeDineInLinePrice } from '@/lib/orderRules';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = (searchParams.get('code') || '').trim();
  if (!code) {
    return NextResponse.json({ success: false, message: 'Thiếu mã đơn' }, { status: 400 });
  }
  const order = await getOrderByCode(code);
  if (!order || order.orderType !== 'dinein') {
    return NextResponse.json({ success: false, message: 'Không tìm thấy đơn tại bàn' }, { status: 404 });
  }
  return NextResponse.json({
    success: true,
    data: {
      orderCode: order.orderCode,
      status: order.status,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      totalAmount: order.totalAmount,
      tableName: order.tableName,
      branchId: order.branchId,
      branchName: order.branchName,
      items: order.items || [],
      createdAt: order.createdAt,
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rateCheck = checkRateLimit(`dinein:${ip}`, 20, 60000);
    if (!rateCheck.allowed) {
      return NextResponse.json({ success: false, message: 'Thao tác quá nhanh, vui lòng thử lại sau.' }, { status: 429 });
    }

    let liveUser = null;
    try {
      liveUser = await resolveLiveUser(request);
    } catch {
      liveUser = null;
    }

    const body = await request.json();
    const { branchId = 1, tableNumber, token, customerName, notes, items, paymentMethod = 'COD' } = body;

    if (!tableNumber || !token || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, message: 'Thiếu xác thực bàn hoặc danh sách món' }, { status: 400 });
    }

    const cleanBranch = Number(branchId) === 2 ? 2 : 1;
    const table = await getTableByParams(cleanBranch, String(tableNumber), String(token));
    if (!table) {
      return NextResponse.json({ success: false, message: 'Bàn không hợp lệ, đang tạm khóa hoặc mã QR đã đổi mới' }, { status: 404 });
    }

    if (liveUser && (liveUser.role === 'manager' || liveUser.role === 'staff') && (liveUser.branchId || 1) !== table.branchId) {
      return NextResponse.json({ success: false, message: 'Nhân viên chỉ được tạo đơn tại bàn thuộc cơ sở của mình' }, { status: 403 });
    }

    const dbProducts = await getProducts({ branchId: table.branchId });
    const productMap = new Map(dbProducts.map((p) => [p.id, p]));

    let totalAmount = 0;
    const normalizedItems: {
      productId: number;
      productName: string;
      price: number;
      quantity: number;
      toppings?: string | null;
      note?: string | null;
    }[] = [];

    for (const item of items) {
      const p = productMap.get(Number(item.productId));
      if (!p || !p.isAvailable || (p.branchId !== null && p.branchId !== undefined && Number(p.branchId) !== table.branchId)) {
        return NextResponse.json(
          { success: false, message: `Món "${item.productName || item.productId}" hiện không phục vụ tại cơ sở này` },
          { status: 400 }
        );
      }
      const qty = Math.max(1, Math.min(50, Math.floor(Number(item.quantity || 1))));
      const { unitPrice, toppingNames } = computeDineInLinePrice(p, item.selectedToppings);
      totalAmount += unitPrice * qty;
      normalizedItems.push({
        productId: p.id,
        productName: p.name,
        price: unitPrice,
        quantity: qty,
        toppings: toppingNames.length > 0 ? toppingNames.join(', ') : null,
        note: item.note ? sanitizeText(String(item.note), 120) : null,
      });
    }

    const method: 'COD' | 'Sepay' = paymentMethod === 'Sepay' ? 'Sepay' : 'COD';
    const orderCode = generateOrderCode();
    const cleanGuestName = sanitizeText(String(customerName || ''), 80) || `Khách · ${table.tableName}`;

    const order = await createOrder({
      orderCode,
      userId: liveUser?.id || null,
      customerName: cleanGuestName,
      customerPhone: 'Tại bàn',
      deliveryAddress: `Tại bàn: ${table.tableName} (${table.tableNumber})`,
      notes: notes ? sanitizeText(String(notes), 300) : '',
      totalAmount,
      shippingFee: 0,
      discountAmount: 0,
      paymentMethod: method,
      paymentStatus: 'Unpaid',
      branchId: table.branchId,
      orderType: 'dinein',
      tableId: table.id,
      tableName: `${table.tableNumber} · ${table.tableName}`,
      items: normalizedItems,
    });

    if (liveUser && isPortalRole(liveUser.role)) {
      await logAdminAction({
        adminId: liveUser.id,
        adminName: liveUser.fullName || liveUser.username,
        adminRole: liveUser.role,
        branchId: table.branchId,
        action: 'CREATE_DINEIN_ORDER',
        targetType: 'Order',
        targetId: order.orderCode,
        details: `Lên đơn tại bàn ${table.tableNumber} (#${order.orderCode}, ${totalAmount.toLocaleString('vi-VN')}đ, ${method === 'Sepay' ? 'VietQR' : 'COD'})`,
      });
    }

    return NextResponse.json({ success: true, data: order });
  } catch (error) {
    console.error('POST /api/dine-in/orders error:', error);
    return NextResponse.json({ success: false, message: 'Không thể tạo đơn tại bàn' }, { status: 500 });
  }
}
