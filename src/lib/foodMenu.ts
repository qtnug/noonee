import fs from 'fs';
import path from 'path';
import type { Branch, Coupon, Product, ProductTopping } from '@/types';
import { getAllProductsCached, getCoupons } from '@/lib/db';
import { BRANCHES, getBranchById } from '@/lib/branches';
import { normalizeBranchId } from '@/lib/cartUtils';
import {
  buildFoodMenuPromptContext,
  filterActiveCoupons,
  filterMenuProducts,
  getOtherBranchExclusiveProducts,
  pickRecommendedProductsForBranch,
  scoreAndSearchProducts,
} from '@/lib/aiMenuUtils';

// Category mapping fallback based on Food.csv data
export const CATEGORY_MAP: Record<number, string> = {
  1: 'Cơm',
  2: 'Đồ ăn vặt & Món nhẹ',
  3: 'Đồ uống & Tráng miệng',
  4: 'Bún & Mì',
  5: 'Phở',
};

// In-memory fallback cache for parsed CSV items (used ONLY if SQL Server is unreachable)
let cachedCsvProducts: Product[] | null = null;

// Short-lived cache for active coupons so AI Chat doesn't hit SQL Server on every single message
let cachedCoupons: { data: Coupon[]; timestamp: number } | null = null;
const COUPON_CACHE_TTL_MS = 60000;

function parseCSV(text: string): string[][] {
  const cleanText = text.replace(/^\uFEFF/, '').trim();
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentVal = '';
  let inQuotes = false;

  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i];
    const nextChar = cleanText[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentVal += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      currentRow.push(currentVal);
      currentVal = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      currentRow.push(currentVal);
      if (currentRow.length > 1 || (currentRow.length === 1 && currentRow[0] !== '')) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentVal = '';
    } else {
      currentVal += char;
    }
  }

  if (currentVal || currentRow.length > 0) {
    currentRow.push(currentVal);
    rows.push(currentRow);
  }

  return rows;
}

function findFoodCsvPath(): string | null {
  const candidates = [
    path.join(process.cwd(), 'Food.csv'),
    path.join(process.cwd(), 'food.csv'),
    path.join(process.cwd(), 'public', 'Food.csv'),
    path.join(process.cwd(), 'public', 'food.csv'),
    path.join(__dirname, '..', '..', 'Food.csv'),
    path.join(__dirname, '..', '..', 'food.csv'),
  ];

  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) {
        return p;
      }
    } catch {
      // Continue searching
    }
  }

  return null;
}

function loadFoodCsvFallback(): Product[] {
  if (cachedCsvProducts && cachedCsvProducts.length > 0) {
    return cachedCsvProducts;
  }

  const csvPath = findFoodCsvPath();
  if (!csvPath) {
    return [];
  }

  try {
    const content = fs.readFileSync(csvPath, 'utf8');
    const rows = parseCSV(content);
    if (rows.length <= 1) return [];

    const header = rows[0].map((h) => h.trim().toLowerCase());
    const idIdx = header.indexOf('id');
    const catIdIdx = header.indexOf('categoryid');
    const nameIdx = header.indexOf('name');
    const slugIdx = header.indexOf('slug');
    const descIdx = header.indexOf('description');
    const priceIdx = header.indexOf('price');
    const imageIdx = header.indexOf('image');
    const availIdx = header.indexOf('isavailable');
    const featIdx = header.indexOf('isfeatured');
    const ratingIdx = header.indexOf('rating');
    const toppingsIdx = header.indexOf('toppings');
    const prepTimeIdx = header.indexOf('preptime');

    const products: Product[] = [];

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;

      const rawName = (row[nameIdx] || '').trim();
      if (!rawName || rawName.toLowerCase() === 'test') continue;

      const id = parseInt(row[idIdx] || String(i), 10);
      const categoryId = parseInt(row[catIdIdx] || '1', 10);
      const categoryName = CATEGORY_MAP[categoryId] || 'Món ăn';
      const slug = (row[slugIdx] || '').trim() || `mon-an-${id}`;
      const description = (row[descIdx] || '').trim();
      const price = parseFloat(row[priceIdx] || '0') || 0;
      const image =
        (row[imageIdx] || '').trim() ||
        'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80';
      const isAvailable = row[availIdx] === '1' || row[availIdx]?.toLowerCase() === 'true';
      const isFeatured = row[featIdx] === '1' || row[featIdx]?.toLowerCase() === 'true';
      const rating = parseFloat(row[ratingIdx] || '5.0') || 5.0;
      const prepTime = parseInt(row[prepTimeIdx] || '15', 10) || 15;

      let toppings: ProductTopping[] = [];
      const rawToppings = row[toppingsIdx];
      if (rawToppings && rawToppings.trim().startsWith('[')) {
        try {
          toppings = JSON.parse(rawToppings);
        } catch {
          toppings = [];
        }
      }

      products.push({
        id,
        categoryId,
        categoryName,
        name: rawName,
        slug,
        description,
        price,
        image,
        isAvailable,
        isFeatured,
        rating,
        prepTime,
        toppings,
        branchId: null,
      });
    }

    cachedCsvProducts = products;
    return products;
  } catch (error) {
    console.error('Failed to parse Food.csv fallback:', error);
    return [];
  }
}

