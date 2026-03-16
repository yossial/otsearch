import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { connectDB } from '@/lib/db';
import { Patient } from '@/lib/db/models/Patient';
import { decrypt } from '@/lib/crypto';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const session = await auth();
  const role = (session?.user as { role?: string | null } | undefined)?.role;
  if (!session?.user || role !== 'therapist') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await connectDB();
  const patient = await Patient.findById(id).lean();
  if (!patient) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (patient.therapistId.toString() !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let diagnosisNotes: string | undefined;
  if (patient.diagnosisNotes) {
    try {
      diagnosisNotes = decrypt(patient.diagnosisNotes);
    } catch {
      diagnosisNotes = undefined;
    }
  }

  const exportData = {
    exportVersion: '1.0',
    exportedAt: new Date().toISOString(),
    patientRecord: {
      id: String(patient._id),
      firstName: patient.firstName,
      lastName: patient.lastName,
      dateOfBirth: patient.dateOfBirth,
      gender: patient.gender,
      type: patient.type,
      status: patient.status,
      insurance: patient.insurance,
      referralSource: patient.referralSource,
      diagnosisNotes,
      contactInfo: patient.contactInfo,
      parentInfo: patient.parentInfo,
      consent: {
        consentGiven: patient.consentGiven,
        consentDate: patient.consentDate,
        consentSignedBy: patient.consentSignedBy,
      },
      retentionDeleteAfter: patient.retentionDeleteAfter,
      createdAt: patient.createdAt,
      updatedAt: patient.updatedAt,
    },
  };

  const filename = `patient-${String(patient._id)}-export.json`;

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
