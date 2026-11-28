import { NextRequest, NextResponse } from 'next/server';
import { getCategories, createCategory, ensureComboCategory } from '@/lib/db';
import { requireAdmin, AuthError } from '@/lib/auth';
import { generateSlug } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await ensureComboCategory();
    const categories = await getCategories();
    return NextResponse.json(
      { success: true, data: categories },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        },
      }
    );
  } catch (error: any) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ success: false, message: 'Đã xảy ra lỗi khi tải danh mục' }, { status: 500 });
  }
}

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
    if (!body.name || !String(body.name).trim()) {
      return NextResponse.json({ success: false, message: 'Tên danh mục không được để trống' }, { status: 400 });
    }

    const slug = body.slug || generateSlug(body.name);
    const newCat = await createCategory({
      name: String(body.name).trim(),
      slug,
      description: body.description ? String(body.description).trim() : '',
      icon: body.icon || 'Utensils',
    });

    return NextResponse.json({ success: true, data: newCat }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating category:', error);
    return NextResponse.json({ success: false, message: 'Đã xảy ra lỗi khi tạo danh mục mới' }, { status: 500 });
  }
}
