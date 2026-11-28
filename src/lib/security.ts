/**
 * Comprehensive Web Security Utilities
 * - Honeypot anti-bot validation
 * - WAF threat detection (SQLi, Path Traversal, XSS)
 * - Bad bot & malicious scraper detection
 * - Input sanitization
 */

import { blacklistIp } from './rateLimit';

export interface HoneypotResult {
  isBot: boolean;
  reason?: string;
}

/**
 * Universal Honeypot Form Inspector
 * Checks for hidden honeypot fields filled by automated bots
 * and checks submission time threshold (bots submit in < 800ms)
 */
export function verifyHoneypot(
  body: any,
  options?: { minTimeSeconds?: number; clientIp?: string }
): HoneypotResult {
  if (!body || typeof body !== 'object') {
    return { isBot: false };
  }

  // 1. Check decoy honeypot fields (should always be empty for legitimate humans)
  const honeypotFields = [
    'hp_bot_trap',
    'hp_code',
    'honeypot',
    'website_url_hp',
    'fax_hp',
    'confirm_email_hp',
  ];

  for (const field of honeypotFields) {
    if (body[field] !== undefined && body[field] !== null && String(body[field]).trim() !== '') {
      if (options?.clientIp) {
        blacklistIp(options.clientIp, `Honeypot field '${field}' filled by automated bot`, 12 * 60 * 60 * 1000);
      }
      return {
        isBot: true,
        reason: `Phát hiện bot tự động qua trường bẫy honeypot (${field})`,
      };
    }
  }

  // 2. Optional: Submission time check (if hp_timestamp is supplied)
  if (body.hp_timestamp) {
    const renderTime = Number(body.hp_timestamp);
    if (!isNaN(renderTime) && renderTime > 0) {
      const elapsedMs = Date.now() - renderTime;
      const minMs = (options?.minTimeSeconds || 0.8) * 1000;
      // If submitted impossibly fast (under 800ms) with multiple fields filled
      if (elapsedMs > 0 && elapsedMs < minMs) {
        return {
          isBot: true,
          reason: 'Biểu mẫu được gửi quá nhanh một cách bất thường (nghi vấn bot tự động)',
        };
      }
    }
  }

  return { isBot: false };
}

/**
 * Known aggressive scrapers, automated vulnerability scanners, and exploit tools
 */
const KNOWN_ATTACK_AGENTS = [
  'sqlmap',
  'nikto',
  'wpscan',
  'masscan',
  'zgrab',
  'nmap',
  'dirbuster',
  'gobuster',
  'acunetix',
  'havij',
  'netsparker',
];

/**
 * Detect if User-Agent belongs to a known exploit tool or scanner
 */
export function isMaliciousTool(userAgent: string | null | undefined): boolean {
  if (!userAgent) return false;
  const ua = userAgent.toLowerCase();
  return KNOWN_ATTACK_AGENTS.some((tool) => ua.includes(tool));
}

/**
 * Threat Patterns for SQL Injection, Path Traversal, XSS
 */
const SQLI_PATTERNS = [
  /(\bunion\b\s+.*\bselect\b)/i,
  /(\bselect\b\s+.*\bfrom\b\s+information_schema)/i,
  /(\bexec\b\s*\(|\bxp_\w+)/i,
  /(\bwaitfor\b\s+\bdelay\b)/i,
  /(;\s*drop\s+table)/i,
  /('|\%27)\s*(\bor\b|\band\b)\s*('?1'?\s*=\s*'?1'|\d+\s*=\s*\d+)/i,
  /(\s--\s|\/\*[\s\S]*\*\/)/,
];

const PATH_TRAVERSAL_PATTERNS = [
  /(\.\.\/|\.\.\\)/,
  /(\.\.%2f|\.\.%5c)/i,
  /(%2e%2e%2f|%2e%2e%5c)/i,
  /(\/etc\/passwd|win\.ini|boot\.ini)/i,
];

const XSS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/i,
  /javascript\s*:/i,
  /onerror\s*=/i,
  /onload\s*=/i,
  /<svg[^>]*onload/i,
  /<img[^>]*onerror/i,
];

/**
 * Threat inspection for URLs and incoming strings
 */
export function inspectThreat(text: string): { dangerous: boolean; type?: string; match?: string } {
  if (!text || typeof text !== 'string') return { dangerous: false };

  // Decode URI component safely for inspection
  let decoded = text;
  try {
    decoded = decodeURIComponent(text);
  } catch {
    // ignore decode error
  }

  for (const pattern of SQLI_PATTERNS) {
    if (pattern.test(decoded)) {
      return { dangerous: true, type: 'SQL_INJECTION', match: pattern.source };
    }
  }

  for (const pattern of PATH_TRAVERSAL_PATTERNS) {
    if (pattern.test(decoded)) {
      return { dangerous: true, type: 'PATH_TRAVERSAL', match: pattern.source };
    }
  }

  for (const pattern of XSS_PATTERNS) {
    if (pattern.test(decoded)) {
      return { dangerous: true, type: 'XSS', match: pattern.source };
    }
  }

  return { dangerous: false };
}

/**
 * Clean and sanitize user input text
 * - Strips all HTML tags
 * - Converts control characters
 * - Trims whitespace and clamps maximum length
 */
export function sanitizeText(val: any, maxLength: number = 2000): string {
  if (val === null || val === undefined) return '';
  let str = String(val).trim();

  // Strip HTML tags
  str = str.replace(/<[^>]*>?/gm, '');

  // Strip script/javascript links
  str = str.replace(/javascript:/gi, '');

  // Normalize excessive whitespaces
  str = str.replace(/\s+/g, ' ');

  // Enforce max length
  if (str.length > maxLength) {
    str = str.substring(0, maxLength);
  }

  return str.trim();
}
