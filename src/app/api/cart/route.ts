import { NextRequest, NextResponse } from 'next/server';
import { getUserCartItems, replaceUserCartItems } from '@/lib/db';
import { resolveLiveUser, AuthError } from '@/lib/auth';
import { sanitizeIncomingCart, hydrateCart } from '@/lib/cartServer';

export const dynamic = 'force-dynamic';

function handleError(err: unknown, fallbackMessage: string) {
  if (err instanceof AuthError) {
    return NextResponse.json({ success: false, message: err.message }, { status: err.status });
  }
  console.error(fallbackMessage, err);
  return NextResponse.json({ success: false, message: fallbackMessage }, { status: 500 });
}

/**
 * GET /api/cart — Lấy giỏ hàng đã lưu của tài khoản đang đăng nhập
 */
export async function GET(request: NextRequest) {
  try {
    const user = await resolveLiveUser(request);
    const stored = await getUserCartItems(user.id);
    const items = await hydrateCart(stored);
    return NextResponse.json({ success: true, data: items });
  } catch (err) {
    return handleError(err, 'Không thể tải giỏ hàng của tài khoản');
  }
}

/**
 * PUT /api/cart — Ghi đè toàn bộ giỏ hàng của tài khoản
 * Body: { items: [{ productId, quantity, selectedToppings, note }] }
 */
export async function PUT(request: NextRequest) {
  try {
    const user = await resolveLiveUser(request);
    const body = await request.json().catch(() => ({}));
    const sanitized = await sanitizeIncomingCart(body?.items);
    await replaceUserCartItems(user.id, sanitized);
    const items = await hydrateCart(sanitized);
    return NextResponse.json({ success: true, data: items });
  } catch (err) {
    return handleError(err, 'Không thể lưu giỏ hàng của tài khoản');
  }
}

/**
 * DELETE /api/cart — Xóa toàn bộ giỏ hàng của tài khoản
 */
export async function DELETE(request: NextRequest) {
  try {
    const user = await resolveLiveUser(request);
    await replaceUserCartItems(user.id, []);
    return NextResponse.json({ success: true, data: [] });
  } catch (err) {
    return handleError(err, 'Không thể xóa giỏ hàng của tài khoản');
  }
}
