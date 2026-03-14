import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { connectDB } from '@/lib/db';
import { User } from '@/lib/db/models/User';
import { TherapistProfile } from '@/lib/db/models/TherapistProfile';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as { role?: string | null } | undefined)?.role;
  if (role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await connectDB();

  const { searchParams } = req.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)));
  const roleFilter = searchParams.get('role') ?? '';
  const statusFilter = searchParams.get('status') ?? '';
  const q = searchParams.get('q') ?? '';

  const filter: Record<string, unknown> = {};
  if (roleFilter === 'unregistered') {
    filter.role = null;
  } else if (roleFilter) {
    filter.role = roleFilter;
  }
  if (statusFilter) filter.status = statusFilter;
  if (q.trim()) {
    const regex = { $regex: q.trim(), $options: 'i' };
    filter.$or = [{ name: regex }, { email: regex }];
  }

  const skip = (page - 1) * limit;
  const [users, total] = await Promise.all([
    User.find(filter).select('-passwordHash -emailVerifyToken -passwordResetToken').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    User.countDocuments(filter),
  ]);

  // Join therapistProfileId → subscriptionTier
  const profileIds = users
    .map((u) => u.therapistProfileId)
    .filter(Boolean);

  const profiles = await TherapistProfile.find({ _id: { $in: profileIds } })
    .select('_id subscriptionTier')
    .lean();

  const tierMap = new Map(profiles.map((p) => [String(p._id), p.subscriptionTier]));

  const result = users.map((u) => ({
    id: String(u._id),
    name: u.name,
    email: u.email,
    role: u.role,
    status: u.status ?? 'active',
    therapistProfileId: u.therapistProfileId ? String(u.therapistProfileId) : null,
    subscriptionTier: u.therapistProfileId ? (tierMap.get(String(u.therapistProfileId)) ?? 'free') : null,
    createdAt: u.createdAt,
  }));

  return NextResponse.json({ users: result, total, page, totalPages: Math.ceil(total / limit) });
}
