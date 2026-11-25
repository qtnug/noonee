import { NextRequest, NextResponse } from 'next/server';
import { getUserCartItems, replaceUserCartItems } from '@/lib/db';
import { resolveLiveUser, AuthError } from '@/lib/auth';
import { sanitizeIncomingCart, hydrateCart } from '@/lib/cartServer';
import { normalizeBranchId } from '@/lib/cartUtils';

export const dynamic = 'force-dynamic';

function handleError(err: unknown, fallbackMessage: string) {
  if (err instanceof AuthError) {
    return NextResponse.json({ success: false, message: err.message }, { status: err.status });
  }
  console.error(fallbackMessage, err);
  return NextResponse.json({ success: false, message: fallbackMessage }, { status: 500 });
}

function resolveRequestBranchId(request: NextRequest, bodyBranchId?: unknown): number {
  const queryBranch = new URL(request.url).searchParams.get('branchId');
  return normalizeBranchId(bodyBranchId ?? queryBranch ?? 1);
}

/**
 * GET /api/cart?branchId=1|2 — Lấy giỏ hàng đã lưu của tài khoản theo đúng cơ sở đang chọn
 */
export async function GET(request: NextRequest) {
  try {
    const user = await resolveLiveUser(request);
    const branchId = resolveRequestBranchId(request);
    const stored = await getUserCartItems(user.id, branchId);
    const items = await hydrateCart(stored, branchId);
    return NextResponse.json({ success: true, data: items, branchId });
  } catch (err) {
    return handleError(err, 'Không thể tải giỏ hàng của tài khoản');
  }
}

/**
 * PUT /api/cart — Ghi đè toàn bộ giỏ hàng của tài khoản tại cơ sở branchId
 * Body: { branchId?: 1 | 2, items: [{ productId, quantity, selectedToppings, note }] }
 */
export async function PUT(request: NextRequest) {
  try {
    const user = await resolveLiveUser(request);
    const body = await request.json().catch(() => ({}));
    const branchId = resolveRequestBranchId(request, body?.branchId);
    const sanitized = await sanitizeIncomingCart(body?.items, branchId);
    await replaceUserCartItems(user.id, sanitized, branchId);
    const items = await hydrateCart(sanitized, branchId);
    return NextResponse.json({ success: true, data: items, branchId });
  } catch (err) {
    return handleError(err, 'Không thể lưu giỏ hàng của tài khoản');
  }
}

/**
 * DELETE /api/cart?branchId=1|2 — Xóa toàn bộ giỏ hàng của tài khoản tại cơ sở branchId
 */
export async function DELETE(request: NextRequest) {
  try {
    const user = await resolveLiveUser(request);
    const branchId = resolveRequestBranchId(request);
    await replaceUserCartItems(user.id, [], branchId);
    return NextResponse.json({ success: true, data: [], branchId });
  } catch (err) {
    return handleError(err, 'Không thể xóa giỏ hàng của tài khoản');
  }
}
