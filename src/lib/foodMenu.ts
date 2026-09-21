import fs from 'fs';
import path from 'path';
import { Product, ProductTopping } from '@/types';

// Category mapping based on Food.csv data
export const CATEGORY_MAP: Record<number, string> = {
  1: 'Cơm',
  2: 'Đồ ăn vặt & Món nhẹ',
  3: 'Đồ uống & Tráng miệng',
  4: 'Bún & Mì',
  5: 'Phở',
};

// In-memory cache for parsed menu items
let cachedProducts: Product[] | null = null;

/**
 * Robust CSV parser that handles:
 * - UTF-8 BOM
 * - Quoted values containing commas
 * - Escaped double quotes ("")
 * - Multiline strings within quotes
 */
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
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      currentRow.push(currentVal);
      currentVal = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++; // skip CRLF
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

/**
 * Locate the Food.csv file across potential locations (works locally and deployed)
 */
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

/**
 * Load and parse all products from Food.csv
 */
export async function getFoodMenuItems(): Promise<Product[]> {
  if (cachedProducts && cachedProducts.length > 0) {
    return cachedProducts;
  }

  const csvPath = findFoodCsvPath();
  if (!csvPath) {
    console.error('Food.csv file not found in candidates list');
    return [];
  }

  try {
    const content = fs.readFileSync(csvPath, 'utf8');
    const rows = parseCSV(content);

    if (rows.length <= 1) {
      return [];
    }

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
      // Skip test items or empty entries
      if (!rawName || rawName.toLowerCase() === 'test') {
        continue;
      }

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
      });
    }

    cachedProducts = products;
    return products;
  } catch (error) {
    console.error('Failed to parse Food.csv:', error);
    return [];
  }
}

/**
 * Build a concise, high-density food menu prompt context for the Gemma 4 31B model
 */
export async function getFoodMenuSummaryForPrompt(): Promise<string> {
  const products = await getFoodMenuItems();
  if (!products || products.length === 0) {
    return 'Không có dữ liệu thực đơn.';
  }

  const lines: string[] = [
    '=== THỰC ĐƠN QUÁN NOONEE FOOD (TỪ FOOD.CSV) ===',
    `Tổng số món: ${products.length} món`,
    '',
  ];

  // Group by category
  const groups: Record<string, Product[]> = {};
  for (const p of products) {
    const cat = p.categoryName || 'Khác';
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(p);
  }

  for (const [category, items] of Object.entries(groups)) {
    lines.push(`--- [Danh mục: ${category}] ---`);
    for (const item of items) {
      const statusStr = item.isAvailable ? 'Có sẵn' : 'Tạm hết';
      const featuredStr = item.isFeatured ? ' [Bán chạy/Hot]' : '';
      const toppingsStr =
        item.toppings && item.toppings.length > 0
          ? ` | Topping kèm: ${item.toppings.map((t) => `${t.name} (+${t.price.toLocaleString('vi-VN')}đ)`).join(', ')}`
          : '';

      lines.push(
        `- [ID: ${item.id}] ${item.name} (${item.price.toLocaleString('vi-VN')}đ)${featuredStr} - Trạng thái: ${statusStr}. ${item.description}${toppingsStr}`
      );
    }
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Look up products by their IDs
 */
export async function findFoodsByIds(ids: number[]): Promise<Product[]> {
  const products = await getFoodMenuItems();
  const idSet = new Set(ids);
  return products.filter((p) => idSet.has(p.id));
}

/**
 * Search products by keyword (fuzzy fallback)
 */
export async function searchFoodsKeyword(query: string, limit = 5): Promise<Product[]> {
  const products = await getFoodMenuItems();
  const q = query.toLowerCase().trim();
  if (!q) {
    // Return top featured
    return products.filter((p) => p.isAvailable && p.isFeatured).slice(0, limit);
  }

  const scored = products
    .map((p) => {
      let score = 0;
      const name = p.name.toLowerCase();
      const desc = p.description.toLowerCase();
      const cat = (p.categoryName || '').toLowerCase();

      if (name.includes(q)) score += 10;
      if (cat.includes(q)) score += 5;
      if (desc.includes(q)) score += 3;
      if (p.isFeatured) score += 2;
      if (!p.isAvailable) score -= 10;

      // Price matching (e.g. "30k", "40k", "dưới 40k")
      const priceMatch = q.match(/(\d+)\s*k/);
      if (priceMatch) {
        const targetPrice = parseInt(priceMatch[1], 10) * 1000;
        if (q.includes('dưới') || q.includes('<')) {
          if (p.price <= targetPrice) score += 4;
        } else if (Math.abs(p.price - targetPrice) <= 5000) {
          score += 3;
        }
      }

      return { product: p, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((s) => s.product);
}
