import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/db';
import { User } from '@/lib/db/models/User';
import { OTProfile } from '@/lib/db/models/OTProfile';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      email?: string;
      password?: string;
      name?: string;
      role?: string;
    };
    const { email, password, name, role } = body;

    if (!email || !password || !name || !role) {
      return NextResponse.json({ error: 'required' }, { status: 400 });
    }
    if (!['ot', 'patient'].includes(role)) {
      return NextResponse.json({ error: 'invalid role' }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'passwordTooShort' }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'invalidEmail' }, { status: 400 });
    }

    await connectDB();

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return NextResponse.json({ error: 'emailExists' }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({
      email: email.toLowerCase(),
      passwordHash,
      name,
      role,
    });

    // For OT registrations: create a draft profile (inactive until complete)
    if (role === 'ot') {
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
        contactEmail: email.toLowerCase(),
        contactPhone: '',
        subscriptionTier: 'free',
        isActive: false,
      });

      await User.updateOne({ _id: user._id }, { otProfileId: profile._id });
    }

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/auth/register]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
