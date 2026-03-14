import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { connectDB } from '@/lib/db';
import { User } from '@/lib/db/models/User';

export const dynamic = 'force-dynamic';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const role = (session?.user as { role?: string | null } | undefined)?.role;
  if (role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json() as Record<string, unknown>;

  const update: Record<string, unknown> = {};
  if (body.status === 'active' || body.status === 'suspended') {
    update.status = body.status;
  }
  if (body.role === 'therapist' || body.role === 'admin' || body.role === null) {
    update.role = body.role;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  await connectDB();
  const updated = await User.findByIdAndUpdate(id, { $set: update }, { new: true })
    .select('-passwordHash -emailVerifyToken -passwordResetToken')
    .lean();

  if (!updated) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json({ id: String(updated._id), status: updated.status, role: updated.role });
}
