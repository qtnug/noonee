import { NextResponse } from 'next/server';
import { checkDatabaseHealth } from '@/lib/db';

export async function GET() {
  try {
    const dbHealth = await checkDatabaseHealth();
    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: dbHealth,
      sepay: {
        configured: Boolean(process.env.SEPAY_API_TOKEN && process.env.SEPAY_BANK_ACCOUNT),
        bank: process.env.SEPAY_BANK_NAME || 'Not configured',
        mode: process.env.NEXT_PUBLIC_ENABLE_PAYMENT_SIMULATION === 'true' ? 'Sandbox / Simulation' : 'Live'
      }
    });
  } catch (error: any) {
    console.error('Health check error:', error);
    return NextResponse.json({ status: 'error', message: 'Hệ thống đang gặp sự cố' }, { status: 500 });
  }
}
