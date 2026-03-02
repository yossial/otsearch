import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { connectDB } from '@/lib/db';
import { User } from '@/lib/db/models/User';
import { OTProfile } from '@/lib/db/models/OTProfile';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json() as { role?: string };
    const { role } = body;

    if (!role || !['ot', 'patient'].includes(role)) {
      return NextResponse.json({ error: 'invalid role' }, { status: 400 });
    }

    await connectDB();

    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prevent re-assigning a role that's already set
    if (user.role) {
      return NextResponse.json(
        { error: 'Role already assigned', role: user.role, otProfileId: user.otProfileId ? String(user.otProfileId) : null },
        { status: 409 }
      );
    }

    user.role = role as 'ot' | 'patient';
    await user.save();

    let otProfileId: string | null = null;

    if (role === 'ot') {
      const name = user.name;
      const baseSlug = name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\w\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-');
      const slug = `${baseSlug}-${String(user._id).slice(-4)}`;

      const profile = await OTProfile.create({
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

      user.otProfileId = profile._id;
      await user.save();
      otProfileId = String(profile._id);
    }

    return NextResponse.json({ ok: true, role, otProfileId });
  } catch (err) {
    console.error('[POST /api/auth/set-role]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
