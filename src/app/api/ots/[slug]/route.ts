import { NextRequest, NextResponse } from 'next/server';
import { getOTBySlug, incrementProfileViews } from '@/lib/db/ots';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const profile = await getOTBySlug(slug);

    if (!profile) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Fire-and-forget — don't block the response
    incrementProfileViews(slug);

    return NextResponse.json(profile);
  } catch (err) {
    console.error('[GET /api/ots/[slug]]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
