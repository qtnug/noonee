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
        configured: Boolean(process.env.SEPAY_API_TOKEN),
        bank: process.env.SEPAY_BANK_NAME || 'MB',
        account: process.env.SEPAY_BANK_ACCOUNT || '0388889999',
        mode: process.env.NEXT_PUBLIC_ENABLE_PAYMENT_SIMULATION === 'true' ? 'Sandbox / Simulation' : 'Live'
      }
    });
  } catch (error: any) {
    return NextResponse.json({ status: 'error', error: error.message }, { status: 500 });
  }
}
