import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { verifyTherapist } from '@/lib/gov/govApi';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { mohNumber } = await req.json() as { mohNumber?: string };
  const trimmed = mohNumber?.trim() ?? '';

  if (!trimmed) {
    return NextResponse.json({ error: 'mohNumber required' }, { status: 400 });
  }

  const result = await verifyTherapist(trimmed);

  if (!result) {
    return NextResponse.json({ error: 'notFound' }, { status: 404 });
  }

  return NextResponse.json({
    fullName: result.fullName,
    licenseNumber: result.licenseNumber,
    city: result.city,
    status: result.status,
    statusDetail: result.statusDetail,
    issueDate: result.issueDate,
  });
}
