import { NextResponse } from 'next/server';
import { getProductsWithAvailability } from '@/lib/reservation';

export async function GET() {
  try {
    const products = await getProductsWithAvailability();
    return NextResponse.json(products);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Unable to fetch products' }, { status: 500 });
  }
}
