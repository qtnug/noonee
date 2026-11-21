export interface VietQRConfig {
  bankId: string;
  accountNo: string;
  accountName: string;
  amount: number;
  memo: string;
}

export interface PublicPaymentConfig {
  configured: boolean;
  webhookConfigured: boolean;
  bankName: string;
  accountNo: string;
  accountName: string;
  simulationEnabled: boolean;
  mode: 'Sandbox / Simulation' | 'Live';
}

/**
 * Unified check for whether Sandbox payment simulation is enabled.
 * Always disabled in production; in non-production, controlled by NEXT_PUBLIC_ENABLE_PAYMENT_SIMULATION=true
 * (and blocked if legacy DISABLE_PAYMENT_SIMULATION=true is explicitly set).
 */
export function isPaymentSimulationEnabled(): boolean {
  if (process.env.NODE_ENV === 'production') {
    return false;
  }
  if (process.env.DISABLE_PAYMENT_SIMULATION === 'true') {
    return false;
  }
  return process.env.NEXT_PUBLIC_ENABLE_PAYMENT_SIMULATION === 'true';
}

/**
 * Server-side helper returning strictly public VietQR display metadata (never exposes SEPAY_API_TOKEN).
 */
export function getPublicPaymentConfig(): PublicPaymentConfig {
  const bankName = (process.env.SEPAY_BANK_NAME || '').trim();
  const accountNo = (process.env.SEPAY_BANK_ACCOUNT || '').trim();
  const accountName = (process.env.SEPAY_ACCOUNT_NAME || '').trim();
  const token = (process.env.SEPAY_API_TOKEN || '').trim();
  const simulationEnabled = isPaymentSimulationEnabled();

  return {
    configured: Boolean(bankName && accountNo),
    webhookConfigured: Boolean(token && token !== 'demo_sepay_token'),
    bankName,
    accountNo,
    accountName,
    simulationEnabled,
    mode: simulationEnabled ? 'Sandbox / Simulation' : 'Live',
  };
}

export function getVietQRImageUrl(config: VietQRConfig): string {
  const bank = (config.bankId || '').trim();
  const acc = (config.accountNo || '').trim();
  const name = encodeURIComponent((config.accountName || '').trim());
  const memo = encodeURIComponent(config.memo);
  const amount = Math.round(config.amount);

  if (!bank || !acc) {
    return '';
  }

  // Standard VietQR QuickLink image endpoint
  return `https://api.vietqr.io/image/${bank}-${acc}-compact2.jpg?amount=${amount}&addInfo=${memo}&accountName=${name}`;
}

export function parseOrderCodeFromMemo(memo: string): string | null {
  if (!memo) return null;
  const upper = memo.toUpperCase();

  // 1. Match NOONEE followed directly by digits/alphanumeric (e.g. NOONEE12345678)
  const matchDirect = upper.match(/NOONEE[0-9A-Z]{6,12}/);
  if (matchDirect) return matchDirect[0];

  // 2. Match previous format with underscore: NOONEE_... (e.g. NOONEE_12345678)
  const matchUnderscore = upper.match(/NOONEE_[0-9A-Z]{6,12}/);
  if (matchUnderscore) return matchUnderscore[0];

  // 3. Match with space if bank stripped or separated: NOONEE 12345678 -> NOONEE12345678
  const matchSpaced = upper.match(/NOONEE\s+([0-9A-Z]{6,12})/);
  if (matchSpaced) return `NOONEE${matchSpaced[1]}`;

  // 4. Legacy format: DH...
  const matchLegacy = upper.match(/DH[0-9A-Z]+/);
  if (matchLegacy) return matchLegacy[0];

  return null;
}
