import { NextRequest, NextResponse } from 'next/server';
import { createProduct, getCategories } from '@/lib/db';
import { requireAdmin, AuthError } from '@/lib/auth';
import { generateSlug } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    try {
      requireAdmin(request);
    } catch (authErr) {
      if (authErr instanceof AuthError) {
        return NextResponse.json({ success: false, message: authErr.message }, { status: authErr.status });
      }
      throw authErr;
    }

    const body = await request.json();
    const items = body.products;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Danh sách sản phẩm trống hoặc không đúng định dạng' },
        { status: 400 }
      );
    }

    const categories = await getCategories();
    const catMapByName = new Map<string, number>();
    const catMapById = new Map<number, number>();

    categories.forEach((c) => {
      catMapByName.set(c.name.trim().toLowerCase(), c.id);
      catMapById.set(c.id, c.id);
    });

    const defaultCatId = categories[0]?.id || 1;
    let insertedCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const rowNum = i + 2; // Excel row numbering offset

      const name = String(item.name || item['Tên món'] || item['Tên món ăn'] || '').trim();
      if (!name) {
        errors.push(`Dòng ${rowNum}: Thiếu tên món ăn`);
        continue;
      }

      const rawPrice = item.price ?? item['Đơn giá'] ?? item['Giá bán'] ?? item['Giá'];
      const price = Math.max(0, Number(rawPrice) || 0);
      if (price <= 0) {
        errors.push(`Dòng ${rowNum} (${name}): Giá bán không hợp lệ`);
        continue;
      }

      // Determine category ID from categoryId or categoryName
      let categoryId = defaultCatId;
      const rawCat = item.categoryId ?? item.categoryName ?? item['Danh mục'] ?? item['Tên danh mục'];

      if (typeof rawCat === 'number' && catMapById.has(rawCat)) {
        categoryId = rawCat;
      } else if (rawCat) {
        const catStr = String(rawCat).trim().toLowerCase();
        if (catMapByName.has(catStr)) {
          categoryId = catMapByName.get(catStr)!;
        } else {
          // Check if it's a numeric string
          const parsedId = parseInt(catStr);
          if (!isNaN(parsedId) && catMapById.has(parsedId)) {
            categoryId = parsedId;
          }
        }
      }

      const description = String(item.description ?? item['Mô tả'] ?? '').trim();
      const image = String(
        item.image ??
          item['Link ảnh'] ??
          item['Ảnh'] ??
          'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80'
      ).trim();

      const isAvailable =
        item.isAvailable !== undefined
          ? Boolean(item.isAvailable)
          : item['Còn hàng'] !== undefined
          ? String(item['Còn hàng']).toLowerCase() === 'có' ||
            String(item['Còn hàng']).toLowerCase() === 'true' ||
            String(item['Còn hàng']) === '1'
          : true;

      const isFeatured =
        item.isFeatured !== undefined
          ? Boolean(item.isFeatured)
          : item['Nổi bật'] !== undefined
          ? String(item['Nổi bật']).toLowerCase() === 'có' ||
            String(item['Nổi bật']).toLowerCase() === 'true' ||
            String(item['Nổi bật']) === '1'
          : false;

      const prepTime = Number(item.prepTime ?? item['Thời gian chế biến'] ?? item['Thời gian làm'] ?? 15) || 15;
      const slug = item.slug || generateSlug(name) + '-' + Date.now().toString().slice(-4);

      try {
        await createProduct({
          name,
          slug,
          categoryId,
          price,
          description,
          image,
          isAvailable,
          isFeatured,
          rating: 5.0,
          prepTime,
          toppings: [],
        });
        insertedCount++;
      } catch (err: any) {
        errors.push(`Dòng ${rowNum} (${name}): ${err.message || 'Lỗi lưu dữ liệu'}`);
      }
    }

    return NextResponse.json({
      success: true,
      count: insertedCount,
      total: items.length,
      errors: errors.length > 0 ? errors : undefined,
      message: `Đã nhập thành công ${insertedCount}/${items.length} món ăn vào thực đơn`,
    });
  } catch (error: any) {
    console.error('Error importing products:', error);
    return NextResponse.json(
      { success: false, message: 'Đã xảy ra lỗi khi nhập danh sách sản phẩm' },
      { status: 500 }
    );
  }
}
