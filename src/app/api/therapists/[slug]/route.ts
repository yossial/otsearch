import { NextRequest, NextResponse } from 'next/server';
import { getTherapistBySlug, incrementProfileViews } from '@/lib/db/therapists';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const profile = await getTherapistBySlug(slug);

    if (!profile) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Fire-and-forget — don't block the response
    incrementProfileViews(slug);

    return NextResponse.json(profile);
  } catch (err) {
    console.error('[GET /api/therapists/[slug]]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
