import { NextRequest, NextResponse } from 'next/server';
import { blacklistIp, getClientIp } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

async function handleHoneypotTrigger(request: NextRequest) {
  const ip = getClientIp(request);
  const userAgent = request.headers.get('user-agent') || 'Unknown';

  console.warn(
    `🚨 [SECURITY HONEYPOT TRAP TRIGGERED] Suspicious bot or crawler fell into the trap! IP: ${ip} | User-Agent: ${userAgent}`
  );

  // Blacklist this IP for 24 hours
  blacklistIp(
    ip,
    `Đã truy cập liên kết bẫy chống cào dữ liệu (Honeypot Trap). User-Agent: ${userAgent.slice(0, 100)}`,
    24 * 60 * 60 * 1000
  );

  return NextResponse.json(
    {
      success: false,
      message: 'Hệ thống bảo mật NooNee đã ghi nhận hoạt động bất thường từ địa chỉ IP của bạn.',
      botTrapDetected: true,
    },
    {
      status: 403,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    }
  );
}

export async function GET(request: NextRequest) {
  return handleHoneypotTrigger(request);
}

export async function POST(request: NextRequest) {
  return handleHoneypotTrigger(request);
}

export async function HEAD(request: NextRequest) {
  return handleHoneypotTrigger(request);
}
