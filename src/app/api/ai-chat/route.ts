import { NextRequest, NextResponse } from 'next/server';
import {
  getFoodMenuSummaryForPrompt,
  findFoodsByIds,
  getFoodMenuItems,
  searchFoodsKeyword,
} from '@/lib/foodMenu';
import { Product } from '@/types';

export const dynamic = 'force-dynamic';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const messages: ChatMessage[] = body.messages || [];

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Dữ liệu tin nhắn không hợp lệ.' },
        { status: 400 }
      );
    }

    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user')?.content || '';
    const menuSummary = await getFoodMenuSummaryForPrompt();
    const allProducts = await getFoodMenuItems();

    // LLM7.io OpenAI-compatible configuration
    const baseUrl = process.env.LLM7_BASE_URL || 'https://api.llm7.io/v1';
    const modelName = process.env.LLM_MODEL_NAME || 'gemini-3.1-flash-lite';
    const apiKey = process.env.LLM7_API_KEY || process.env.GEMINI_API_KEY || '';

    // If API key is not configured, reply directly using keyword matching from Food.csv
    if (!apiKey) {
      const matchedProducts = await searchFoodsKeyword(lastUserMsg, 2);
      let replyText = `Dạ NooNee AI gợi ý bạn món ăn phù hợp với yêu cầu:\n\n`;

      if (matchedProducts.length > 0) {
        for (const p of matchedProducts) {
          replyText += `• **${p.name}** (${p.price.toLocaleString('vi-VN')}đ): ${p.description}\n`;
        }
      } else {
        replyText += `Bạn có thể xem các món ngon bán chạy bên dưới nhé!`;
      }

      return NextResponse.json({
        success: true,
        reply: replyText.trim(),
        recommendedProducts: matchedProducts,
      });
    }

    // System instruction: strictly concise, practical, 100% hidden model/source
    const systemPrompt = `Bạn là NooNee AI - trợ lý ẩm thực của quán ăn NooNee Food.
DỮ LIỆU THỰC ĐƠN QUÁN NOONEE FOOD:
${menuSummary}

QUY TẮC BẮT BUỘC:
1. Bạn là NooNee AI. TUYỆT ĐỐI KHÔNG BAO GIỜ tiết lộ, nhắc đến hoặc hiển thị bất kỳ tên mô hình AI nào (Gemini, Gemma, GPT,...), không nhắc đến API, nhà cung cấp, hoặc bất kỳ nguồn kỹ thuật nào.
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

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: modelName,
        messages: apiMessages,
        temperature: 0.7,
        max_tokens: 600,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('LLM API Error:', response.status, errText);

      // Fallback gracefully without revealing any technical errors
      const fallbackItems = await searchFoodsKeyword(lastUserMsg, 2);
      return NextResponse.json({
        success: true,
        reply: `Dạ NooNee AI gợi ý bạn tham khảo món ăn thơm ngon được yêu thích tại quán:`,
        recommendedProducts: fallbackItems,
      });
    }

    const data = await response.json();
    let replyText = data.choices?.[0]?.message?.content || '';

    if (!replyText) {
      replyText = 'Dạ NooNee AI gợi ý bạn chọn các món ngon bên dưới nhé!';
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
