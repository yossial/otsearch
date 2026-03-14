import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { connectDB } from '@/lib/db';
import { User } from '@/lib/db/models/User';
import { TherapistProfile } from '@/lib/db/models/TherapistProfile';

/**
 * POST /api/auth/set-role
 * Called during onboarding to create a therapist profile and set role = 'therapist'.
 * All new users are therapists — there is no patient role.
 */
export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Idempotent: if already set up, return existing state
    if (user.role === 'therapist' && user.therapistProfileId) {
      return NextResponse.json({
        ok: true,
        role: user.role,
        therapistProfileId: String(user.therapistProfileId),
      });
    }

    // Create therapist profile
    const name = user.name;
    const baseSlug = name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-') // Spaces to hyphens
      // This regex keeps Hebrew characters (\u0590-\u05FF), English (\w), and hyphens
      .replace(/[^\u0590-\u05FF\w-]/g, ''); 

    // 2. Add a unique suffix (Short UUID style)
    // If you don't want to install nanoid, use this crypto-based one-liner:
    const uniqueSuffix = Math.random().toString(36).slice(2);

    const slug = `${baseSlug || 'profile'}-${uniqueSuffix}`;

    const profile = await TherapistProfile.create({
      slug,
      displayName: { he: name, ar: name, en: name },
      bio: { he: '', ar: '', en: '' },
      mohRegistrationNumber: '',
      specialisations: [],
      languages: ['he'],
      location: {
        type: 'Point',
        coordinates: [34.7818, 32.0853],
        city: '',
        address: '',
      },
      sessionTypes: [],
      insuranceAccepted: [],
      contactEmail: user.email,
      contactPhone: '',
      subscriptionTier: 'free',
      isActive: false,
    });

    user.role = 'therapist';
    user.therapistProfileId = profile._id;
    await user.save();

    return NextResponse.json({
      ok: true,
      role: 'therapist',
      therapistProfileId: String(profile._id),
    });
  } catch (err) {
    console.error('[POST /api/auth/set-role]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
