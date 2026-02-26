import { NextRequest, NextResponse } from 'next/server';
import { searchOTs } from '@/lib/db/ots';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;

    const result = await searchOTs({
      q: sp.get('q') ?? undefined,
      specialisation: sp.getAll('specialisation').filter(Boolean),
      insurance: sp.getAll('insurance').filter(Boolean),
      sessionType: sp.getAll('sessionType').filter(Boolean),
      language: sp.getAll('language').filter(Boolean),
      city: sp.get('city') ?? undefined,
      acceptingOnly: sp.get('acceptingOnly') === 'true',
      page: sp.get('page') ? parseInt(sp.get('page')!, 10) : undefined,
      limit: sp.get('limit') ? parseInt(sp.get('limit')!, 10) : undefined,
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error('[GET /api/ots]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
