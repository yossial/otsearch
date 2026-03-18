import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { connectDB } from '@/lib/db';
import { User } from '@/lib/db/models/User';
import { TherapistProfile } from '@/lib/db/models/TherapistProfile';

export const dynamic = 'force-dynamic';

async function getProfile(userId: string) {
  const user = await User.findById(userId).select('therapistProfileId').lean();
  if (!user?.therapistProfileId) return null;
  return TherapistProfile.findById(user.therapistProfileId);
}

export async function GET() {
  const session = await auth();
  const role = (session?.user as { role?: string | null } | undefined)?.role;
  if (!session?.user?.id || role !== 'therapist') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await connectDB();
  const profile = await getProfile(session.user.id);
  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

  return NextResponse.json({ businessDetails: profile.businessDetails ?? {} });
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as { role?: string | null } | undefined)?.role;
  if (!session?.user?.id || role !== 'therapist') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json() as Record<string, unknown>;
  const allowed = ['businessName', 'businessNumber', 'vatNumber', 'businessAddress', 'businessType'] as const;
  const update: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) update[`businessDetails.${key}`] = body[key];
  }

  await connectDB();
  const profile = await getProfile(session.user.id);
  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

  await TherapistProfile.findByIdAndUpdate(profile._id, { $set: update });
  const updated = await TherapistProfile.findById(profile._id).select('businessDetails').lean();

  return NextResponse.json({ businessDetails: updated?.businessDetails ?? {} });
}
