import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { connectDB } from '@/lib/db';
import { PatientDoc } from '@/lib/db/models/PatientDoc';
import { Patient } from '@/lib/db/models/Patient';
import { uploadImage } from '@/lib/upload/uploadImage';

export const dynamic = 'force-dynamic';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'application/pdf',
];

export async function GET(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as { role?: string | null } | undefined)?.role;
  if (!session?.user || role !== 'therapist') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const patientId = req.nextUrl.searchParams.get('patientId');
  if (!patientId) {
    return NextResponse.json({ error: 'patientId is required' }, { status: 400 });
  }

  await connectDB();

  const patient = await Patient.findById(patientId).select('therapistId').lean();
  if (!patient) return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
  if (patient.therapistId.toString() !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const docs = await PatientDoc.find({ therapistId: session.user.id, patientId })
    .sort({ createdAt: -1 })
    .lean();

  return NextResponse.json({
    docs: docs.map((d) => ({
      ...d,
      _id: String(d._id),
      therapistId: String(d.therapistId),
      patientId: String(d.patientId),
    })),
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as { role?: string | null } | undefined)?.role;
  if (!session?.user || role !== 'therapist') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
  }

  const file = formData.get('file');
  const patientId = formData.get('patientId');
  const title = formData.get('title');
  const type = formData.get('type');
  const note = formData.get('note');

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'file is required' }, { status: 400 });
  }
  if (!patientId || typeof patientId !== 'string') {
    return NextResponse.json({ error: 'patientId is required' }, { status: 400 });
  }
  if (!title || typeof title !== 'string' || !title.trim()) {
    return NextResponse.json({ error: 'title is required' }, { status: 400 });
  }
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: 'File exceeds 10 MB limit' }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 });
  }

  await connectDB();

  const patient = await Patient.findById(patientId).select('therapistId').lean();
  if (!patient) return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
  if (patient.therapistId.toString() !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const fileUrl = await uploadImage(buffer, file.type, 'patient-docs');

  const validTypes = ['referral', 'diagnosis', 'prescription', 'insurance', 'consent', 'scan', 'other'];
  const docType = typeof type === 'string' && validTypes.includes(type) ? type : 'other';

  const created = await PatientDoc.create({
    therapistId: session.user.id,
    patientId,
    type: docType,
    title: title.trim(),
    fileUrl,
    mimeType: file.type,
    fileSize: file.size,
    note: typeof note === 'string' && note.trim() ? note.trim() : undefined,
  });

  const result = created.toObject() as unknown as Record<string, unknown>;
  return NextResponse.json(
    {
      doc: {
        ...result,
        _id: String(result._id),
        therapistId: String(result.therapistId),
        patientId: String(result.patientId),
      },
    },
    { status: 201 }
  );
}
