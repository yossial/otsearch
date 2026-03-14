import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { connectDB } from '@/lib/db';
import { SiteSettings, getSettings } from '@/lib/db/models/SiteSettings';

export const dynamic = 'force-dynamic';

async function requireAdmin() {
  const session = await auth();
  const role = (session?.user as { role?: string | null } | undefined)?.role;
  if (role !== 'admin') return null;
  return session;
}

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const settings = await getSettings();
  return NextResponse.json(settings);
}

export async function PATCH(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json() as Record<string, unknown>;

  const allowed = [
    'showTherapistFee', 'showTherapistRating', 'showTherapistMap', 'featuredSectionEnabled',
    'newRegistrationsEnabled', 'requireAdminApproval', 'contactEmail',
    'defaultSortOrder', 'premiumMonthlyPrice', 'premiumAnnualPrice',
  ];

  const update: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) update[key] = body[key];
  }

  await connectDB();
  const updated = await SiteSettings.findOneAndUpdate(
    { key: 'global' },
    { $set: update },
    { upsert: true, new: true }
  );

  return NextResponse.json(updated);
}
