import { NextRequest, NextResponse } from 'next/server';
import { getUserCartItems, replaceUserCartItems } from '@/lib/db';
import { resolveLiveUser, AuthError } from '@/lib/auth';
import { sanitizeIncomingCart, mergeStoredCarts, hydrateCart } from '@/lib/cartServer';

export const dynamic = 'force-dynamic';

/**
 * POST /api/cart/merge — Gộp giỏ hàng khách vãng lai (localStorage) vào giỏ hàng của tài khoản
 * Body: { items: [{ productId, quantity, selectedToppings, note }] }
 */
export async function POST(request: NextRequest) {
  try {
    const user = await resolveLiveUser(request);
    const body = await request.json().catch(() => ({}));

    const guestItems = await sanitizeIncomingCart(body?.items);
    const serverItems = await getUserCartItems(user.id);
    const merged = mergeStoredCarts(serverItems, guestItems);

    await replaceUserCartItems(user.id, merged);
    const items = await hydrateCart(merged);

    return NextResponse.json({
      success: true,
      data: items,
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
