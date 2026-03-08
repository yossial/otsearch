/**
 * POST /api/admin/bootstrap
 *
 * One-time endpoint to create the first admin account in production.
 *
 * Security model:
 *  1. Requires ADMIN_BOOTSTRAP_TOKEN env var to be set — if not set, always 404.
 *  2. Requires the correct token in the request body.
 *  3. Self-disables: if any admin user already exists, returns 409 regardless of token.
 *     This means once the first admin is created, this endpoint can never be used again,
 *     even if someone learns the token.
 *
 * After first use: remove or rotate ADMIN_BOOTSTRAP_TOKEN in Secrets Manager to
 * make the endpoint permanently unreachable (returns 404).
 *
 * Usage:
 *   curl -X POST https://<host>/api/admin/bootstrap \
 *     -H "Content-Type: application/json" \
 *     -d '{"token":"<ADMIN_BOOTSTRAP_TOKEN>","email":"you@example.com","name":"Your Name","password":"SecurePass1"}'
 */

import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/db';
import { User } from '@/lib/db/models/User';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  // 1. Token must be configured — if env var absent, behave as 404 (don't reveal endpoint exists)
  const bootstrapToken = process.env.ADMIN_BOOTSTRAP_TOKEN;
  if (!bootstrapToken) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  try {
    const body = await req.json() as {
      token?: string;
      email?: string;
      name?: string;
      password?: string;
    };

    // 2. Validate token
    if (!body.token || body.token !== bootstrapToken) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 3. Validate required fields
    const { email, name, password } = body;
    if (!email || !name || !password) {
      return NextResponse.json({ error: 'email, name and password are required' }, { status: 400 });
    }
    if (password.length < 8 || !/[0-9]/.test(password) || !/[a-zA-Z]/.test(password)) {
      return NextResponse.json({ error: 'Password must be 8+ characters with a letter and number' }, { status: 400 });
    }

    await connectDB();

    // 4. Self-disable: reject if any admin already exists
    const existingAdmin = await User.findOne({ role: 'admin' }).lean();
    if (existingAdmin) {
      return NextResponse.json(
        { error: 'An admin account already exists. Bootstrap is disabled.' },
        { status: 409 }
      );
    }

    // 5. Create or promote the user
    const passwordHash = await bcrypt.hash(password, 12);
    const existing = await User.findOne({ email: email.toLowerCase() }).lean();

    if (existing) {
      await User.updateOne({ _id: existing._id }, { $set: { role: 'admin', passwordHash } });
      console.log(`[bootstrap] Promoted existing user to admin: ${email}`);
    } else {
      await User.create({ email: email.toLowerCase(), name, passwordHash, role: 'admin', emailVerified: true });
      console.log(`[bootstrap] Created new admin: ${email}`);
    }

    return NextResponse.json({ ok: true, message: 'Admin account created. Remove ADMIN_BOOTSTRAP_TOKEN from your environment.' });
  } catch (err) {
    console.error('[POST /api/admin/bootstrap]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
