import { NextRequest, NextResponse } from 'next/server';
import { checkDatabaseHealth } from '@/lib/db';
import { getPublicPaymentConfig } from '@/lib/sepay';
import { authenticateRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authUser = authenticateRequest(request);
    // Unauthenticated probes only get minimal liveness status so internal DB/bank info stays private
    if (!authUser || authUser.role !== 'admin') {
      return NextResponse.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
      });
    }

    const dbHealth = await checkDatabaseHealth();
    const paymentConfig = getPublicPaymentConfig();
    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: dbHealth,
      sepay: {
        configured: paymentConfig.configured && paymentConfig.webhookConfigured,
        qrConfigured: paymentConfig.configured,
        webhookConfigured: paymentConfig.webhookConfigured,
        bank: paymentConfig.bankName || '',
        account: paymentConfig.accountNo || '',
        accountName: paymentConfig.accountName || '',
        simulationEnabled: paymentConfig.simulationEnabled,
        mode: paymentConfig.mode,
      },
    });
  } catch (error: any) {
    console.error('Health check error:', error);
    return NextResponse.json({ status: 'error', message: 'Hệ thống đang gặp sự cố' }, { status: 500 });
  }
}
