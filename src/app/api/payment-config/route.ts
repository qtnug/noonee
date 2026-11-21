import { NextResponse } from 'next/server';
import { getPublicPaymentConfig } from '@/lib/sepay';

export const dynamic = 'force-dynamic';

/**
 * Returns strictly public VietQR payment display metadata from server env vars.
 * Keeps SEPAY_API_TOKEN strictly server-side while allowing client payment pages
 * to read SEPAY_BANK_NAME, SEPAY_BANK_ACCOUNT, SEPAY_ACCOUNT_NAME, and sandbox mode.
 */
export async function GET() {
  const config = getPublicPaymentConfig();
  return NextResponse.json({
    success: true,
    data: {
      configured: config.configured,
      bankName: config.bankName,
      accountNo: config.accountNo,
      accountName: config.accountName,
      simulationEnabled: config.simulationEnabled,
      mode: config.mode,
    },
  });
}
