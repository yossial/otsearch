import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { connectDB } from '@/lib/db';
import { OTProfile } from '@/lib/db/models/OTProfile';

export const dynamic = 'force-dynamic';

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const otProfileId = (session.user as { otProfileId?: string | null }).otProfileId;
    if (!otProfileId) {
      return NextResponse.json({ error: 'No OT profile linked to this account' }, { status: 403 });
    }

    const body = await req.json() as Record<string, unknown>;

    // Whitelist updatable fields
    const allowed = [
      'bio',
      'displayName',
      'specialisations',
      'languages',
      'sessionTypes',
      'insuranceAccepted',
      'feeRange',
      'contactPhone',
      'contactEmail',
      'isAcceptingPatients',
      'location',
      'mohRegistrationNumber',
    ];

    const update: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in body) update[key] = body[key];
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    // Auto-activate the profile once the OT provides their city — the minimum
    // required to appear in search results. Once active, manual deactivation
    // must be done by an admin.
    const locationCity = (update.location as { city?: string } | undefined)?.city?.trim();
    if (locationCity) {
      update.isActive = true;
    }

    await connectDB();
    const profile = await OTProfile.findByIdAndUpdate(
      otProfileId,
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
