import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { connectDB } from '@/lib/db';
import { User } from '@/lib/db/models/User';
import { TherapistProfile } from '@/lib/db/models/TherapistProfile';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await auth();
  const role = (session?.user as { role?: string | null } | undefined)?.role;
  if (role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await connectDB();

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalUsers,
    totalTherapists,
    activeTherapists,
    premiumTherapists,
    featuredTherapists,
    newUsersThisMonth,
    profileViewsResult,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: 'therapist' }),
    TherapistProfile.countDocuments({ isActive: true }),
    TherapistProfile.countDocuments({ subscriptionTier: 'premium' }),
    TherapistProfile.countDocuments({ isFeatured: true }),
    User.countDocuments({ createdAt: { $gte: startOfMonth } }),
    TherapistProfile.aggregate<{ total: number }>([
      { $group: { _id: null, total: { $sum: '$profileViews' } } },
    ]),
  ]);

  const totalProfileViews = profileViewsResult[0]?.total ?? 0;

  return NextResponse.json({
    totalUsers,
    totalTherapists,
    activeTherapists,
    premiumTherapists,
    featuredTherapists,
    newUsersThisMonth,
    totalProfileViews,
  });
}
