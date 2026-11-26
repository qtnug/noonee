import { NextRequest, NextResponse } from 'next/server';
import { getChatbotMenuBundle } from '@/lib/foodMenu';
import {
  extractMentionedProductIds,
  pickRecommendedProductsForBranch,
  scoreAndSearchProducts,
} from '@/lib/aiMenuUtils';
import { normalizeBranchId } from '@/lib/cartUtils';
import { Product } from '@/types';
import { checkRateLimit, getClientIp, getRateLimitHeaders } from '@/lib/rateLimit';
import { verifyHoneypot, sanitizeText } from '@/lib/security';

export const dynamic = 'force-dynamic';
// Pin single US region (iad1) for Hobby-plan compatibility and to avoid Groq 403 geo-blocks (e.g. hkg1)
export const preferredRegion = 'iad1';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);

    // Rate Limit: 15 AI chats per minute per IP
    const rateCheck = checkRateLimit(`aichat:${ip}`, 15, 60000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          message: 'Bạn đang gửi câu hỏi quá nhanh. Vui lòng chờ 1 phút trước khi tiếp tục trò chuyện cùng AI.',
        },
        {
          status: 429,
          headers: getRateLimitHeaders(rateCheck.limit, rateCheck.remaining, rateCheck.resetMs),
        }
      );
    }

    const body = await request.json();

    // Honeypot bot detection
    const hpResult = verifyHoneypot(body, { clientIp: ip });
    if (hpResult.isBot) {
      return NextResponse.json(
        { success: false, message: 'Yêu cầu bị từ chối do phát hiện bot tự động.' },
        { status: 400 }
      );
    }

    const messages: ChatMessage[] = body.messages || [];

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Dữ liệu tin nhắn không hợp lệ.' },
        { status: 400 }
      );
    }

    const branchId = normalizeBranchId(body.branchId);
    const rawLastUserMsg = [...messages].reverse().find((m) => m.role === 'user')?.content || '';
    const lastUserMsg = sanitizeText(rawLastUserMsg, 500);

    // Load live SQL Server menu & coupons synced to the selected branch
    const bundle = await getChatbotMenuBundle(branchId);

    // Groq (https://console.groq.com) OpenAI-compatible configuration (server-only env vars)
    const baseUrl = (process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1').trim().replace(/\/+$/, '');
    const primaryModel = (process.env.GROQ_MODEL || process.env.LLM_MODEL_NAME || 'qwen/qwen3.8-27b').trim();
    const fallbackModel = 'openai/gpt-oss-120b';
    const rawKey = (process.env.GROQ_API_KEY || process.env.LLM_API_KEY || '').trim();
    const apiKey = rawKey.replace(/^["']|["']$/g, '');

    console.log(
      `[NooNee AI] Processing request with Groq. Model: ${primaryModel}, HasKey: ${!!apiKey}, Branch: ${branchId} (${bundle.branch.shortName}), MenuCount: ${bundle.availableProducts.length}, Source: ${bundle.source}, Region: ${process.env.VERCEL_REGION || 'local'}`
    );

    if (!apiKey) {
      console.warn('[NooNee AI] Missing GROQ_API_KEY. Using SQL Server keyword search fallback.');
      const fallbackItems = scoreAndSearchProducts(bundle.availableProducts, lastUserMsg, 2);
      return NextResponse.json({
        success: true,
        reply: `Dạ tại **CS ${bundle.branch.shortName}**, quán gợi ý bạn tham khảo món ngon đang được yêu thích tại NooNee:`,
        recommendedProducts: fallbackItems,
        branchId,
        branchName: bundle.branch.shortName,
      });
    }

    // System instruction: strictly concise, branch-synced with live SQL Server data, 100% hidden model/source
    const systemPrompt = `Bạn là trợ lý tư vấn món của quán ăn NooNee Food.
${bundle.promptContext}

QUY TẮC BẮT BUỘC:
1. Bạn đại diện cho quán NooNee. TUYỆT ĐỐI KHÔNG BAO GIỜ tiết lộ, nhắc đến hoặc hiển thị bất kỳ tên mô hình AI hay nhà cung cấp kỹ thuật nào.
2. PHONG CÁCH TIN NHẮN: CỰC KỲ NGẮN GỌN, súc tích, đi thẳng vào món ăn. KHÔNG chào hỏi dài dòng, KHÔNG giải thích lan man. Toàn bộ câu trả lời chỉ từ 2 đến 3 câu ngắn gọn.
3. CHỈ gợi ý các món có trong mục "THỰC ĐƠN ĐANG BÁN TẠI CƠ SỞ NÀY" (dấu * là món bán chạy nhất, dấu ★ là món đặc trưng riêng của cơ sở này). Nêu tên món, giá tiền và 1 lý do ngắn gọn. Có thể gợi ý thêm 1 món nước hoặc topping đi kèm.
4. Nếu khách hỏi món thuộc mục "CHỈ PHỤC VỤ TẠI ..." (cơ sở khác), hãy báo rõ món đó hiện chỉ bán ở cơ sở kia (khách có thể đổi cơ sở ở thanh chọn phía trên) và gợi ý ngay 1–2 món tương tự ĐANG BÁN tại cơ sở hiện tại (${bundle.branch.shortName}).
5. Nếu khách hỏi về khuyến mãi/mã giảm giá, giờ mở cửa hoặc địa chỉ cơ sở, trả lời chính xác theo dữ liệu trên.
6. ĐẶC BIỆT: Cuối câu trả lời, CHỈ đính kèm mã ID các món ĐANG BÁN TẠI CƠ SỞ HIỆN TẠI theo định dạng:
[[RECOMMENDED_FOODS: id1, id2]]
Ví dụ: [[RECOMMENDED_FOODS: 4, 45]]`;

    const recentMessages = messages.slice(-6);
    const apiMessages = [
      { role: 'system', content: systemPrompt },
      ...recentMessages.map((m) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: sanitizeText(m.content, 500),
      })),
    ];

    const callGroq = async (model: string) =>
      fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'User-Agent': 'NooNeeFood/1.0',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: apiMessages,
          temperature: 0.7,
          max_tokens: 800,
        }),
      });

    console.log(`[NooNee AI] Calling Groq endpoint: ${baseUrl}/chat/completions (Model: ${primaryModel})`);
    let response = await callGroq(primaryModel);

    // Fallback to secondary model if primary model hits rate limit or transient error
    if (!response.ok && primaryModel !== fallbackModel) {
      const errText = await response.text();
      const cfRay = response.headers.get('cf-ray') || 'none';
      console.warn(
        `[NooNee AI] Groq model ${primaryModel} returned ${response.status} (Region: ${process.env.VERCEL_REGION || 'local'}, cf-ray: ${cfRay}). Retrying with ${fallbackModel}...`,
        errText
      );
      response = await callGroq(fallbackModel);
    }

    if (!response.ok) {
      const errText = await response.text();
      const cfRay = response.headers.get('cf-ray') || 'none';
      console.error(
        `[NooNee AI] Groq API Error: ${response.status} (Region: ${process.env.VERCEL_REGION || 'local'}, cf-ray: ${cfRay})`,
        errText
      );

      const fallbackItems = scoreAndSearchProducts(bundle.availableProducts, lastUserMsg, 2);
      return NextResponse.json({
        success: true,
        reply: `Dạ tại **CS ${bundle.branch.shortName}**, quán gợi ý bạn tham khảo món ăn thơm ngon được yêu thích tại NooNee:`,
        recommendedProducts: fallbackItems,
        branchId,
        branchName: bundle.branch.shortName,
      });
    }

    const data = await response.json();
    const msgObj = data.choices?.[0]?.message;
    let replyText = (msgObj?.content || '').replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

    if (!replyText) {
      replyText = `Dạ tại **CS ${bundle.branch.shortName}**, quán gợi ý bạn chọn các món ngon bên dưới nhé!`;
    }

    // Extract [[RECOMMENDED_FOODS: 1, 2]]
    const foodIdMatches = replyText.match(/\[\[RECOMMENDED_FOODS:\s*([\d,\s]+)\]\]/i);
    let recommendedIds: number[] = [];

    if (foodIdMatches && foodIdMatches[1]) {
      recommendedIds = foodIdMatches[1]
        .split(',')
        .map((s: string) => parseInt(s.trim(), 10))
        .filter((n: number) => !isNaN(n));
      replyText = replyText.replace(/\[\[RECOMMENDED_FOODS:\s*([\d,\s]+)\]\]/i, '').trim();
    }

    // Strictly validate IDs against live SQL Server dishes available at the active branch
    let recommendedProducts: Product[] = pickRecommendedProductsForBranch(
      recommendedIds,
      bundle.availableProducts,
      4
    );

    // If model omitted tags or all returned IDs were filtered out (e.g. other branch / out of stock), scan reply text
    if (recommendedProducts.length === 0) {
      const mentionedIds = extractMentionedProductIds(replyText, bundle.availableProducts, 3);
      recommendedProducts = pickRecommendedProductsForBranch(
        mentionedIds,
        bundle.availableProducts,
        3
      );
    }

    return NextResponse.json({
      success: true,
      reply: replyText,
      recommendedProducts,
      branchId,
      branchName: bundle.branch.shortName,
    });
  } catch (error: any) {
    console.error('Chatbot API Route Error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Đã xảy ra lỗi khi xử lý tin nhắn.',
      },
      { status: 500 }
    );
  }
}
