import { NextRequest, NextResponse } from 'next/server';
import { getProducts, createProduct } from '@/lib/db';
import { requireAdmin, AuthError, authErrorResponse } from '@/lib/auth';
import { generateSlug } from '@/lib/utils';
import { checkRateLimit, getClientIp, getRateLimitHeaders } from '@/lib/rateLimit';
import { sanitizeText } from '@/lib/security';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    
    // Anti-scraping rate limiter: max 80 requests/minute per IP
    const rateCheck = checkRateLimit(`products_get:${ip}`, 80, 60000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { success: false, message: 'Tần suất tải thực đơn vượt quá ngưỡng cho phép.' },
        { status: 429, headers: getRateLimitHeaders(rateCheck.limit, rateCheck.remaining, rateCheck.resetMs) }
      );
    }

    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId') ? parseInt(searchParams.get('categoryId')!) : undefined;
    const rawSearch = searchParams.get('search') || undefined;
    const search = rawSearch ? sanitizeText(rawSearch, 100) : undefined;
    const isFeatured = searchParams.get('featured') === 'true';
    const branchParam = searchParams.get('branchId') || searchParams.get('branch');
    const branchId = branchParam === 'all' ? 'all' : branchParam ? parseInt(branchParam) : undefined;
    const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : undefined;
    const limit = searchParams.get('limit') ? Math.min(200, Math.max(1, parseInt(searchParams.get('limit')!))) : 200;

    const products = await getProducts({ categoryId, search, isFeatured, branchId, page, limit });
    return NextResponse.json(
      { success: true, data: products },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
        },
      }
    );
  } catch (error: any) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ success: false, message: 'Đã xảy ra lỗi khi lấy danh sách món ăn' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rateCheck = checkRateLimit(`products_post:${ip}`, 20, 60000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { success: false, message: 'Thao tác quá nhanh. Vui lòng chờ giây lát.' },
        { status: 429, headers: getRateLimitHeaders(rateCheck.limit, rateCheck.remaining, rateCheck.resetMs) }
      );
    }

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

    const cleanName = sanitizeText(body.name, 150);
    const cleanDesc = sanitizeText(body.description || '', 1000);
    const slug = body.slug || generateSlug(cleanName);
    const newProduct = await createProduct({
      categoryId: Number(body.categoryId),
      name: cleanName,
      slug,
      description: cleanDesc,
      price: Math.max(0, Number(body.price)),
      image: body.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
      isAvailable: body.isAvailable ?? true,
      isFeatured: body.isFeatured ?? false,
      rating: 5.0,
      prepTime: body.prepTime ? Number(body.prepTime) : 15,
      branchId: body.branchId ? Number(body.branchId) : null,
      toppings: body.toppings || [],
    });

    return NextResponse.json({ success: true, data: newProduct }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating product:', error);
    return NextResponse.json({ success: false, message: 'Đã xảy ra lỗi khi tạo món ăn mới' }, { status: 500 });
  }
}
