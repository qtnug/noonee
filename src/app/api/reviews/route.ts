import { NextRequest, NextResponse } from 'next/server';
import { getReviewsByProduct, upsertReview, hasUserOrderedProduct, getUserReview } from '@/lib/db';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const userIdParam = searchParams.get('userId');
    const orderCode = searchParams.get('orderCode') || undefined;
    const userId = userIdParam ? parseInt(userIdParam) : undefined;

    if (!productId) {
      return NextResponse.json({ success: false, message: 'Thiếu productId' }, { status: 400 });
    }

    const prodId = parseInt(productId);
    const reviews = await getReviewsByProduct(prodId);
    const total = reviews.length;
    const avgRating = total > 0
      ? (reviews.reduce((acc, r) => acc + r.rating, 0) / total).toFixed(1)
      : '5.0';

    let userReview = null;
    let hasOrdered = false;

    if (userId || orderCode) {
      hasOrdered = await hasUserOrderedProduct(prodId, userId, orderCode);
      userReview = await getUserReview(prodId, userId, orderCode);
    }

    return NextResponse.json({
      success: true,
      data: {
        reviews,
        total,
        averageRating: parseFloat(avgRating),
        userReview,
        hasOrdered,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rateCheck = checkRateLimit(`review:${ip}`, 10, 60000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { success: false, message: 'Bạn đang gửi đánh giá quá nhanh. Vui lòng thử lại sau.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { productId, userId, customerName, rating, comment, orderCode } = body;

    if (!productId || !customerName || !rating || !comment) {
      return NextResponse.json(
        { success: false, message: 'Vui lòng điền đầy đủ số sao đánh giá và lời nhận xét' },
        { status: 400 }
      );
    }

    const prodId = parseInt(String(productId));
    const userIdNum = userId ? parseInt(String(userId)) : null;

    // Requirement: User must be logged in or have orderCode
    if (!userIdNum && !orderCode) {
      return NextResponse.json(
        { success: false, message: 'Vui lòng đăng nhập tài khoản trước khi gửi đánh giá món ăn' },
        { status: 401 }
      );
    }

    // Requirement: User MUST have ordered the product
    const hasOrdered = await hasUserOrderedProduct(prodId, userIdNum, orderCode);
    if (!hasOrdered) {
      return NextResponse.json(
        {
          success: false,
          message: 'Bạn chỉ có thể đánh giá món ăn sau khi đã đặt và nhận món này tại NooNee.',
        },
        { status: 403 }
      );
    }

    const numRating = parseInt(String(rating));
    if (numRating < 1 || numRating > 5) {
      return NextResponse.json(
        { success: false, message: 'Số sao đánh giá phải từ 1 đến 5 sao' },
        { status: 400 }
      );
    }

    if (String(comment).trim().length < 5) {
      return NextResponse.json(
        { success: false, message: 'Lời nhận xét phải có tối thiểu 5 ký tự' },
        { status: 400 }
      );
    }

    // Upsert review (updates existing review if already reviewed; inserts if first time)
    const { review, isUpdate } = await upsertReview({
      productId: prodId,
      userId: userIdNum,
      customerName: String(customerName).trim(),
      rating: numRating,
      comment: String(comment).trim(),
      orderCode: orderCode ? String(orderCode).trim() : null,
    });

    return NextResponse.json(
      {
        success: true,
        isUpdate,
        message: isUpdate
          ? 'Đã cập nhật đánh giá món ăn của bạn!'
          : 'Cảm ơn bạn đã gửi đánh giá món ăn!',
        data: review,
      },
      { status: isUpdate ? 200 : 201 }
    );
  } catch (error: any) {
    console.error('Error submitting review:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
