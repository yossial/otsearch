import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { connectDB } from '@/lib/db';
import { OTProfile } from '@/lib/db/models/OTProfile';
import { Review } from '@/lib/db/models/Review';
import { getOTReviews, recalculateRatingStats } from '@/lib/db/ots';

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const { slug } = await params;
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') ?? '1', 10);
  const limit = parseInt(searchParams.get('limit') ?? '10', 10);

  const result = await getOTReviews(slug, { page, limit });
  if (!result) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json(result);
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  const { slug } = await params;

  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userRole = (session.user as { role?: string }).role;
  if (userRole === 'ot') {
    return NextResponse.json({ error: 'Therapists cannot leave reviews' }, { status: 403 });
  }

  const body = await req.json();
  const { rating, text } = body;

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Rating must be an integer between 1 and 5' }, { status: 422 });
  }
  if (typeof text !== 'string' || text.length < 20 || text.length > 1000) {
    return NextResponse.json({ error: 'Review text must be 20–1000 characters' }, { status: 422 });
  }

  await connectDB();
  const profile = await OTProfile.findOne({ slug, isActive: true }).lean();
  if (!profile) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  try {
    const review = await Review.create({
      userId: session.user.id,
      otProfileId: profile._id,
      rating,
      text: text.trim(),
    });

    recalculateRatingStats(String(profile._id));

    return NextResponse.json({ id: String(review._id) }, { status: 201 });
  } catch (err: unknown) {
    if ((err as { code?: number }).code === 11000) {
      return NextResponse.json({ error: 'You have already reviewed this therapist' }, { status: 409 });
    }
    throw err;
  }
}
