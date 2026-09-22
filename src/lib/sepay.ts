export interface VietQRConfig {
  bankId: string;
  accountNo: string;
  accountName: string;
  amount: number;
  memo: string;
}

export function getVietQRImageUrl(config: VietQRConfig): string {
  const bank = config.bankId || process.env.SEPAY_BANK_NAME || '';
  const acc = config.accountNo || process.env.SEPAY_BANK_ACCOUNT || '';
  const name = encodeURIComponent(config.accountName || process.env.SEPAY_ACCOUNT_NAME || '');
  const memo = encodeURIComponent(config.memo);
  const amount = Math.round(config.amount);

  if (!bank || !acc) {
    console.warn('⚠️ SEPAY_BANK_NAME and SEPAY_BANK_ACCOUNT must be configured in environment variables');
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
