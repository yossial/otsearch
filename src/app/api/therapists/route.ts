import { NextRequest, NextResponse } from 'next/server';
import { searchTherapists } from '@/lib/db/therapists';
import { searchMockTherapists } from '@/lib/mock-search';
import type { SearchParams } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;

  const specialisations = sp.getAll('specialisation').filter(Boolean);
  const insurances = sp.getAll('insurance').filter(Boolean);
  const sessionTypes = sp.getAll('sessionType').filter(Boolean);
  const languages = sp.getAll('language').filter(Boolean);

  const query: SearchParams = {
    q: sp.get('q') ?? undefined,
    specialisation: specialisations.length > 0
      ? (specialisations as SearchParams['specialisation'])
      : undefined,
    insurance: insurances.length > 0
      ? (insurances as SearchParams['insurance'])
      : undefined,
    sessionType: sessionTypes.length > 0
      ? (sessionTypes as SearchParams['sessionType'])
      : undefined,
    language: languages.length > 0 ? languages : undefined,
    city: sp.get('city') ?? undefined,
    acceptingOnly: sp.get('acceptingOnly') === 'true',
    sort: (sp.get('sort') as SearchParams['sort']) ?? 'rating',
    page: sp.get('page') ? parseInt(sp.get('page')!, 10) : 1,
    limit: sp.get('limit') ? parseInt(sp.get('limit')!, 10) : 20,
  };

  try {
    const result = await searchTherapists(query);
    return NextResponse.json(result);
  } catch (err) {
    console.warn('[GET /api/therapists] DB unavailable, using mock data:', (err as Error).message);
    const result = searchMockTherapists(query);
    return NextResponse.json(result);
  }
}
