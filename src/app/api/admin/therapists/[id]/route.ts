import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { connectDB } from '@/lib/db';
import { TherapistProfile } from '@/lib/db/models/TherapistProfile';

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
  if (body.subscriptionTier === 'free' || body.subscriptionTier === 'premium') {
    update.subscriptionTier = body.subscriptionTier;
  }
  if (typeof body.isFeatured === 'boolean') update.isFeatured = body.isFeatured;
  if (typeof body.isActive === 'boolean') update.isActive = body.isActive;
  if (typeof body.isAcceptingPatients === 'boolean') update.isAcceptingPatients = body.isAcceptingPatients;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  await connectDB();
  const updated = await TherapistProfile.findByIdAndUpdate(id, { $set: update }, { new: true })
    .select('slug displayName subscriptionTier isFeatured isActive isAcceptingPatients')
    .lean();

  if (!updated) {
    return NextResponse.json({ error: 'Therapist not found' }, { status: 404 });
  }

  return NextResponse.json({
    id: String(updated._id),
    subscriptionTier: updated.subscriptionTier,
    isFeatured: updated.isFeatured,
    isActive: updated.isActive,
    isAcceptingPatients: updated.isAcceptingPatients,
  });
}
