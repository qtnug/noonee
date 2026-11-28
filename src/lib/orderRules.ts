// Shared business rules for Completed lock, Review eligibility, Table QR auth, and Dine-in pricing.

export function isOrderLocked(status: string | undefined | null): boolean {
  return status === 'Completed' || status === 'Cancelled';
}

export function canUserReviewOrder(
  order: {
    status: string;
    userId?: number | null;
    orderCode: string;
    items?: { productId: number }[];
  },
  productId: number,
  userId?: number | null,
  orderCode?: string | null
): boolean {
  if (order.status !== 'Completed') return false;
  if (!order.items?.some((it) => Number(it.productId) === Number(productId))) return false;
  if (userId) {
    return order.userId === userId && (!orderCode || order.orderCode === orderCode);
  }
  return Boolean(orderCode && order.orderCode === orderCode && !order.userId);
}

export function matchActiveTableByQr<
  T extends { branchId: number; tableNumber: string; qrToken: string; isActive: boolean }
>(tables: T[], branchId: number, tableNumber: string, token?: string | null): T | null {
  if (!token || !token.trim() || !tableNumber || !tableNumber.trim()) return null;
  const cleanNum = tableNumber.trim().toLowerCase();
  const cleanTok = token.trim();
  return (
    tables.find(
      (t) =>
        t.isActive &&
        Number(t.branchId) === Number(branchId) &&
        t.tableNumber.trim().toLowerCase() === cleanNum &&
        t.qrToken === cleanTok
    ) || null
  );
}

export function computeDineInLinePrice(
  product: { price: number; toppings?: { id: string | number; name: string; price: number }[] },
  requestedToppings?: any[] | null
): { unitPrice: number; toppingNames: string[] } {
  let extra = 0;
  const toppingNames: string[] = [];
  if (Array.isArray(requestedToppings) && Array.isArray(product.toppings) && product.toppings.length > 0) {
    const allowed = new Map(product.toppings.map((t) => [String(t.id), t]));
    const seen = new Set<string>();
    for (const req of requestedToppings) {
      const idKey = String(req?.id ?? req);
      if (seen.has(idKey)) continue;
      const found = allowed.get(idKey);
      if (found) {
        seen.add(idKey);
        extra += Math.max(0, Number(found.price) || 0);
        toppingNames.push(found.name);
      }
    }
  }
  return { unitPrice: Math.max(0, Number(product.price) || 0) + extra, toppingNames };
}
