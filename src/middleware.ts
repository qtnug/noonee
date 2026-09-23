import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getClientIp, isIpBlacklisted, blacklistIp, getRateLimitHeaders } from '@/lib/rateLimit';
import { inspectThreat, isMaliciousTool } from '@/lib/security';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Ignore Next.js static files and assets
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/fonts') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.match(/\.(png|jpg|jpeg|gif|webp|svg|ico)$/)
  ) {
    return NextResponse.next();
  }

  const ip = getClientIp(request);
  const userAgent = request.headers.get('user-agent') || '';

  // 1. IP Blacklist Defense (Blocks bots caught in honeypot or repeat attackers)
  const blacklistStatus = isIpBlacklisted(ip);
  if (blacklistStatus.blacklisted) {
    if (pathname.startsWith('/api')) {
      return NextResponse.json(
        {
          success: false,
          message: 'Địa chỉ IP của bạn tạm thời bị khóa do phát hiện hành vi quét tự động hoặc vi phạm bảo mật.',
          reason: blacklistStatus.reason,
          code: 'IP_BLOCKED',
        },
        { status: 403 }
      );
    }

    return new NextResponse(
      `<!DOCTYPE html><html><head><meta charset="utf-8"><title>403 - Truy cập bị hạn chế</title></head><body style="font-family:sans-serif;text-align:center;padding:50px;"><h2>403 - Quyền truy cập bị tạm khóa</h2><p>Hệ thống phát hiện hoạt động bất thường từ địa chỉ mạng của bạn. Vui lòng liên hệ quản trị viên NooNee nếu bạn cho rằng đây là sự nhầm lẫn.</p></body></html>`,
      {
        status: 403,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      }
    );
  }

  // 2. WAF URL & Query Threat Inspection (SQLi, Path Traversal, XSS in URLs)
  const threatCheck = inspectThreat(request.url);
  if (threatCheck.dangerous) {
    console.warn(`[WAF BLOCKED] Malicious pattern (${threatCheck.type}) detected from IP: ${ip} | URL: ${request.url}`);
    return NextResponse.json(
      {
        success: false,
        message: 'Yêu cầu bị từ chối do chứa ký tự hoặc cú pháp không an toàn.',
        code: 'MALICIOUS_REQUEST',
      },
      { status: 400 }
    );
  }

  // 3. Known exploit tools & scanner agents block
  if (isMaliciousTool(userAgent)) {
    console.warn(`[WAF AGENT BLOCK] Known exploit tool detected: ${userAgent} from IP: ${ip}`);
    blacklistIp(ip, `Sử dụng công cụ tấn công hoặc rà quét lỗ hổng (${userAgent.slice(0, 50)})`, 24 * 60 * 60 * 1000);
    return NextResponse.json(
      {
        success: false,
        message: 'Truy cập bị từ chối do User-Agent không được phép.',
        code: 'BAD_USER_AGENT',
      },
      { status: 403 }
    );
  }

  // 4. API Security & Rate Limiting
  if (pathname.startsWith('/api')) {
    // Exempt honeypot trap itself from rate limit so bots can always trigger and get banned
    if (pathname === '/api/honeypot-trap') {
      return NextResponse.next();
    }

    // Global Rate Limit on API routes: 120 req/minute per IP
    const rateCheck = checkRateLimit(`global_api:${ip}`, 120, 60000);
    const rateHeaders = getRateLimitHeaders(rateCheck.limit, rateCheck.remaining, rateCheck.resetMs);

    if (!rateCheck.allowed) {
      console.warn(`[API RATE LIMIT] IP exceeded global threshold: ${ip} on ${pathname}`);
      return NextResponse.json(
        {
          success: false,
          message: 'Bạn đang gửi quá nhiều yêu cầu đến máy chủ. Vui lòng thử lại sau ít giây.',
          code: 'RATE_LIMIT_EXCEEDED',
        },
        {
          status: 429,
          headers: rateHeaders,
        }
      );
    }

    // Proceed and inject rate-limit and security headers
    const response = NextResponse.next();
    Object.entries(rateHeaders).forEach(([k, v]) => response.headers.set(k, v));
    applySecurityHeaders(response);
    return response;
  }

  // Web page request: apply security headers
  const response = NextResponse.next();
  applySecurityHeaders(response);
  return response;
}

/**
 * Apply comprehensive security headers
 */
function applySecurityHeaders(res: NextResponse) {
  res.headers.set('X-Frame-Options', 'SAMEORIGIN');
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)');
  res.headers.set('X-XSS-Protection', '1; mode=block');
  res.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for static files:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
