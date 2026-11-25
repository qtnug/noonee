import { NextRequest, NextResponse } from 'next/server';
import { getCategories } from '@/lib/db';
import { getGoongApiKey } from '@/lib/goong';
import { requireAdmin, AuthError } from '@/lib/auth';

export const dynamic = 'force-dynamic';

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

export async function GET(request: NextRequest) {
  try {
    requireAdmin(request);
  } catch (authErr) {
    if (authErr instanceof AuthError) {
      return NextResponse.json({ success: false, message: authErr.message }, { status: authErr.status });
    }
    throw authErr;
  }

  const { searchParams } = new URL(request.url);
  const target = searchParams.get('target');

  const results: ApiTestResult[] = [];

  // 1. Test SQL Server Cloud Database
  if (!target || target === 'database') {
    const start = Date.now();
    try {
      const cats = await getCategories();
      const latency = Date.now() - start;
      const host = process.env.SQLSERVER_HOST || 'Configured SQL Server';
      results.push({
        id: 'database',
        name: 'Microsoft SQL Server (Database)',
        category: 'Database',
        status: 'online',
        latencyMs: latency,
        statusCode: 200,
        details: `Truy vấn thành công ${cats.length} danh mục. Kết nối cơ sở dữ liệu ổn định.`,
        endpoint: host,
        lastTested: new Date().toLocaleTimeString('vi-VN'),
      });
    } catch (err: any) {
      const latency = Date.now() - start;
      results.push({
        id: 'database',
        name: 'Microsoft SQL Server (Database)',
        category: 'Database',
        status: 'warning',
        latencyMs: latency,
        statusCode: 500,
        details: 'Không thể kết nối CSDL, hệ thống đang dùng bộ nhớ đệm dự phòng.',
        endpoint: 'SQL Server Database',
        lastTested: new Date().toLocaleTimeString('vi-VN'),
      });
    }
  }

  // 2. Test Goong.io Map & Distance API
  if (!target || target === 'goong') {
    const start = Date.now();
    const apiKey = getGoongApiKey();
    if (apiKey) {
      try {
        const testUrl = `https://rsapi.goong.io/Place/AutoComplete?api_key=${apiKey}&input=Yen%20Lang&limit=1`;
        const res = await fetch(testUrl, { next: { revalidate: 0 } });
        const latency = Date.now() - start;
        const data = await res.json();
        if (res.ok && data.status === 'OK') {
          results.push({
            id: 'goong',
            name: 'Goong.io Maps & Distance Matrix API',
            category: 'Maps & Routing',
            status: 'online',
            latencyMs: latency,
            statusCode: res.status,
            details: `API hoạt động chuẩn xác. Đã kiểm tra gợi ý địa chỉ thành công (${data.predictions?.length || 0} kết quả).`,
            endpoint: 'rsapi.goong.io',
            lastTested: new Date().toLocaleTimeString('vi-VN'),
          });
        } else {
          results.push({
            id: 'goong',
            name: 'Goong.io Maps & Distance Matrix API',
            category: 'Maps & Routing',
            status: 'warning',
            latencyMs: latency,
            statusCode: res.status,
            details: `Phản hồi từ Goong: ${data.error_message || data.status || 'Chưa hợp lệ'}. Hệ thống tự động kích hoạt bộ định tuyến dự phòng.`,
            endpoint: 'rsapi.goong.io',
            lastTested: new Date().toLocaleTimeString('vi-VN'),
          });
        }
      } catch (e: any) {
        const latency = Date.now() - start;
        results.push({
          id: 'goong',
          name: 'Goong.io Maps & Distance Matrix API',
          category: 'Maps & Routing',
          status: 'warning',
          latencyMs: latency,
          details: 'Không thể kết nối tới Goong API, đang sử dụng bộ định tuyến dự phòng.',
          endpoint: 'rsapi.goong.io',
          lastTested: new Date().toLocaleTimeString('vi-VN'),
        });
      }
    } else {
      results.push({
        id: 'goong',
        name: 'Goong.io Maps & Distance Matrix API',
        category: 'Maps & Routing',
        status: 'online',
        latencyMs: 1,
        statusCode: 200,
        details: 'Đang chạy chế độ Dự phòng Nội bộ (Hanoi Built-in Geocoding & Haversine Router).',
        endpoint: 'Local Routing Engine',
        lastTested: new Date().toLocaleTimeString('vi-VN'),
      });
    }
  }

  // 3. Test Sepay VietQR Payment Gateway
  if (!target || target === 'sepay') {
    const start = Date.now();
    const bank = (process.env.SEPAY_BANK_NAME || '').trim();
    const acc = (process.env.SEPAY_BANK_ACCOUNT || '').trim();
    const token = (process.env.SEPAY_API_TOKEN || '').trim();
    const hasValidToken = Boolean(token && token !== 'demo_sepay_token');

    if (bank && acc) {
      try {
        const qrTestUrl = `https://img.vietqr.io/image/${bank}-${acc}-compact.png?amount=10000&addInfo=TEST`;
        const res = await fetch(qrTestUrl, { method: 'HEAD' });
        const latency = Date.now() - start;
        results.push({
          id: 'sepay',
          name: 'Cổng thanh toán Sepay (VietQR)',
          category: 'Payment Gateway',
          status: hasValidToken ? 'online' : 'warning',
          latencyMs: latency,
          statusCode: res.status,
          details: hasValidToken
            ? `Cổng thanh toán VietQR & Webhook sẵn sàng (Ngân hàng: ${bank}).`
            : `VietQR hiển thị được (${bank}) nhưng chưa cấu hình SEPAY_API_TOKEN cho webhook tự động xác nhận.`,
          endpoint: 'api.vietqr.io',
          lastTested: new Date().toLocaleTimeString('vi-VN'),
        });
      } catch (e: any) {
        const latency = Date.now() - start;
        results.push({
          id: 'sepay',
          name: 'Cổng thanh toán Sepay (VietQR)',
          category: 'Payment Gateway',
          status: 'warning',
          latencyMs: latency,
          details: 'Không thể kiểm tra dịch vụ VietQR ngoại vi.',
          endpoint: 'Sepay Webhook Gateway',
          lastTested: new Date().toLocaleTimeString('vi-VN'),
        });
      }
    } else {
      results.push({
        id: 'sepay',
        name: 'Cổng thanh toán Sepay (VietQR)',
        category: 'Payment Gateway',
        status: 'warning',
        latencyMs: 0,
        details: 'Chưa cấu hình biến môi trường SEPAY_BANK_NAME hoặc SEPAY_BANK_ACCOUNT trong .env.local.',
        endpoint: 'Sepay VietQR',
        lastTested: new Date().toLocaleTimeString('vi-VN'),
      });
    }
  }

  // 4. Test Cloudinary Media API
  if (!target || target === 'cloudinary') {
    const start = Date.now();
    let cloudName = (process.env.CLOUDINARY_CLOUD_NAME || '').trim();
    if (!cloudName && process.env.CLOUDINARY_URL) {
      const match = process.env.CLOUDINARY_URL.match(/@([^/?#]+)/);
      if (match?.[1]) {
        cloudName = match[1].trim();
      }
    }
    const hasSecretCreds = Boolean(
      process.env.CLOUDINARY_URL ||
        (cloudName && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET)
    );

    if (cloudName && hasSecretCreds) {
      try {
        const cloudPingUrl = `https://res.cloudinary.com/${cloudName}/image/upload/sample.jpg`;
        const res = await fetch(cloudPingUrl, { method: 'HEAD' });
        const latency = Date.now() - start;
        results.push({
          id: 'cloudinary',
          name: 'Cloudinary CDN (Lưu trữ ảnh)',
          category: 'Media CDN',
          status: 'online',
          latencyMs: latency,
          statusCode: res.status,
          details: 'Kết nối CDN Cloudinary hoạt động bình thường. Sẵn sàng upload ảnh món ăn.',
          endpoint: 'res.cloudinary.com',
          lastTested: new Date().toLocaleTimeString('vi-VN'),
        });
      } catch (e: any) {
        const latency = Date.now() - start;
        results.push({
          id: 'cloudinary',
          name: 'Cloudinary CDN (Lưu trữ ảnh)',
          category: 'Media CDN',
          status: 'warning',
          latencyMs: latency,
          details: 'Lỗi kết nối kiểm tra CDN Cloudinary.',
          endpoint: 'res.cloudinary.com',
          lastTested: new Date().toLocaleTimeString('vi-VN'),
        });
      }
    } else {
      results.push({
        id: 'cloudinary',
        name: 'Cloudinary CDN (Lưu trữ ảnh)',
        category: 'Media CDN',
        status: 'warning',
        latencyMs: 0,
        details: 'Chưa cấu hình đầy đủ CLOUDINARY_CLOUD_NAME / API_KEY / API_SECRET (hoặc CLOUDINARY_URL) trong .env.local.',
        endpoint: 'Cloudinary CDN',
        lastTested: new Date().toLocaleTimeString('vi-VN'),
      });
    }
  }

  // 5. Test Groq AI Chatbot API
  if (!target || target === 'groq') {
    const start = Date.now();
    const baseUrl = (process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1').trim().replace(/\/+$/, '');
    const model = (process.env.GROQ_MODEL || process.env.LLM_MODEL_NAME || 'qwen/qwen3.8-27b').trim();
    const rawKey = (process.env.GROQ_API_KEY || process.env.LLM_API_KEY || '').trim();
    const apiKey = rawKey.replace(/^["']|["']$/g, '');

    if (apiKey) {
      try {
        const res = await fetch(`${baseUrl}/models`, {
          headers: { Authorization: `Bearer ${apiKey}` },
          cache: 'no-store',
        });
        const latency = Date.now() - start;
        const data = await res.json().catch(() => ({}));
        if (res.ok && Array.isArray(data.data)) {
          const modelIds: string[] = data.data.map((m: any) => String(m.id));
          const hasConfiguredModel = modelIds.includes(model);
          results.push({
            id: 'groq',
            name: 'Groq AI (Trợ lý tư vấn món)',
            category: 'AI Chatbot',
            status: hasConfiguredModel ? 'online' : 'warning',
            latencyMs: latency,
            statusCode: res.status,
            details: hasConfiguredModel
              ? `Kết nối Groq AI ổn định (${modelIds.length} model sẵn sàng). Đang dùng: ${model}.`
              : `Groq API kết nối được nhưng model "${model}" không nằm trong danh sách khả dụng (${modelIds.slice(0, 3).join(', ')}...).`,
            endpoint: `${baseUrl}/chat/completions`,
            lastTested: new Date().toLocaleTimeString('vi-VN'),
          });
        } else {
          results.push({
            id: 'groq',
            name: 'Groq AI (Trợ lý tư vấn món)',
            category: 'AI Chatbot',
            status: 'offline',
            latencyMs: latency,
            statusCode: res.status,
            details: `Groq API từ chối yêu cầu (HTTP ${res.status}). Kiểm tra lại GROQ_API_KEY trên máy chủ.`,
            endpoint: `${baseUrl}/models`,
            lastTested: new Date().toLocaleTimeString('vi-VN'),
          });
        }
      } catch (e: any) {
        const latency = Date.now() - start;
        results.push({
          id: 'groq',
          name: 'Groq AI (Trợ lý tư vấn món)',
          category: 'AI Chatbot',
          status: 'offline',
          latencyMs: latency,
          details: 'Không thể kết nối tới máy chủ Groq AI.',
          endpoint: `${baseUrl}/models`,
          lastTested: new Date().toLocaleTimeString('vi-VN'),
        });
      }
    } else {
      results.push({
        id: 'groq',
        name: 'Groq AI (Trợ lý tư vấn món)',
        category: 'AI Chatbot',
        status: 'warning',
        latencyMs: 0,
        details: 'Chưa cấu hình GROQ_API_KEY trong biến môi trường (AI Chat sẽ dùng tìm kiếm từ khóa dự phòng).',
        endpoint: 'api.groq.com/openai/v1',
        lastTested: new Date().toLocaleTimeString('vi-VN'),
      });
    }
  }

  return NextResponse.json({
    success: true,
    data: results,
  });
}
