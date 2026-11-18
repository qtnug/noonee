import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import { User, UserRole } from '@/types';
import { getUserById } from '@/lib/db';

const JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? '' : 'noonee-development-only-secret');
if (!JWT_SECRET) throw new Error('JWT_SECRET must be configured in production');
const JWT_EXPIRES_IN = '7d';

export interface JwtPayload {
  userId: number;
  username: string;
  role: UserRole;
  branchId?: number | null;
}

export function isPortalRole(role?: string | null): boolean {
  return role === 'admin' || role === 'manager' || role === 'staff';
}

/**
 * Generate a JWT token for a user
 */
export function generateToken(user: User): string {
  const payload: JwtPayload = {
    userId: user.id,
    username: user.username,
    role: user.role,
    branchId: user.branchId ?? null,
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
 * Require Super Admin (Tổng quản lý) role - returns user payload or throws
 */
export function requireAdmin(request: NextRequest): JwtPayload {
  const payload = requireAuth(request);
  if (payload.role !== 'admin') {
    throw new AuthError('Bạn không có quyền truy cập chức năng này (yêu cầu quyền Tổng quản lý)', 403);
  }
  return payload;
}

/**
 * Require Manager or Super Admin role
 */
export function requireManagerOrAdmin(request: NextRequest): JwtPayload {
  const payload = requireAuth(request);
  if (payload.role !== 'admin' && payload.role !== 'manager') {
    throw new AuthError('Bạn không có quyền thực hiện thao tác này (yêu cầu quyền Quản lý trở lên)', 403);
  }
  return payload;
}

/**
 * Require any internal portal role (admin, manager, staff)
 */
export function requirePortalRole(request: NextRequest): JwtPayload {
  const payload = requireAuth(request);
  if (!isPortalRole(payload.role)) {
    throw new AuthError('Tài khoản này không có quyền truy cập cổng quản trị', 403);
  }
  return payload;
}

/**
 * Resolve live user record from DB (ensuring account is not locked/deleted and role/branchId are fresh)
 */
export async function resolveLiveUser(request: NextRequest): Promise<User> {
  const payload = requireAuth(request);
  const liveUser = await getUserById(payload.userId);
  if (!liveUser) {
    throw new AuthError('Tài khoản không còn tồn tại trong hệ thống', 401);
  }
  if (liveUser.isActive === false) {
    throw new AuthError('Tài khoản của bạn hiện đang bị tạm khóa', 403);
  }
  return liveUser;
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
