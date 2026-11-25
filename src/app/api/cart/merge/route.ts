import { NextRequest, NextResponse } from 'next/server';
import { getUserCartItems, replaceUserCartItems } from '@/lib/db';
import { resolveLiveUser, AuthError } from '@/lib/auth';
import { sanitizeIncomingCart, mergeStoredCarts, hydrateCart } from '@/lib/cartServer';
import { normalizeBranchId } from '@/lib/cartUtils';

export const dynamic = 'force-dynamic';

/**
 * POST /api/cart/merge — Gộp giỏ hàng khách vãng lai vào giỏ hàng của tài khoản tại cơ sở branchId
 * Body: { branchId?: 1 | 2, items: [{ productId, quantity, selectedToppings, note }] }
 */
export async function POST(request: NextRequest) {
  try {
    const user = await resolveLiveUser(request);
    const body = await request.json().catch(() => ({}));
    const queryBranch = new URL(request.url).searchParams.get('branchId');
    const branchId = normalizeBranchId(body?.branchId ?? queryBranch ?? 1);

    const guestItems = await sanitizeIncomingCart(body?.items, branchId);
    const serverItems = await getUserCartItems(user.id, branchId);
    const merged = mergeStoredCarts(serverItems, guestItems);

    await replaceUserCartItems(user.id, merged, branchId);
    const items = await hydrateCart(merged, branchId);

    return NextResponse.json({
      success: true,
      data: items,
      branchId,
      meta: { mergedCount: guestItems.length },
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ success: false, message: err.message }, { status: err.status });
    }
    console.error('POST /api/cart/merge error:', err);
    return NextResponse.json(
      { success: false, message: 'Không thể gộp giỏ hàng vào tài khoản' },
      { status: 500 }
    );
  }
}
