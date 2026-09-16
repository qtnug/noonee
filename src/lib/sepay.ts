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
  // Match DH followed by digits or letters
  const match = memo.toUpperCase().match(/DH[0-9A-Z]+/);
  return match ? match[0] : null;
}
