import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { connectDB } from '@/lib/db';
import { User } from '@/lib/db/models/User';
import { TherapistProfile } from '@/lib/db/models/TherapistProfile';

export const dynamic = 'force-dynamic';

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    let therapistProfileId = (session.user as { therapistProfileId?: string | null }).therapistProfileId;

    // JWT may be stale — fall back to DB
    if (!therapistProfileId) {
      await connectDB();
      const dbUser = await User.findById(session.user.id).select('therapistProfileId').lean();
      therapistProfileId = dbUser?.therapistProfileId ? String(dbUser.therapistProfileId) : null;
    }

    if (!therapistProfileId) {
      return NextResponse.json({ error: 'No therapist profile linked to this account' }, { status: 403 });
    }

    const body = await req.json() as Record<string, unknown>;

    // Whitelist updatable fields
    const allowed = [
      'bio',
      'displayName',
      'specialisations',
      'specialisationsOther',
      'sessionTypesOther',
      'languages',
      'sessionTypes',
      'insuranceAccepted',
      'feeRange',
      'contactPhone',
      'contactEmail',
      'isAcceptingPatients',
      'location',
      'mohRegistrationNumber',
      'gender',
      'photo',
    ];

    const update: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in body) update[key] = body[key];
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    // Auto-activate the profile once the therapist provides their city
    const locationCity = (update.location as { city?: string } | undefined)?.city?.trim();
    if (locationCity) {
      update.isActive = true;
    }

    await connectDB();
    const profile = await TherapistProfile.findByIdAndUpdate(
      therapistProfileId,
      { $set: update },
      { new: true, runValidators: true }
    ).lean();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[PATCH /api/dashboard/profile]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
