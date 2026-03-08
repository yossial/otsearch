import { NextResponse } from 'next/server';
import { getIsraelCities } from '@/lib/gov/govApi';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const onlyCities = searchParams.get('onlyCities') === 'true';
    const district = searchParams.get('district') ?? '';

    let cities = await getIsraelCities();

    if (onlyCities) {
      cities = cities.filter((c) => c.isIndependent);
    }
    if (district) {
      cities = cities.filter((c) => c.district === district);
    }

    return NextResponse.json({ cities });
  } catch {
    return NextResponse.json({ cities: [] });
  }
}
