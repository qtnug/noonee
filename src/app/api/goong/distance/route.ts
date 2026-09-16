import { NextRequest, NextResponse } from 'next/server';
import { calculateDistanceFromStore } from '@/lib/goong';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const placeId = searchParams.get('placeId') || undefined;
    const address = searchParams.get('address') || undefined;
    const latParam = searchParams.get('lat');
    const lngParam = searchParams.get('lng');

    const lat = latParam ? parseFloat(latParam) : undefined;
    const lng = lngParam ? parseFloat(lngParam) : undefined;

    if (!placeId && !address && (!lat || !lng)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Vui lòng cung cấp placeId, address hoặc tọa độ lat/lng',
        },
        { status: 400 }
      );
    }

    const result = await calculateDistanceFromStore({
      placeId,
      address,
      lat,
      lng,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Error in GET /api/goong/distance:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Lỗi tính khoảng cách và phí vận chuyển',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { placeId, address, lat, lng } = body;

    if (!placeId && !address && (!lat || !lng)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Vui lòng cung cấp placeId, address hoặc tọa độ lat/lng',
        },
        { status: 400 }
      );
    }

    const result = await calculateDistanceFromStore({
      placeId,
      address,
      lat: typeof lat === 'number' ? lat : lat ? parseFloat(lat) : undefined,
      lng: typeof lng === 'number' ? lng : lng ? parseFloat(lng) : undefined,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Error in POST /api/goong/distance:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Lỗi tính khoảng cách và phí vận chuyển',
      },
      { status: 500 }
    );
  }
}
