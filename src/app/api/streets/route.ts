import { NextRequest, NextResponse } from 'next/server';
import { getStreetsByCityCode } from '@/lib/gov/govApi';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const cityCode = parseInt(searchParams.get('cityCode') || '', 10);

  if (!cityCode || isNaN(cityCode)) {
    return NextResponse.json({ error: 'Valid cityCode is required' }, { status: 400 });
  }

  const streets = await getStreetsByCityCode(cityCode);
  
  return NextResponse.json({ 
    success: true, 
    count: streets.length, 
    streets 
  });
}