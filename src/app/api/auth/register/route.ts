import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/db';
import { User } from '@/lib/db/models/User';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      email?: string;
      password?: string;
      name?: string;
    };
    const { email, password, name } = body;

    if (!email || !password || !name) {
      return NextResponse.json({ error: 'required' }, { status: 400 });
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
    // Role is null until the user completes role selection after login.
    // OTProfile is created at that point via /api/auth/set-role.
    await User.create({
      email: email.toLowerCase(),
      passwordHash,
      name,
      role: null,
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/auth/register]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
