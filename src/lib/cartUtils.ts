import type { CartItem, Product, ProductTopping } from '../types';

export const MAX_CART_ITEM_QUANTITY = 99;

/**
 * Chuẩn hóa ID cơ sở hợp lệ (1 = CS1 120 Yên Lãng, 2 = CS2 269 Cầu Giấy)
 */
export function normalizeBranchId(raw: unknown): number {
  return Number(raw) === 2 ? 2 : 1;
}

/**
 * Kiểm tra món ăn có được phục vụ tại cơ sở branchId hay không
 * (branchId = null/undefined => phục vụ ở cả 2 cơ sở)
 */
export function isProductAvailableAtBranch(
  product: { branchId?: number | null } | null | undefined,
  branchId: number
): boolean {
  if (!product) return false;
  if (product.branchId === null || product.branchId === undefined) return true;
  return Number(product.branchId) === normalizeBranchId(branchId);
}

/**
 * Tạo khóa định danh dòng giỏ hàng: cùng món + cùng topping (không phân biệt thứ tự) + cùng ghi chú
 */
export function generateCartItemId(
  productId: number,
  toppings: ProductTopping[] = [],
  note = ''
): string {
  const topKey = (toppings || [])
    .map((t) => String(t.id))
    .sort()
    .join('-');
  const noteKey = (note || '').trim().toLowerCase().replace(/\s+/g, '_');
  return `item_${productId}_${topKey || 'base'}_${noteKey || 'none'}`;
}

/**
 * Đơn giá món gồm giá gốc + tổng giá topping
 */
export function calculateItemPrice(basePrice: number, toppings: ProductTopping[] = []): number {
  const toppingsPrice = (toppings || []).reduce((sum, t) => sum + (Number(t.price) || 0), 0);
  return (Number(basePrice) || 0) + toppingsPrice;
}

/**
 * Chuẩn hóa một dòng giỏ hàng bất kỳ (từ localStorage / API) về đúng cấu trúc CartItem
 */
export function normalizeCartItem(raw: any): CartItem | null {
  if (!raw || !raw.product || raw.product.id === undefined || raw.product.id === null) {
    return null;
  }

  const product: Product = raw.product;
  const toppings: ProductTopping[] = Array.isArray(raw.selectedToppings)
    ? raw.selectedToppings
        .filter((t: any) => t && t.id !== undefined && t.name)
        .map((t: any) => ({ id: t.id, name: String(t.name), price: Number(t.price) || 0 }))
    : [];
  const note = typeof raw.note === 'string' ? raw.note.trim().slice(0, 500) : '';
  const quantity = Math.max(
    1,
    Math.min(MAX_CART_ITEM_QUANTITY, Math.floor(Number(raw.quantity) || 1))
  );

  return {
    cartItemId: generateCartItemId(Number(product.id), toppings, note),
    product,
    quantity,
    selectedToppings: toppings,
    note,
    itemPrice: calculateItemPrice(product.price, toppings),
  };
}
