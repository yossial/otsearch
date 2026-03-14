import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { connectDB } from '@/lib/db';
import { TherapistProfile } from '@/lib/db/models/TherapistProfile';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as { role?: string | null } | undefined)?.role;
  if (role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await connectDB();

  const { searchParams } = req.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)));
  const tier = searchParams.get('tier') ?? '';
  const featured = searchParams.get('featured') ?? '';
  const active = searchParams.get('active') ?? '';
  const q = searchParams.get('q') ?? '';

  const filter: Record<string, unknown> = {};
  if (tier) filter.subscriptionTier = tier;
  if (featured === 'true') filter.isFeatured = true;
  else if (featured === 'false') filter.isFeatured = false;
  if (active === 'true') filter.isActive = true;
  else if (active === 'false') filter.isActive = false;
  if (q.trim()) {
    const regex = { $regex: q.trim(), $options: 'i' };
    filter.$or = [
      { 'displayName.he': regex },
      { 'displayName.en': regex },
      { 'location.city': regex },
    ];
  }

  const skip = (page - 1) * limit;
  const [docs, total] = await Promise.all([
    TherapistProfile.find(filter)
      .select('slug displayName location subscriptionTier isFeatured isActive isAcceptingPatients profileViews createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    TherapistProfile.countDocuments(filter),
  ]);

  const therapists = docs.map((d) => ({
    id: String(d._id),
    slug: d.slug,
    displayName: d.displayName,
    city: d.location?.city ?? '',
    subscriptionTier: d.subscriptionTier,
    isFeatured: d.isFeatured,
    isActive: d.isActive,
    isAcceptingPatients: d.isAcceptingPatients,
    profileViews: d.profileViews,
    createdAt: d.createdAt,
  }));

  return NextResponse.json({ therapists, total, page, totalPages: Math.ceil(total / limit) });
}
