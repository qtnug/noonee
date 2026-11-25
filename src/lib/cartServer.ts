import type { CartItem, Product, ProductTopping } from '@/types';
import { getAllProductsCached, StoredCartItem } from '@/lib/db';
import {
  generateCartItemId,
  calculateItemPrice,
  isProductAvailableAtBranch,
  normalizeBranchId,
} from '@/lib/cartUtils';

export const MAX_CART_LINES = 100;
export const MAX_ITEM_QUANTITY = 99;

/**
 * Chuẩn hóa danh sách món client gửi lên thành StoredCartItem hợp lệ cho đúng cơ sở (branchId).
 * - Chỉ nhận món còn tồn tại, đang mở bán VÀ có phục vụ tại cơ sở branchId
 * - Topping chỉ giữ lại những topping thuộc món đó (lấy tên/giá từ DB, bỏ qua giá client gửi)
 * - Gộp các dòng trùng khóa (cùng món + topping + ghi chú), giới hạn số lượng 1..99
 */
export async function sanitizeIncomingCart(
  rawItems: unknown,
  rawBranchId: unknown = 1
): Promise<StoredCartItem[]> {
  if (!Array.isArray(rawItems)) return [];
  const branchId = normalizeBranchId(rawBranchId);
  const products = await getAllProductsCached();
  const productMap = new Map<number, Product>(products.map((p) => [Number(p.id), p]));
  const merged = new Map<string, StoredCartItem>();

  for (const raw of rawItems.slice(0, MAX_CART_LINES)) {
    if (!raw || typeof raw !== 'object') continue;
    const r = raw as any;
    const productId = Number(r.productId ?? r.product?.id);
    const product = productMap.get(productId);
    if (!product || !product.isAvailable || !isProductAvailableAtBranch(product, branchId)) {
      continue;
    }

    const toppings = pickValidToppings(product, r.selectedToppings);
    const note = typeof r.note === 'string' ? r.note.trim().slice(0, 500) : '';
    const quantity = clampQuantity(r.quantity);
    const cartItemId = generateCartItemId(productId, toppings, note);

    const existing = merged.get(cartItemId);
    if (existing) {
      existing.quantity = Math.min(MAX_ITEM_QUANTITY, existing.quantity + quantity);
    } else {
      merged.set(cartItemId, { cartItemId, productId, quantity, selectedToppings: toppings, note });
    }
  }

  return Array.from(merged.values());
}

/**
 * Gộp giỏ hàng đã lưu của tài khoản với giỏ hàng khách vãng lai (cộng dồn số lượng nếu trùng khóa)
 */
export function mergeStoredCarts(
  serverItems: StoredCartItem[],
  guestItems: StoredCartItem[]
): StoredCartItem[] {
  const map = new Map<string, StoredCartItem>();
  for (const item of [...serverItems, ...guestItems]) {
    const existing = map.get(item.cartItemId);
    if (existing) {
      existing.quantity = Math.min(MAX_ITEM_QUANTITY, existing.quantity + item.quantity);
    } else {
      map.set(item.cartItemId, { ...item, selectedToppings: [...(item.selectedToppings || [])] });
    }
  }
  return Array.from(map.values()).slice(0, MAX_CART_LINES);
}

/**
 * Chuyển dữ liệu giỏ hàng lưu trong DB thành CartItem đầy đủ thông tin món cho đúng cơ sở branchId
 */
export async function hydrateCart(
  stored: StoredCartItem[],
  rawBranchId: unknown = 1
): Promise<CartItem[]> {
  const branchId = normalizeBranchId(rawBranchId);
  const products = await getAllProductsCached();
  const productMap = new Map<number, Product>(products.map((p) => [Number(p.id), p]));
  const result: CartItem[] = [];

  for (const item of stored) {
    const product = productMap.get(Number(item.productId));
    if (!product || !product.isAvailable || !isProductAvailableAtBranch(product, branchId)) {
      continue;
    }
    const toppings = pickValidToppings(product, item.selectedToppings);
    result.push({
      cartItemId: generateCartItemId(product.id, toppings, item.note),
      product,
      quantity: clampQuantity(item.quantity),
      selectedToppings: toppings,
      note: item.note || '',
      itemPrice: calculateItemPrice(product.price, toppings),
    });
  }

  return result;
}

function pickValidToppings(product: Product, rawToppings: unknown): ProductTopping[] {
  if (!Array.isArray(rawToppings) || rawToppings.length === 0) return [];
  const available = Array.isArray(product.toppings) ? product.toppings : [];
  const picked: ProductTopping[] = [];
  const seen = new Set<string>();

  for (const t of rawToppings) {
    const id = String((t as any)?.id ?? '');
    if (!id || seen.has(id)) continue;
    const match = available.find((a) => String(a.id) === id);
    if (!match) continue;
    seen.add(id);
    picked.push({ id: match.id, name: match.name, price: Number(match.price) || 0 });
  }

  return picked;
}

function clampQuantity(raw: unknown): number {
  const n = Math.floor(Number(raw) || 1);
  return Math.max(1, Math.min(MAX_ITEM_QUANTITY, n));
}
