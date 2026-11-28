import { NextRequest, NextResponse } from 'next/server';
import { validateCoupon } from '@/lib/coupons';
import { hasUserPaidFirstVietqr, getUserSpendingStats, getCouponByCode } from '@/lib/db';
import { getMembershipTier } from '@/lib/membership';
import { authenticateRequest } from '@/lib/auth';
import { checkRateLimit, getClientIp, getRateLimitHeaders } from '@/lib/rateLimit';
import { verifyHoneypot, sanitizeText } from '@/lib/security';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    
    // Anti-brute-force rate limiting: max 15 coupon checks per minute per IP
    const rateCheck = checkRateLimit(`coupon_val:${ip}`, 15, 60000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          message: 'Bạn đã kiểm tra mã giảm giá quá nhiều lần. Vui lòng chờ 1 phút trước khi thử lại.',
        },
        {
          status: 429,
          headers: getRateLimitHeaders(rateCheck.limit, rateCheck.remaining, rateCheck.resetMs),
        }
      );
    }

    const body = await request.json();

    // Honeypot bot trap check
    const hpResult = verifyHoneypot(body, { clientIp: ip });
    if (hpResult.isBot) {
      return NextResponse.json(
        { success: false, message: 'Yêu cầu bị từ chối do phát hiện bot tự động.' },
        { status: 400 }
      );
    }

    const { code, subtotal, paymentMethod, cartItems } = body;
    const cleanCode = sanitizeText(code, 50).toUpperCase();

    const authUser = authenticateRequest(request);
    const targetUserId = authUser?.userId ?? null;

    let isNewUser = true;
    let userTier = null;

    if (targetUserId) {
      try {
        const [hasPaid, stats] = await Promise.all([
          hasUserPaidFirstVietqr(targetUserId),
          getUserSpendingStats(targetUserId),
        ]);
        isNewUser = !hasPaid;
        userTier = getMembershipTier(stats.totalSpent).tier;
      } catch (e) {
        console.warn('Could not load user stats for promo validation:', e);
      }
    }

    let dbCoupon = null;
    try {
      dbCoupon = await getCouponByCode(cleanCode);
    } catch (dbErr: any) {
      console.error('Error fetching coupon from DB in validate route:', dbErr);
      return NextResponse.json(
        { success: false, message: dbErr?.message || 'Lỗi kết nối cơ sở dữ liệu khi kiểm tra mã giảm giá' },
        { status: 500 }
      );
    }

    const result = validateCoupon(
      cleanCode,
      Number(subtotal) || 0,
      paymentMethod || 'Sepay',
      isNewUser,
      userTier,
      Array.isArray(cartItems) ? cartItems : undefined,
      dbCoupon ? [dbCoupon] : []
    );

    if (!result.valid) {
      return NextResponse.json(
        {
          success: false,
          message: result.message || 'Mã giảm giá không hợp lệ',
          discountAmount: 0,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Áp dụng mã giảm giá thành công',
      discountAmount: result.discountAmount,
      coupon: result.coupon,
    });
  } catch (error: any) {
    console.error('Coupon validation error:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Đã xảy ra lỗi khi kiểm tra mã giảm giá' },
      { status: 500 }
    );
  }
}
