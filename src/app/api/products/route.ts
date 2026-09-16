import { NextRequest, NextResponse } from 'next/server';
import { getProducts, createProduct } from '@/lib/db';
import { requireAdmin, AuthError, authErrorResponse } from '@/lib/auth';
import { generateSlug } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId') ? parseInt(searchParams.get('categoryId')!) : undefined;
    const search = searchParams.get('search') || undefined;
    const isFeatured = searchParams.get('featured') === 'true';
    const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 200;

    const products = await getProducts({ categoryId, search, isFeatured, page, limit });
    return NextResponse.json({ success: true, data: products });
  } catch (error: any) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ success: false, message: 'Đã xảy ra lỗi khi lấy danh sách món ăn' }, { status: 500 });
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
    if (!body.name || !body.price || !body.categoryId) {
      return NextResponse.json({ success: false, message: 'Vui lòng cung cấp đầy đủ tên món, giá và danh mục' }, { status: 400 });
    }

    const slug = body.slug || generateSlug(body.name);
    const newProduct = await createProduct({
      categoryId: Number(body.categoryId),
      name: String(body.name).trim(),
      slug,
      description: body.description ? String(body.description).trim() : '',
      price: Math.max(0, Number(body.price)),
      image: body.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
      isAvailable: body.isAvailable ?? true,
      isFeatured: body.isFeatured ?? false,
      rating: 5.0,
      toppings: body.toppings || [],
    });

    return NextResponse.json({ success: true, data: newProduct }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating product:', error);
    return NextResponse.json({ success: false, message: 'Đã xảy ra lỗi khi tạo món ăn mới' }, { status: 500 });
  }
}
