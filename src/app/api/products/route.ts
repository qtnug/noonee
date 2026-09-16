import { NextRequest, NextResponse } from 'next/server';
import { getProducts, createProduct } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId') ? parseInt(searchParams.get('categoryId')!) : undefined;
    const search = searchParams.get('search') || undefined;
    const isFeatured = searchParams.get('featured') === 'true';

    const products = await getProducts({ categoryId, search, isFeatured });
    return NextResponse.json({ success: true, data: products });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.name || !body.price || !body.categoryId) {
      return NextResponse.json({ success: false, message: 'Thiếu thông tin bắt buộc' }, { status: 400 });
    }

    const slug = body.slug || body.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const newProduct = await createProduct({
      categoryId: Number(body.categoryId),
      name: body.name,
      slug,
      description: body.description || '',
      price: Number(body.price),
      image: body.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
      isAvailable: body.isAvailable ?? true,
      isFeatured: body.isFeatured ?? false,
      rating: 5.0,
    });

    return NextResponse.json({ success: true, data: newProduct }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
