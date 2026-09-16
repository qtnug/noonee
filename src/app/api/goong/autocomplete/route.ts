import { NextRequest, NextResponse } from 'next/server';
import { searchGoongPlaces } from '@/lib/goong';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const input = searchParams.get('input') || '';

    if (!input.trim()) {
      return NextResponse.json({ success: true, predictions: [] });
    }

    const predictions = await searchGoongPlaces(input.trim());
    return NextResponse.json({
      success: true,
      predictions,
    });
  } catch (error: any) {
    console.error('Error in GET /api/goong/autocomplete:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Lỗi khi tìm kiếm địa chỉ',
        predictions: [],
      },
      { status: 500 }
    );
  }
}