/**
 * Load all products from SQL Server (primary, synced with Admin & real soldCount/ratings/branches),
 * falling back to Food.csv only if SQL Server returns no data.
 */
async function loadAllMenuProductsWithSource(): Promise<{
  products: Product[];
  source: 'sql' | 'csv';
}> {
  try {
    const dbProducts = await getAllProductsCached();
    if (Array.isArray(dbProducts) && dbProducts.length > 0) {
      return { products: dbProducts, source: 'sql' };
    }
  } catch (error) {
    console.warn('[NooNee AI] SQL Server menu load failed, falling back to Food.csv:', error);
  }

  return { products: loadFoodCsvFallback(), source: 'csv' };
}

async function getActiveCouponsSafe(): Promise<Coupon[]> {
  const now = Date.now();
  if (cachedCoupons && now - cachedCoupons.timestamp < COUPON_CACHE_TTL_MS) {
    return cachedCoupons.data;
  }

  try {
    const coupons = await getCoupons({ activeOnly: true });
    const active = filterActiveCoupons(coupons);
    cachedCoupons = { data: active, timestamp: now };
    return active;
  } catch {
    return cachedCoupons?.data || [];
  }
}

/**
 * Load menu items from SQL Server (with optional branchId & availableOnly filters)
 */
export async function getFoodMenuItems(options?: {
  branchId?: number | 'all' | null;
  availableOnly?: boolean;
}): Promise<Product[]> {
  const { products } = await loadAllMenuProductsWithSource();
  return filterMenuProducts(products, options);
}

export interface ChatbotMenuBundle {
  branch: Branch;
  branchId: number;
  availableProducts: Product[];
  otherBranchExclusive: { otherBranch: Branch; products: Product[] };
  activeCoupons: Coupon[];
  promptContext: string;
  source: 'sql' | 'csv';
}

/**
 * Load complete branch-synced SQL Server bundle for AI Chatbot in one step
 */
export async function getChatbotMenuBundle(branchId?: number | null): Promise<ChatbotMenuBundle> {
  const safeBranchId = normalizeBranchId(branchId);
  const branch = getBranchById(safeBranchId);

  const [{ products: allProducts, source }, activeCoupons] = await Promise.all([
    loadAllMenuProductsWithSource(),
    getActiveCouponsSafe(),
  ]);

  const availableProducts = filterMenuProducts(allProducts, {
    branchId: safeBranchId,
    availableOnly: true,
  });
  const otherBranch =
    BRANCHES.find((b) => b.id !== safeBranchId) || getBranchById(safeBranchId === 1 ? 2 : 1);
  const otherBranchExclusive = getOtherBranchExclusiveProducts(allProducts, otherBranch);
  const promptContext = buildFoodMenuPromptContext({
    branch,
    availableProducts,
    otherBranchExclusive,
    activeCoupons,
  });

  return {
    branch,
    branchId: safeBranchId,
    availableProducts,
    otherBranchExclusive,
    activeCoupons,
    promptContext,
    source,
  };
}

/**
 * Build a compact, token-efficient food menu prompt context synced to SQL Server & branch
 */
export async function getFoodMenuSummaryForPrompt(branchId?: number | null): Promise<string> {
  const bundle = await getChatbotMenuBundle(branchId);
  return bundle.promptContext;
}

/**
 * Look up available products by their IDs (filtered to the selected branch)
 */
export async function findFoodsByIds(
  ids: number[],
  branchId?: number | null
): Promise<Product[]> {
  const products = await getFoodMenuItems({
    branchId: branchId ?? undefined,
    availableOnly: true,
  });
  return pickRecommendedProductsForBranch(ids, products, Math.max(4, ids.length));
}

/**
 * Search available products by keyword (fuzzy fallback, synced with SQL Server & branch)
 */
export async function searchFoodsKeyword(
  query: string,
  limit = 5,
  branchId?: number | null
): Promise<Product[]> {
  const products = await getFoodMenuItems({
    branchId: branchId ?? undefined,
    availableOnly: true,
  });
  return scoreAndSearchProducts(products, query, limit);
}
