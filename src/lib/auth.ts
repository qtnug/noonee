import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import { User } from '@/types';

const JWT_SECRET = process.env.JWT_SECRET || 'noonee-default-secret-change-in-production';
const JWT_EXPIRES_IN = '7d';

export interface JwtPayload {
  userId: number;
  username: string;
  role: 'admin' | 'customer';
}

/**
 * Generate a JWT token for a user
 */
export function generateToken(user: User): string {
  const payload: JwtPayload = {
    userId: user.id,
    username: user.username,
    role: user.role,
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Verify and decode a JWT token
 */
export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

/**
 * Extract JWT token from request Authorization header or Cookie
 * Supports: "Bearer <token>", raw token, or auth_token / token cookie
 */
function extractToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (authHeader) {
    if (authHeader.startsWith('Bearer ')) {
      return authHeader.slice(7).trim();
    }
    return authHeader.trim();
  }
  const cookieToken = request.cookies.get('auth_token')?.value || request.cookies.get('token')?.value;
  if (cookieToken) {
    return cookieToken.trim();
  }
  return null;
}

/**
 * Authenticate request - returns user payload or null
 */
export function authenticateRequest(request: NextRequest): JwtPayload | null {
  const token = extractToken(request);
  if (!token) return null;
  return verifyToken(token);
}

/**
 * Require authenticated user - returns user payload or throws
 */
export function requireAuth(request: NextRequest): JwtPayload {
  const payload = authenticateRequest(request);
  if (!payload) {
    throw new AuthError('Vui lòng đăng nhập để thực hiện thao tác này', 401);
  }
  return payload;
}

/**
 * Require admin role - returns user payload or throws
 */
export function requireAdmin(request: NextRequest): JwtPayload {
  const payload = requireAuth(request);
  if (payload.role !== 'admin') {
    throw new AuthError('Bạn không có quyền truy cập chức năng này (yêu cầu quyền Admin)', 403);
  }
  return payload;
}

/**
 * Custom auth error with HTTP status code
 */
export class AuthError extends Error {
  status: number;
  constructor(message: string, status: number = 401) {
    super(message);
    this.name = 'AuthError';
    this.status = status;
  }
}

/**
 * Helper to create error response from AuthError
 */
export function authErrorResponse(error: unknown) {
  if (error instanceof AuthError) {
    return { success: false, message: error.message, status: error.status };
  }
  return { success: false, message: 'Lỗi xác thực không xác định', status: 500 };
}
