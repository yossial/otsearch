import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { connectDB } from '@/lib/db';
import { Patient } from '@/lib/db/models/Patient';
import { encrypt, decrypt } from '@/lib/crypto';
import type { PatientStatus, ParentInfo, ContactInfo } from '@/lib/db/models/Patient';

export const dynamic = 'force-dynamic';

function calcRetentionDate(type: 'direct' | 'child', dob?: Date): Date {
  const sevenYearsMs = 7 * 365.25 * 24 * 60 * 60 * 1000;
  const nowPlus7 = new Date(Date.now() + sevenYearsMs);

  if (type === 'child' && dob) {
    const eighteenYearsMs = 18 * 365.25 * 24 * 60 * 60 * 1000;
    const dobPlus25 = new Date(dob.getTime() + eighteenYearsMs + sevenYearsMs);
    return dobPlus25 > nowPlus7 ? dobPlus25 : nowPlus7;
  }

  return nowPlus7;
}

export async function GET(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as { role?: string | null } | undefined)?.role;
  if (!session?.user || role !== 'therapist') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sp = req.nextUrl.searchParams;
  const search = sp.get('search') ?? '';
  const status = sp.get('status') as PatientStatus | '' ?? '';
  const page = Math.max(1, parseInt(sp.get('page') ?? '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(sp.get('limit') ?? '20', 10)));

  await connectDB();

  const filter: Record<string, unknown> = { therapistId: session.user.id };
  if (status) filter.status = status;
  if (search.trim()) {
    const regex = { $regex: search.trim(), $options: 'i' };
    filter.$or = [{ firstName: regex }, { lastName: regex }];
  }

  const skip = (page - 1) * limit;
  const [docs, total] = await Promise.all([
    Patient.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Patient.countDocuments(filter),
  ]);

  const patients = docs.map((p) => {
    const patient = { ...p, _id: String(p._id), therapistId: String(p.therapistId) };
    if (patient.diagnosisNotes) {
      try {
        patient.diagnosisNotes = decrypt(patient.diagnosisNotes);
      } catch {
        // If decryption fails, return empty string rather than leaking ciphertext
        patient.diagnosisNotes = '';
      }
    }
    return patient;
  });

  return NextResponse.json({
    patients,
    total,
    page,
    pages: Math.ceil(total / limit),
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as { role?: string | null } | undefined)?.role;
  if (!session?.user || role !== 'therapist') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (!body.consentGiven) {
    return NextResponse.json({ error: 'Consent is required' }, { status: 400 });
  }

  if (!body.firstName || !body.lastName || !body.dateOfBirth || !body.type || !body.gender) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const dob = new Date(body.dateOfBirth as string);
  if (isNaN(dob.getTime())) {
    return NextResponse.json({ error: 'Invalid dateOfBirth' }, { status: 400 });
  }

  const type = body.type as 'direct' | 'child';
  const retentionDeleteAfter = calcRetentionDate(type, dob);

  let diagnosisNotes: string | undefined;
  if (body.diagnosisNotes && typeof body.diagnosisNotes === 'string' && body.diagnosisNotes.trim()) {
    diagnosisNotes = encrypt(body.diagnosisNotes.trim());
  }

  await connectDB();

  const createData: Record<string, unknown> = {
    therapistId: session.user.id,
    type,
    firstName: body.firstName,
    lastName: body.lastName,
    dateOfBirth: dob,
    gender: body.gender,
    referralSource: body.referralSource ?? undefined,
    diagnosisNotes,
    insurance: body.insurance ?? undefined,
    consentGiven: true,
    consentDate: body.consentDate ? new Date(body.consentDate as string) : new Date(),
    consentSignedBy: body.consentSignedBy ?? '',
    retentionDeleteAfter,
    status: 'active',
  };

  if (body.parentInfo && typeof body.parentInfo === 'object') {
    createData.parentInfo = body.parentInfo as ParentInfo;
  }
  if (body.contactInfo && typeof body.contactInfo === 'object') {
    createData.contactInfo = body.contactInfo as ContactInfo;
  }

  const docs = await Patient.create([createData]);
  const patient = docs[0];
  if (!patient) {
    return NextResponse.json({ error: 'Failed to create patient' }, { status: 500 });
  }

  const result = patient.toObject() as unknown as Record<string, unknown>;
  if (typeof result.diagnosisNotes === 'string' && result.diagnosisNotes) {
    try {
      result.diagnosisNotes = decrypt(result.diagnosisNotes);
    } catch {
      result.diagnosisNotes = '';
    }
  }

  return NextResponse.json({ patient: { ...result, _id: String(result._id) } }, { status: 201 });
}
