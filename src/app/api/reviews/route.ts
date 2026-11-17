import { NextRequest, NextResponse } from 'next/server';
import { getReviewsByProduct, upsertReview, hasUserOrderedProduct, getUserReview } from '@/lib/db';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';
import { authenticateRequest, requireAuth, AuthError } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const userIdParam = searchParams.get('userId');
    const orderCode = searchParams.get('orderCode') || undefined;
    
    const authUser = authenticateRequest(request);
    const userId = authUser?.userId;

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

    if (userId) {
      hasOrdered = await hasUserOrderedProduct(prodId, userId);
      userReview = await getUserReview(prodId, userId);
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
    console.error('Error fetching reviews:', error);
    return NextResponse.json({ success: false, message: 'Đã xảy ra lỗi khi lấy đánh giá món ăn' }, { status: 500 });
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

    let authUser;
    try {
      authUser = requireAuth(request);
    } catch (authErr) {
      if (authErr instanceof AuthError) {
        return NextResponse.json({ success: false, message: authErr.message }, { status: authErr.status });
      }
      throw authErr;
    }

    const body = await request.json();
    const { productId, customerName, rating, comment, orderCode } = body;

    if (!productId || !customerName || !rating || !comment) {
      return NextResponse.json(
        { success: false, message: 'Vui lòng điền đầy đủ số sao đánh giá và lời nhận xét' },
        { status: 400 }
      );
    }

    const prodId = parseInt(String(productId));
    const userIdNum = authUser.userId;

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
    return NextResponse.json({ success: false, message: 'Đã xảy ra lỗi khi gửi đánh giá' }, { status: 500 });
  }
}
