// Simple In-Memory Sliding Window Rate Limiter
interface RateLimitRecord {
  timestamps: number[];
}

const rateLimitStore = new Map<string, RateLimitRecord>();

// Cleanup stale entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    rateLimitStore.forEach((record, key) => {
      record.timestamps = record.timestamps.filter((t) => now - t < 60000);
      if (record.timestamps.length === 0) {
        rateLimitStore.delete(key);
      }
    });
  }, 300000);
}

/**
 * Check if a request exceeds the allowed rate limit
 * @param identifier - Key identifier (e.g., client IP or endpoint:IP)
 * @param limit - Maximum allowed requests within the window
 * @param windowMs - Time window in milliseconds (default: 60,000ms = 1 minute)
 * @returns { allowed: boolean, remaining: number, resetMs: number }
 */
export function checkRateLimit(
  identifier: string,
  limit: number = 60,
  windowMs: number = 60000
): { allowed: boolean; remaining: number; resetMs: number } {
  const now = Date.now();
  let record = rateLimitStore.get(identifier);

  if (!record) {
    record = { timestamps: [] };
    rateLimitStore.set(identifier, record);
  }

  // Filter out timestamps outside current window
  record.timestamps = record.timestamps.filter((t) => now - t < windowMs);

  if (record.timestamps.length >= limit) {
    const oldestTimestamp = record.timestamps[0];
    const resetMs = windowMs - (now - oldestTimestamp);
    return { allowed: false, remaining: 0, resetMs: Math.max(0, resetMs) };
  }

  record.timestamps.push(now);
  const remaining = limit - record.timestamps.length;
  return { allowed: true, remaining, resetMs: windowMs };
}

/**
 * Extract client IP from NextRequest headers
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = req.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }
  return '127.0.0.1';
}
