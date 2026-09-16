import { NextRequest, NextResponse } from 'next/server';
import { getCategories, createCategory } from '@/lib/db';

export async function GET() {
  try {
    const categories = await getCategories();
    return NextResponse.json({ success: true, data: categories });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.name) {
      return NextResponse.json({ success: false, message: 'Tên danh mục không được trống' }, { status: 400 });
    }

    const slug = body.slug || body.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const newCat = await createCategory({
      name: body.name,
      slug,
      description: body.description,
      icon: body.icon || 'Utensils',
    });

    return NextResponse.json({ success: true, data: newCat }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
