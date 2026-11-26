import { NextRequest, NextResponse } from 'next/server';
import { getFoodMenuItems } from '@/lib/foodMenu';
import { normalizeBranchId } from '@/lib/cartUtils';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const branchParam = searchParams.get('branchId') || searchParams.get('branch');
    const includeUnavailable = searchParams.get('includeUnavailable') === 'true';

    const branchId: number | 'all' | undefined =
      branchParam === 'all'
        ? 'all'
        : branchParam
          ? normalizeBranchId(branchParam)
          : undefined;

    const products = await getFoodMenuItems({
      branchId,
      availableOnly: !includeUnavailable,
    });

    return NextResponse.json(
      {
        success: true,
        branchId: branchId ?? 'all',
        data: products,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=30',
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
