// Advanced In-Memory Sliding Window Rate Limiter & IP Blacklist Defender

interface RateLimitRecord {
  timestamps: number[];
}

interface BlacklistRecord {
  bannedAt: number;
  expiresAt: number;
  reason: string;
}

// In-memory stores
const rateLimitStore = new Map<string, RateLimitRecord>();
const blacklistStore = new Map<string, BlacklistRecord>();

// Cleanup stale rate-limit entries and expired bans every 2 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();

    // Clean rate limits
    rateLimitStore.forEach((record, key) => {
      record.timestamps = record.timestamps.filter((t) => now - t < 120000);
      if (record.timestamps.length === 0) {
        rateLimitStore.delete(key);
      }
    });

    // Clean expired blacklists
    blacklistStore.forEach((record, ip) => {
      if (now > record.expiresAt) {
        blacklistStore.delete(ip);
      }
    });
  }, 120000);
}

/**
 * Ban or blacklist an IP address
 * @param ip - Client IP
 * @param reason - Reason for ban (e.g., Honeypot trap triggered, Scraper detected)
 * @param durationMs - Duration of ban in milliseconds (default: 24 hours)
 */
export function blacklistIp(
  ip: string,
  reason: string = 'Hành vi tự động quét cào dữ liệu hoặc vi phạm bảo mật',
  durationMs: number = 24 * 60 * 60 * 1000
): void {
  const cleanIp = ip.trim();
  if (!cleanIp || cleanIp === '127.0.0.1' || cleanIp === 'localhost' || cleanIp === '::1') {
    return; // Do not ban loopback in dev
  }

  const now = Date.now();
  blacklistStore.set(cleanIp, {
    bannedAt: now,
    expiresAt: now + durationMs,
    reason,
  });

  console.warn(`[SECURITY ALERT] IP blacklisted: ${cleanIp} | Reason: ${reason} | Duration: ${Math.round(durationMs / 60000)}m`);
}

/**
 * Check if an IP is currently blacklisted
 */
export function isIpBlacklisted(ip: string): { blacklisted: boolean; reason?: string; remainingMs?: number } {
  const cleanIp = ip.trim();
  const record = blacklistStore.get(cleanIp);
  if (!record) {
    return { blacklisted: false };
  }

  const now = Date.now();
  if (now > record.expiresAt) {
    blacklistStore.delete(cleanIp);
    return { blacklisted: false };
  }

  return {
    blacklisted: true,
    reason: record.reason,
    remainingMs: record.expiresAt - now,
  };
}

/**
 * Remove an IP from the blacklist manually
 */
export function unblacklistIp(ip: string): boolean {
  return blacklistStore.delete(ip.trim());
}

/**
 * Check if a request exceeds the allowed rate limit
 * @param identifier - Key identifier (e.g., client IP or endpoint:IP)
 * @param limit - Maximum allowed requests within the window
 * @param windowMs - Time window in milliseconds (default: 60,000ms = 1 minute)
 * @returns { allowed: boolean, remaining: number, resetMs: number, limit: number, blacklisted?: boolean, reason?: string }
 */
export function checkRateLimit(
  identifier: string,
  limit: number = 60,
  windowMs: number = 60000
): {
  allowed: boolean;
  remaining: number;
  resetMs: number;
  limit: number;
  blacklisted?: boolean;
  reason?: string;
} {
  // Check if identifier contains an IP that is blacklisted
  const rawIp = identifier.includes(':') ? identifier.split(':').pop() || identifier : identifier;
  const blStatus = isIpBlacklisted(rawIp);
  if (blStatus.blacklisted) {
    return {
      allowed: false,
      remaining: 0,
      resetMs: blStatus.remainingMs || 3600000,
      limit,
      blacklisted: true,
      reason: blStatus.reason,
    };
  }

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
    return {
      allowed: false,
      remaining: 0,
      resetMs: Math.max(0, resetMs),
      limit,
    };
  }

  record.timestamps.push(now);
  const remaining = limit - record.timestamps.length;
  return {
    allowed: true,
    remaining,
    resetMs: windowMs,
    limit,
  };
}

/**
 * Generate standard HTTP Rate-Limit Headers
 */
export function getRateLimitHeaders(limit: number, remaining: number, resetMs: number): Record<string, string> {
  const resetSeconds = Math.max(1, Math.ceil(resetMs / 1000));
  return {
    'X-RateLimit-Limit': String(limit),
    'X-RateLimit-Remaining': String(Math.max(0, remaining)),
    'X-RateLimit-Reset': String(resetSeconds),
    'Retry-After': String(resetSeconds),
  };
}

/**
 * Extract client IP accurately from Request or NextRequest headers
 */
export function getClientIp(req: Request): string {
  const cfConnectingIp = req.headers.get('cf-connecting-ip');
  if (cfConnectingIp) {
    return cfConnectingIp.trim();
  }

  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIp = req.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }

  const trueClientIp = req.headers.get('true-client-ip');
  if (trueClientIp) {
    return trueClientIp.trim();
  }

  return '127.0.0.1';
}
