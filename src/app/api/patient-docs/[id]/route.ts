import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { connectDB } from '@/lib/db';
import { PatientDoc } from '@/lib/db/models/PatientDoc';

export const dynamic = 'force-dynamic';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const role = (session?.user as { role?: string | null } | undefined)?.role;
  if (!session?.user || role !== 'therapist') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  await connectDB();

  const doc = await PatientDoc.findById(id);
  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (doc.therapistId.toString() !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await doc.deleteOne();
  return NextResponse.json({ ok: true });
}
