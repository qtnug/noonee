import { NextRequest, NextResponse } from 'next/server';
import {
  getFoodMenuSummaryForPrompt,
  findFoodsByIds,
  getFoodMenuItems,
  searchFoodsKeyword,
} from '@/lib/foodMenu';
import { Product } from '@/types';
import { checkRateLimit, getClientIp, getRateLimitHeaders } from '@/lib/rateLimit';
import { verifyHoneypot, sanitizeText } from '@/lib/security';

export const dynamic = 'force-dynamic';

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

    const rawLastUserMsg = [...messages].reverse().find((m) => m.role === 'user')?.content || '';
    const lastUserMsg = sanitizeText(rawLastUserMsg, 500);
    const menuSummary = await getFoodMenuSummaryForPrompt();
    const allProducts = await getFoodMenuItems();

    // LLM7 (https://llm7.io) OpenAI-compatible configuration (server-only env vars)
    const baseUrl = (process.env.LLM7_BASE_URL || 'https://api.llm7.io/v1').trim();
    const modelName = (process.env.LLM_MODEL_NAME || 'fast').trim();
    const rawKey =
      process.env.LLM7_API_KEY ||
      process.env.LLM_API_KEY ||
      process.env.LLM7_TOKEN ||
      '';

    const apiKey = rawKey.trim().replace(/^["']|["']$/g, '');

    console.log(
      `[NooNee AI] Processing request with LLM7. Model: ${modelName}, HasKey: ${!!apiKey}`
    );

    // System instruction: strictly concise, practical, 100% hidden model/source
    const systemPrompt = `Bạn là trợ lý tư vấn món của quán ăn NooNee Food.
DỮ LIỆU THỰC ĐƠN QUÁN NOONEE FOOD:
${menuSummary}

QUY TẮC BẮT BUỘC:
1. Bạn đại diện cho quán NooNee. TUYỆT ĐỐI KHÔNG BAO GIỜ tiết lộ, nhắc đến hoặc hiển thị bất kỳ tên mô hình AI hay nhà cung cấp kỹ thuật nào.
2. PHONG CÁCH TIN NHẮN: CỰC KỲ NGẮN GỌN, súc tích, đi thẳng vào món ăn. KHÔNG chào hỏi dài dòng, KHÔNG giải thích lan man. Toàn bộ câu trả lời chỉ từ 2 đến 3 câu ngắn gọn.
3. CHỈ gợi ý các món có trong thực đơn trên. Nêu tên món, giá tiền và 1 lý do ngắn gọn vì sao nên chọn. Có thể gợi ý thêm 1 topping hoặc 1 món nước đi kèm.
4. ĐẶC BIỆT: Cuối câu trả lời, hãy đính kèm mã ID các món đề xuất theo định dạng:
[[RECOMMENDED_FOODS: id1, id2]]
Ví dụ: [[RECOMMENDED_FOODS: 4, 45]]`;

    const apiMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map((m) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      })),
    ];

    // 1. Determine model and auth credentials based on official LLM7 docs
    const targetModel = modelName || 'fast';
    const authHeader = apiKey ? `Bearer ${apiKey}` : 'Bearer unused';

    console.log(`[NooNee AI] Calling LLM7 endpoint: ${baseUrl}/chat/completions (Model: ${targetModel}, HasKey: ${!!apiKey})`);

    let response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify({
        model: targetModel,
        messages: apiMessages,
        temperature: 0.7,
        max_tokens: 600,
      }),
    });

    // 2. If the custom model returned 401/error (e.g. key missing/expired on host),
    // automatically fallback to LLM7's free anonymous 'fast' model as documented in docs.llm7.io
    if (!response.ok && targetModel !== 'fast') {
      const errText = await response.text();
      console.warn(`[NooNee AI] Model ${targetModel} returned ${response.status}. Retrying with LLM7 anonymous model 'fast'...`, errText);

      response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer unused',
        },
        body: JSON.stringify({
          model: 'fast',
          messages: apiMessages,
          temperature: 0.7,
          max_tokens: 600,
        }),
      });
    }

    if (!response.ok) {
      const errText = await response.text();
      console.error('[NooNee AI] LLM7 API Error:', response.status, errText);

      const fallbackItems = await searchFoodsKeyword(lastUserMsg, 2);
      return NextResponse.json({
        success: true,
        reply: `Dạ quán gợi ý bạn tham khảo món ăn thơm ngon được yêu thích tại NooNee:`,
        recommendedProducts: fallbackItems,
      });
    }

    const data = await response.json();
    const msgObj = data.choices?.[0]?.message;
    let replyText = (msgObj?.content || msgObj?.reasoning_content || '').trim();

    if (!replyText) {
      replyText = 'Dạ quán gợi ý bạn chọn các món ngon bên dưới nhé!';
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

    // If model didn't return tags, scan for mentioned food names
    if (recommendedIds.length === 0) {
      for (const prod of allProducts) {
        if (replyText.toLowerCase().includes(prod.name.toLowerCase())) {
          recommendedIds.push(prod.id);
          if (recommendedIds.length >= 3) break;
        }
      }
    }

    const recommendedProducts: Product[] = await findFoodsByIds(recommendedIds);

    return NextResponse.json({
      success: true,
      reply: replyText,
      recommendedProducts,
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
