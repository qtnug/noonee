import { NextRequest, NextResponse } from 'next/server';
import { getInternalUsers, getUserByUsername, createUser } from '@/lib/db';
import { resolveLiveUser, AuthError } from '@/lib/auth';
import { sanitizeText } from '@/lib/security';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const actor = await resolveLiveUser(request);
    if (actor.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Chỉ Tổng quản lý mới có quyền quản lý tài khoản' },
        { status: 403 }
      );
    }

    const users = await getInternalUsers();
    return NextResponse.json({ success: true, data: users });
  } catch (err: any) {
    if (err instanceof AuthError) {
      return NextResponse.json({ success: false, message: err.message }, { status: err.status });
    }
    console.error('GET /api/admin/users error:', err);
    return NextResponse.json({ success: false, message: 'Lỗi khi tải danh sách tài khoản' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const actor = await resolveLiveUser(request);
    if (actor.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Chỉ Tổng quản lý mới có quyền mở tài khoản mới' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const rawUsername = String(body.username || '').trim().toLowerCase();
    const password = String(body.password || '');
    const fullName = sanitizeText(String(body.fullName || '').trim(), 100);
    const phone = sanitizeText(String(body.phone || '').trim(), 20);
    const email = body.email ? sanitizeText(String(body.email).trim(), 100) : undefined;
    const role = body.role === 'manager' ? 'manager' : body.role === 'staff' ? 'staff' : null;
    const branchId = Number(body.branchId);

    if (!rawUsername || rawUsername.length < 3 || !/^[a-z0-9_.-]+$/.test(rawUsername)) {
      return NextResponse.json(
        { success: false, message: 'Tên đăng nhập tối thiểu 3 ký tự (chỉ gồm chữ thường, số, dấu gạch dưới hoặc dấu chấm)' },
        { status: 400 }
      );
    }

    if (!password || password.length < 6) {
      return NextResponse.json(
        { success: false, message: 'Mật khẩu phải có ít nhất 6 ký tự' },
        { status: 400 }
      );
    }

    if (!fullName) {
      return NextResponse.json(
        { success: false, message: 'Vui lòng nhập họ và tên nhân sự' },
        { status: 400 }
      );
    }

    if (!role) {
      return NextResponse.json(
        { success: false, message: 'Vai trò không hợp lệ (chọn Nhân viên hoặc Quản lý)' },
        { status: 400 }
      );
    }

    if (branchId !== 1 && branchId !== 2) {
      return NextResponse.json(
        { success: false, message: 'Vui lòng chọn cơ sở làm việc (Cơ sở 1 hoặc Cơ sở 2)' },
        { status: 400 }
      );
    }

    const existing = await getUserByUsername(rawUsername);
    if (existing) {
      return NextResponse.json(
        { success: false, message: `Tên đăng nhập "${rawUsername}" đã tồn tại trong hệ thống` },
        { status: 400 }
      );
    }

    const created = await createUser({
      username: rawUsername,
      password,
      fullName,
      phone,
      email,
      role,
      branchId,
      isActive: true,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Đã mở tài khoản mới thành công',
        data: created,
      },
      { status: 201 }
    );
  } catch (err: any) {
    if (err instanceof AuthError) {
      return NextResponse.json({ success: false, message: err.message }, { status: err.status });
    }
    console.error('POST /api/admin/users error:', err);
    return NextResponse.json({ success: false, message: 'Đã xảy ra lỗi khi tạo tài khoản' }, { status: 500 });
  }
}
