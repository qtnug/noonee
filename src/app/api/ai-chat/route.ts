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

    // API Key resolution (supports standard env keys)
    const apiKey =
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_API_KEY ||
      process.env.GOOGLE_GENAI_API_KEY;

    // Model name specified by user: Gemma 4 31B (instruction-tuned)
    const modelName = process.env.GEMMA_MODEL_NAME || 'gemma-4-31b-it';

    // If API key is not yet configured, provide helpful menu assistance with setup reminder
    if (!apiKey) {
      const matchedProducts = await searchFoodsKeyword(lastUserMsg, 4);
      let replyText = `Xin chào bạn! Mình là NooNee AI 🍽️.\n\n`;

      if (matchedProducts.length > 0) {
        replyText += `Dựa trên yêu cầu của bạn, mình xin gợi ý các món ngon nổi bật trong thực đơn của quán:\n\n`;
        for (const p of matchedProducts) {
          replyText += `• **${p.name}** - ${p.price.toLocaleString('vi-VN')}đ: ${p.description}\n`;
        }
        replyText += `\nBạn có thể bấm trực tiếp vào thẻ món bên dưới để thêm ngay vào giỏ hàng hoặc xem chi tiết nhé!`;
      } else {
        replyText += `Bạn muốn thưởng thức món gì hôm nay? Quán có rất nhiều lựa chọn hấp dẫn như Cơm tấm, Phở bò, Bún bò huế, Nem chua rán, Trà sữa và Đồ uống giải khát mát lạnh!`;
      }

      replyText += `\n\n> 💡 *Ghi chú cấu hình:* Để kích hoạt đầy đủ trí tuệ nhân tạo **Gemma 4 31B** từ Google API, bạn chỉ cần cấu hình biến môi trường \`GEMINI_API_KEY\` trong tệp \`.env\` trên host.`;

      return NextResponse.json({
        success: true,
        reply: replyText,
        recommendedProducts: matchedProducts,
        isFallback: true,
      });
    }

    // Prepare system instruction for Gemma 4 31B
    const systemPrompt = `Bạn là "NooNee AI" - Trợ lý ẩm thực AI thông minh, nhiệt tình và thân thiện của quán ăn NooNee Food.
Bạn đang vận hành trên mô hình Gemma 4 31B từ Google API.
Nhiệm vụ của bạn: Tư vấn món ăn, giải đáp thắc mắc về thực đơn, và giúp khách hàng chọn món ngon phù hợp nhất từ thực đơn quán NooNee Food (được cung cấp từ food.csv).

DỮ LIỆU THỰC ĐƠN QUÁN NOONEE FOOD:
${menuSummary}

QUY TẮC BẮT BUỘC:
1. CHỈ tư vấn và giới thiệu các món có thực trong danh sách trên. TUYỆT ĐỐI KHÔNG tự bịa ra món ăn không có trong thực đơn NooNee Food.
2. Thái độ: Luôn lịch sự, ấm áp, hào hứng, xưng "NooNee AI" hoặc "mình", gọi khách là "bạn". Sử dụng tiếng Việt tự nhiên, kèm emoji món ăn sinh động.
3. Lắng nghe và thấu hiểu nhu cầu của khách:
   - Khung giờ ăn: Bữa sáng nhẹ nhàng, bữa trưa no nê, bữa xế ăn vặt, bữa tối gia đình, ăn khuya.
   - Khẩu vị: Cay nồng, thanh đạm, béo ngậy, chua cay, ngọt mát.
   - Sở thích nguyên liệu: Thịt bò, gà, hải sản, bún/phở nước, cơm chiên/cơm tấm, đồ ăn vặt chiên giòn, trà sữa & nước ép giải nhiệt.
   - Ngân sách: Gợi ý các món phù hợp túi tiền của khách (ví dụ dưới 30k, 40k, combo cơm kèm nước...).
4. Ưu tiên các món có trạng thái "Có sẵn". Nếu khách hỏi món đang "Tạm hết", nhã nhặn giải thích và gợi ý món tương tự đang có sẵn.
5. Khi giới thiệu món, luôn nêu rõ giá tiền, điểm hấp dẫn, và gợi ý thêm topping ăn kèm hoặc một món nước uống phù hợp.
6. ĐẶC BIỆT - ĐỊNH DẠNG MÓN ĐỀ XUẤT:
   Khi giới thiệu món cụ thể, ở cuối câu trả lời bạn HÃY THÊM thẻ danh sách ID các món bạn đề xuất (tối đa 4 món) theo cú pháp:
   [[RECOMMENDED_FOODS: id1, id2, id3]]
   Ví dụ: [[RECOMMENDED_FOODS: 1, 40]]
   Thẻ này sẽ giúp hệ thống tự động hiển thị thẻ món ăn kèm nút "Thêm vào giỏ hàng" cho khách.`;

    // Format messages for Google Generative Language API
    const googleContents = messages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    let response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: systemPrompt }],
        },
        contents: googleContents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
        },
      }),
    });

    // If systemInstruction is not accepted by this specific model/proxy, retry with system prompt prepended
    if (!response.ok && response.status === 400) {
      const errJson = await response.json().catch(() => ({}));
      console.warn('System instruction failed, retrying with prepended context:', errJson);

      const mergedContents = [
        {
          role: 'user',
          parts: [{ text: `${systemPrompt}\n\n---\nBắt đầu cuộc trò chuyện với khách hàng:` }],
        },
        {
          role: 'model',
          parts: [{ text: 'Chào bạn! Mình là NooNee AI, rất hân hạnh được gợi ý món ngon cho bạn hôm nay! Bạn muốn ăn gì nào? 😊' }],
        },
        ...googleContents,
      ];

      response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: mergedContents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048,
          },
        }),
      });
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google API Error:', response.status, errorText);

      // Fallback gracefully instead of breaking the chat
      const fallbackItems = await searchFoodsKeyword(lastUserMsg, 3);
      return NextResponse.json({
        success: true,
        reply: `Dạ NooNee AI đang gặp chút gián đoạn khi kết nối máy chủ Google (${response.status}). Dù vậy, mình vẫn xin gợi ý cho bạn những món ngon rất được yêu thích tại quán:\n\n` +
          fallbackItems.map((p) => `• **${p.name}** (${p.price.toLocaleString('vi-VN')}đ) - ${p.description}`).join('\n') +
          `\n\nBạn hãy thử lại sau ít phút hoặc chọn ngay các món bên dưới nhé!`,
        recommendedProducts: fallbackItems,
        isFallback: true,
      });
    }

    const data = await response.json();
    let replyText = '';

    if (data.candidates && data.candidates[0]?.content?.parts) {
      replyText = data.candidates[0].content.parts
        .map((p: any) => p.text || '')
        .join('');
    }

    if (!replyText) {
      replyText = 'Dạ NooNee AI chưa hiểu rõ ý bạn, bạn có thể nói rõ hơn về khẩu vị hoặc món bạn muốn ăn được không ạ?';
    }

    // Extract [[RECOMMENDED_FOODS: 1, 2, 3]]
    const foodIdMatches = replyText.match(/\[\[RECOMMENDED_FOODS:\s*([\d,\s]+)\]\]/i);
    let recommendedIds: number[] = [];

    if (foodIdMatches && foodIdMatches[1]) {
      recommendedIds = foodIdMatches[1]
        .split(',')
        .map((s) => parseInt(s.trim(), 10))
        .filter((n) => !isNaN(n));
      // Remove the internal markup from user-visible reply
      replyText = replyText.replace(/\[\[RECOMMENDED_FOODS:\s*([\d,\s]+)\]\]/i, '').trim();
    }

    // If model didn't return tags, scan for mentioned food names
    if (recommendedIds.length === 0) {
      for (const prod of allProducts) {
        if (replyText.toLowerCase().includes(prod.name.toLowerCase())) {
          recommendedIds.push(prod.id);
          if (recommendedIds.length >= 4) break;
        }
      }
    }

    const recommendedProducts: Product[] = await findFoodsByIds(recommendedIds);

    return NextResponse.json({
      success: true,
      reply: replyText,
      recommendedProducts,
      model: modelName,
    });
  } catch (error: any) {
    console.error('Chatbot API Route Error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Đã xảy ra lỗi khi xử lý tin nhắn.',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
