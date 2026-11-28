import { NextRequest, NextResponse } from 'next/server';
import { getCategories } from '@/lib/db';
import { getGoongApiKey } from '@/lib/goong';
import { requireAdmin, AuthError } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const preferredRegion = 'iad1';

export interface ApiTestResult {
  id: string;
  name: string;
  category: string;
  status: 'online' | 'warning' | 'offline';
  latencyMs: number;
  statusCode?: number;
  details: string;
  endpoint: string;
  lastTested: string;
}

const makeResult = (
  base: Pick<ApiTestResult, 'id' | 'name' | 'category'>,
  fields: Omit<ApiTestResult, 'id' | 'name' | 'category' | 'lastTested'>
): ApiTestResult => ({
  ...base,
  ...fields,
  lastTested: new Date().toLocaleTimeString('vi-VN'),
});

const PROBES: Record<string, () => Promise<ApiTestResult>> = {
  async database() {
    const meta = { id: 'database', name: 'Microsoft SQL Server (Database)', category: 'Database' };
    const start = Date.now();
    try {
      const cats = await getCategories();
      return makeResult(meta, {
        status: 'online',
        latencyMs: Date.now() - start,
        statusCode: 200,
        details: `Truy vấn thành công ${cats.length} danh mục. Kết nối cơ sở dữ liệu ổn định.`,
        endpoint: process.env.SQLSERVER_HOST || 'Configured SQL Server',
      });
    } catch {
      return makeResult(meta, {
        status: 'warning',
        latencyMs: Date.now() - start,
        statusCode: 500,
        details: 'Không thể kết nối CSDL, hệ thống đang dùng bộ nhớ đệm dự phòng.',
        endpoint: 'SQL Server Database',
      });
    }
  },

  async goong() {
    const meta = { id: 'goong', name: 'Goong.io Maps & Distance Matrix API', category: 'Maps & Routing' };
    const apiKey = getGoongApiKey();
    if (!apiKey) {
      return makeResult(meta, {
        status: 'online',
        latencyMs: 1,
        statusCode: 200,
        details: 'Đang chạy chế độ Dự phòng Nội bộ (Hanoi Built-in Geocoding & Haversine Router).',
        endpoint: 'Local Routing Engine',
      });
    }
    const start = Date.now();
    try {
      const res = await fetch(
        `https://rsapi.goong.io/Place/AutoComplete?api_key=${apiKey}&input=Yen%20Lang&limit=1`,
        { next: { revalidate: 0 }, signal: AbortSignal.timeout(6000) }
      );
      const data = await res.json();
      const ok = res.ok && data.status === 'OK';
      return makeResult(meta, {
        status: ok ? 'online' : 'warning',
        latencyMs: Date.now() - start,
        statusCode: res.status,
        details: ok
          ? `API hoạt động chuẩn xác. Đã kiểm tra gợi ý địa chỉ thành công (${data.predictions?.length || 0} kết quả).`
          : `Phản hồi từ Goong: ${data.error_message || data.status || 'Chưa hợp lệ'}. Hệ thống tự động kích hoạt bộ định tuyến dự phòng.`,
        endpoint: 'rsapi.goong.io',
      });
    } catch {
      return makeResult(meta, {
        status: 'warning',
        latencyMs: Date.now() - start,
        details: 'Không thể kết nối tới Goong API, đang sử dụng bộ định tuyến dự phòng.',
        endpoint: 'rsapi.goong.io',
      });
    }
  },

  async sepay() {
    const meta = { id: 'sepay', name: 'Cổng thanh toán Sepay (VietQR)', category: 'Payment Gateway' };
    const bank = (process.env.SEPAY_BANK_NAME || '').trim();
    const acc = (process.env.SEPAY_BANK_ACCOUNT || '').trim();
    const token = (process.env.SEPAY_API_TOKEN || '').trim();
    const hasValidToken = Boolean(token && token !== 'demo_sepay_token');
    if (!bank || !acc) {
      return makeResult(meta, {
        status: 'warning',
        latencyMs: 0,
        details: 'Chưa cấu hình biến môi trường SEPAY_BANK_NAME hoặc SEPAY_BANK_ACCOUNT trong .env.local.',
        endpoint: 'Sepay VietQR',
      });
    }
    const start = Date.now();
    try {
      const res = await fetch(
        `https://img.vietqr.io/image/${bank}-${acc}-compact.png?amount=10000&addInfo=TEST`,
        { method: 'HEAD', signal: AbortSignal.timeout(6000) }
      );
      return makeResult(meta, {
        status: hasValidToken ? 'online' : 'warning',
        latencyMs: Date.now() - start,
        statusCode: res.status,
        details: hasValidToken
          ? `Cổng thanh toán VietQR & Webhook sẵn sàng (Ngân hàng: ${bank}).`
          : `VietQR hiển thị được (${bank}) nhưng chưa cấu hình SEPAY_API_TOKEN cho webhook tự động xác nhận.`,
        endpoint: 'api.vietqr.io',
      });
    } catch {
      return makeResult(meta, {
        status: 'warning',
        latencyMs: Date.now() - start,
        details: 'Không thể kiểm tra dịch vụ VietQR ngoại vi.',
        endpoint: 'Sepay Webhook Gateway',
      });
    }
  },

  async cloudinary() {
    const meta = { id: 'cloudinary', name: 'Cloudinary CDN (Lưu trữ ảnh)', category: 'Media CDN' };
    const urlMatch = process.env.CLOUDINARY_URL?.match(/@([^/?#]+)/);
    const cloudName = (process.env.CLOUDINARY_CLOUD_NAME || urlMatch?.[1] || '').trim();
    const hasCreds = Boolean(
      process.env.CLOUDINARY_URL ||
        (cloudName && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET)
    );
    if (!cloudName || !hasCreds) {
      return makeResult(meta, {
        status: 'warning',
        latencyMs: 0,
        details: 'Chưa cấu hình đầy đủ CLOUDINARY_CLOUD_NAME / API_KEY / API_SECRET (hoặc CLOUDINARY_URL) trong .env.local.',
        endpoint: 'Cloudinary CDN',
      });
    }
    const start = Date.now();
    try {
      const res = await fetch(`https://res.cloudinary.com/${cloudName}/image/upload/sample.jpg`, {
        method: 'HEAD',
        signal: AbortSignal.timeout(6000),
      });
      return makeResult(meta, {
        status: 'online',
        latencyMs: Date.now() - start,
        statusCode: res.status,
        details: 'Kết nối CDN Cloudinary hoạt động bình thường. Sẵn sàng upload ảnh món ăn.',
        endpoint: 'res.cloudinary.com',
      });
    } catch {
      return makeResult(meta, {
        status: 'warning',
        latencyMs: Date.now() - start,
        details: 'Lỗi kết nối kiểm tra CDN Cloudinary.',
        endpoint: 'res.cloudinary.com',
      });
    }
  },

  async groq() {
    const meta = { id: 'groq', name: 'Groq AI (Trợ lý tư vấn món)', category: 'AI Chatbot' };
    const baseUrl = (process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1').trim().replace(/\/+$/, '');
    const model = (process.env.GROQ_MODEL || process.env.LLM_MODEL_NAME || 'qwen/qwen3.8-27b').trim();
    const apiKey = (process.env.GROQ_API_KEY || process.env.LLM_API_KEY || '').trim().replace(/^["']|["']$/g, '');
    if (!apiKey) {
      return makeResult(meta, {
        status: 'warning',
        latencyMs: 0,
        details: 'Chưa cấu hình GROQ_API_KEY trong biến môi trường (AI Chat sẽ dùng tìm kiếm từ khóa dự phòng).',
        endpoint: 'api.groq.com/openai/v1',
      });
    }
    const start = Date.now();
    try {
      const res = await fetch(`${baseUrl}/models`, {
        headers: { Accept: 'application/json', 'User-Agent': 'NooNeeFood/1.0', Authorization: `Bearer ${apiKey}` },
        cache: 'no-store',
        signal: AbortSignal.timeout(6000),
      });
      const latencyMs = Date.now() - start;
      const data = await res.json().catch(() => ({}));
      if (res.ok && Array.isArray(data.data)) {
        const modelIds: string[] = data.data.map((m: any) => String(m.id));
        const hasConfiguredModel = modelIds.includes(model);
        return makeResult(meta, {
          status: hasConfiguredModel ? 'online' : 'warning',
          latencyMs,
          statusCode: res.status,
          details: hasConfiguredModel
            ? `Kết nối Groq AI ổn định (${modelIds.length} model sẵn sàng). Đang dùng: ${model}.`
            : `Groq API kết nối được nhưng model "${model}" không nằm trong danh sách khả dụng (${modelIds.slice(0, 3).join(', ')}...).`,
          endpoint: `${baseUrl}/chat/completions`,
        });
      }
      const region = process.env.VERCEL_REGION || 'local';
      const cfRay = res.headers.get('cf-ray') || '';
      return makeResult(meta, {
        status: 'offline',
        latencyMs,
        statusCode: res.status,
        details:
          res.status === 403
            ? `Groq API từ chối theo vùng/IP (HTTP 403, Region: ${region}${cfRay ? `, cf-ray: ${cfRay}` : ''}). Kiểm tra Function Region trên Vercel (tránh Hong Kong hkg1, chuyển sang iad1).`
            : `Groq API từ chối yêu cầu (HTTP ${res.status}). Kiểm tra lại GROQ_API_KEY trên máy chủ.`,
        endpoint: `${baseUrl}/models`,
      });
    } catch {
      return makeResult(meta, {
        status: 'offline',
        latencyMs: Date.now() - start,
        details: 'Không thể kết nối tới máy chủ Groq AI.',
        endpoint: `${baseUrl}/models`,
      });
    }
  },
};

export async function GET(request: NextRequest) {
  try {
    requireAdmin(request);
  } catch (authErr) {
    if (authErr instanceof AuthError) {
      return NextResponse.json({ success: false, message: authErr.message }, { status: authErr.status });
    }
    throw authErr;
  }

  const target = new URL(request.url).searchParams.get('target');
  const targets = target ? (PROBES[target] ? [target] : []) : Object.keys(PROBES);
  const results = await Promise.all(targets.map((key) => PROBES[key]()));

  return NextResponse.json({ success: true, data: results });
}
