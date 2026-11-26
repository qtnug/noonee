import type { Branch, Coupon, Product } from '../types';

function safeNormalizeBranchId(raw: unknown): number {
  return Number(raw) === 2 ? 2 : 1;
}

function isAvailableAtBranch(
  product: { branchId?: number | null } | null | undefined,
  branchId: number
): boolean {
  if (!product) return false;
  if (product.branchId === null || product.branchId === undefined) return true;
  return Number(product.branchId) === safeNormalizeBranchId(branchId);
}

/**
 * Remove Vietnamese diacritics for flexible keyword search
 */
export function normalizeVietnameseText(text: string): string {
  return (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .trim();
}

/**
 * Filter products by branch availability and/or isAvailable flag
 */
export function filterMenuProducts(
  products: Product[],
  options?: {
    branchId?: number | 'all' | null;
    availableOnly?: boolean;
  }
): Product[] {
  let result = Array.isArray(products) ? [...products] : [];

  if (options?.branchId !== undefined && options?.branchId !== null && options.branchId !== 'all') {
    const safeBranchId = safeNormalizeBranchId(options.branchId);
    result = result.filter((p) => isAvailableAtBranch(p, safeBranchId));
  }

  if (options?.availableOnly) {
    result = result.filter((p) => Boolean(p.isAvailable));
  }

  return result;
}

/**
 * Find available dishes sold exclusively at the other branch (not at activeBranchId)
 */
export function getOtherBranchExclusiveProducts(
  allProducts: Product[],
  otherBranch: Branch
): { otherBranch: Branch; products: Product[] } {
  const products = (allProducts || []).filter(
    (p) => Boolean(p.isAvailable) && Number(p.branchId) === otherBranch.id
  );
  return { otherBranch, products };
}

/**
 * Keep only active, non-expired, non-exhausted coupons
 */
export function filterActiveCoupons(coupons: Coupon[], now = new Date()): Coupon[] {
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return (coupons || []).filter((c) => {
    if (c.isActive === false) return false;
    if (c.usageLimit && c.usageLimit > 0 && (c.usedCount || 0) >= c.usageLimit) return false;
    if (c.expiryDate) {
      const exp = new Date(c.expiryDate).getTime();
      if (!Number.isNaN(exp) && exp < todayStart) return false;
    }
    return true;
  });
}

/**
 * Format active coupons into a compact 1-line string to minimize LLM prompt tokens
 */
export function formatCompactCouponSummary(coupons: Coupon[], limit = 8, now = new Date()): string {
  const active = filterActiveCoupons(coupons, now).slice(0, limit);
  if (active.length === 0) return '';

  const parts = active.map((c) => {
    const valStr =
      c.couponType === 'freeship'
        ? c.discountValue > 0
          ? `giảm ${Math.round(c.discountValue / 1000)}k ship`
          : 'freeship'
        : c.discountType === 'percentage'
          ? `giảm ${c.discountValue}%`
          : `giảm ${Math.round(c.discountValue / 1000)}k`;

    const conditions: string[] = [];
    if (c.minOrderAmount > 0) conditions.push(`đơn≥${Math.round(c.minOrderAmount / 1000)}k`);
    if (c.requiresVietQR) conditions.push('VietQR');
    if (c.forNewUserOnly) conditions.push('đơn đầu');
    if (c.minTier) conditions.push(`hạng ${c.minTier}+`);

    const condStr = conditions.length > 0 ? `,${conditions.join(',')}` : '';
    return `${c.code}(${valStr}${condStr})`;
  });

  return `MÃ GIẢM GIÁ ĐANG ÁP DỤNG: ${parts.join('; ')}`;
}

/**
 * Build a compact, token-efficient prompt context synced to SQL Server & the active branch
 */
export function buildFoodMenuPromptContext(params: {
  branch: Branch;
  availableProducts: Product[];
  otherBranchExclusive?: { otherBranch: Branch; products: Product[] };
  activeCoupons?: Coupon[];
  now?: Date;
}): string {
  const { branch, availableProducts, otherBranchExclusive, activeCoupons, now } = params;

  const lines: string[] = [
    `CƠ SỞ ĐANG PHỤC VỤ: ${branch.name} (${branch.address} | Giờ mở cửa: ${branch.openHours} | Hotline: ${branch.phone})`,
  ];

  if (!availableProducts || availableProducts.length === 0) {
    lines.push('THỰC ĐƠN ĐANG BÁN TẠI CƠ SỞ NÀY: Hiện chưa có món đang mở bán.');
    return lines.join('\n');
  }

  const groups: Record<string, Product[]> = {};
  for (const p of availableProducts) {
    const cat = p.categoryName || 'Khác';
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(p);
  }

  lines.push('THỰC ĐƠN ĐANG BÁN TẠI CƠ SỞ NÀY (ID:Tên[*=bán chạy][★=đặc trưng cơ sở]-Giá):');
  for (const [category, items] of Object.entries(groups)) {
    const sorted = [...items].sort((a, b) => {
      const soldDiff = (b.soldCount || 0) - (a.soldCount || 0);
      if (soldDiff !== 0) return soldDiff;
      const ratingDiff = (b.rating || 0) - (a.rating || 0);
      if (ratingDiff !== 0) return ratingDiff;
      return a.id - b.id;
    });

    const entries = sorted.map((item) => {
      const hot = item.isFeatured ? '*' : '';
      const exclusive = Number(item.branchId) === branch.id ? '★' : '';
      return `${item.id}:${item.name}${hot}${exclusive}-${Math.round(item.price / 1000)}k`;
    });
    lines.push(`[${category}] ${entries.join('; ')}`);
  }

  if (otherBranchExclusive && otherBranchExclusive.products.length > 0) {
    const names = otherBranchExclusive.products.map((p) => p.name).join(', ');
    lines.push(
      `CHỈ PHỤC VỤ TẠI ${otherBranchExclusive.otherBranch.shortName} (KHÔNG có ở cơ sở hiện tại, không được gợi ý ID): ${names}`
    );
  }

  if (activeCoupons && activeCoupons.length > 0) {
    const couponLine = formatCompactCouponSummary(activeCoupons, 8, now);
    if (couponLine) {
      lines.push(couponLine);
    }
  }

  return lines.join('\n');
}

/**
 * Strictly pick recommended products from the current branch's available SQL Server list.
 * Preserves AI ranking order, deduplicates, and blocks any out-of-stock or wrong-branch ID.
 */
export function pickRecommendedProductsForBranch(
  ids: number[],
  branchAvailableProducts: Product[],
  maxCount = 4
): Product[] {
  const byId = new Map<number, Product>();
  for (const p of branchAvailableProducts || []) {
    if (p.isAvailable) {
      byId.set(p.id, p);
    }
  }

  const picked: Product[] = [];
  const seen = new Set<number>();
  for (const rawId of ids || []) {
    const id = Number(rawId);
    if (!Number.isFinite(id) || seen.has(id)) continue;
    const match = byId.get(id);
    if (match) {
      seen.add(id);
      picked.push(match);
      if (picked.length >= maxCount) break;
    }
  }
  return picked;
}

/**
 * Extract mentioned product IDs from reply text when the LLM omits [[RECOMMENDED_FOODS: ...]]
 * Matches longer dish names first so specific dishes beat substring overlaps.
 */
export function extractMentionedProductIds(
  replyText: string,
  branchAvailableProducts: Product[],
  maxCount = 3
): number[] {
  const lowerReply = (replyText || '').toLowerCase();
  const normalizedReply = normalizeVietnameseText(replyText || '');
  if (!lowerReply) return [];

  const sortedByNameLength = [...(branchAvailableProducts || [])]
    .filter((p) => p.isAvailable)
    .sort((a, b) => b.name.length - a.name.length);

  // Match longer dish names first so specific dishes beat substring overlaps,
  // while preserving their actual appearance order in replyText
  const matches: { id: number; pos: number }[] = [];
  let maskedLower = lowerReply;
  let maskedNorm = normalizedReply;

  for (const prod of sortedByNameLength) {
    const lowerName = prod.name.toLowerCase();
    const normName = normalizeVietnameseText(prod.name);
    let pos = maskedLower.indexOf(lowerName);
    if (pos !== -1) {
      matches.push({ id: prod.id, pos });
      maskedLower =
        maskedLower.slice(0, pos) +
        ' '.repeat(lowerName.length) +
        maskedLower.slice(pos + lowerName.length);
      continue;
    }
    if (normName.length >= 4) {
      pos = maskedNorm.indexOf(normName);
      if (pos !== -1) {
        matches.push({ id: prod.id, pos });
        maskedNorm =
          maskedNorm.slice(0, pos) +
          ' '.repeat(normName.length) +
          maskedNorm.slice(pos + normName.length);
      }
    }
  }

  return matches
    .sort((a, b) => a.pos - b.pos)
    .slice(0, maxCount)
    .map((m) => m.id);
}

/**
 * Branch-scoped keyword search fallback (supports accented & unaccented Vietnamese, price hints,
 * branch-exclusive queries, and real SQL Server soldCount/isFeatured ranking)
 */
export function scoreAndSearchProducts(
  branchAvailableProducts: Product[],
  query: string,
  limit = 5
): Product[] {
  const available = (branchAvailableProducts || []).filter((p) => p.isAvailable);
  if (available.length === 0) return [];

  const qRaw = (query || '').toLowerCase().trim();
  const qNorm = normalizeVietnameseText(qRaw);

  const rankDefault = () =>
    [...available]
      .sort((a, b) => {
        if (a.isFeatured !== b.isFeatured) return a.isFeatured ? -1 : 1;
        const soldDiff = (b.soldCount || 0) - (a.soldCount || 0);
        if (soldDiff !== 0) return soldDiff;
        return (b.rating || 0) - (a.rating || 0);
      })
      .slice(0, limit);

  if (!qNorm) {
    return rankDefault();
  }

  const wantsExclusive =
    qNorm.includes('dac trung') ||
    qNorm.includes('dac san') ||
    qNorm.includes('rieng') ||
    qNorm.includes('signature') ||
    qNorm.includes('co so nay');
  const wantsBestSeller =
    qNorm.includes('ban chay') ||
    qNorm.includes('best seller') ||
    qNorm.includes('noi bat') ||
    qNorm.includes('hot');

  const queryTokens = qNorm
    .split(/[^a-z0-9]+/)
    .filter(
      (t) =>
        t.length >= 2 &&
        !['mon', 'nao', 'cho', 'minh', 'toi', 'muon', 'can', 'co', 'khong', 'gi'].includes(t)
    );

  const priceMatch = qNorm.match(/(\d+)\s*k/);
  const targetPrice = priceMatch ? parseInt(priceMatch[1], 10) * 1000 : null;
  const wantsUnderPrice = qNorm.includes('duoi') || qNorm.includes('<') || qNorm.includes('re');

  const scored = available
    .map((p) => {
      let score = 0;
      const nameNorm = normalizeVietnameseText(p.name);
      const descNorm = normalizeVietnameseText(p.description || '');
      const catNorm = normalizeVietnameseText(p.categoryName || '');

      if (nameNorm.includes(qNorm)) score += 12;
      if (catNorm.includes(qNorm)) score += 6;
      if (descNorm.includes(qNorm)) score += 4;

      for (const tok of queryTokens) {
        if (nameNorm.includes(tok)) score += 5;
        else if (catNorm.includes(tok)) score += 3;
        else if (descNorm.includes(tok)) score += 1.5;
      }

      if (wantsExclusive && p.branchId !== null && p.branchId !== undefined) {
        score += 10;
      }
      if (wantsBestSeller && p.isFeatured) {
        score += 8;
      }

      if (targetPrice !== null) {
        if (wantsUnderPrice) {
          if (p.price <= targetPrice) score += 5;
        } else if (Math.abs(p.price - targetPrice) <= 5000) {
          score += 4;
        }
      }

      if (score > 0) {
        if (p.isFeatured) score += 1.5;
        score += Math.min(2, (p.soldCount || 0) / 25);
      }

      return { product: p, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return (b.product.soldCount || 0) - (a.product.soldCount || 0);
    });

  if (scored.length === 0) {
    return rankDefault();
  }

  return scored.slice(0, limit).map((s) => s.product);
}
