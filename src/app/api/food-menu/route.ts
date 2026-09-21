import { NextResponse } from 'next/server';
import { getFoodMenuItems } from '@/lib/foodMenu';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const products = await getFoodMenuItems();
    return NextResponse.json(
      { success: true, data: products },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      }
    );
  } catch (error: any) {
    console.error('Error in food-menu route:', error);
    return NextResponse.json(
      { success: false, message: 'Không thể tải thực đơn' },
      { status: 500 }
    );
  }
}
