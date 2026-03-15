import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { connectDB } from '@/lib/db';
import { Invoice } from '@/lib/db/models/Invoice';
import { Patient } from '@/lib/db/models/Patient';
import { nextInvoiceNumber } from '@/lib/invoiceNumber';
import type { InvoiceStatus } from '@/lib/db/models/Invoice';

export const dynamic = 'force-dynamic';

interface LineItemInput {
  description: string;
  quantity: number;
  unitPrice: number;
}

function isLineItemInput(val: unknown): val is LineItemInput {
  if (typeof val !== 'object' || val === null) return false;
  const v = val as Record<string, unknown>;
  return (
    typeof v.description === 'string' &&
    typeof v.quantity === 'number' &&
    typeof v.unitPrice === 'number'
  );
}

export async function GET(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as { role?: string | null } | undefined)?.role;
  if (!session?.user || role !== 'therapist') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sp = req.nextUrl.searchParams;
  const patientId = sp.get('patientId');
  const status = sp.get('status') as InvoiceStatus | null;
  const page = Math.max(1, parseInt(sp.get('page') ?? '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(sp.get('limit') ?? '20', 10)));

  await connectDB();

  const filter: Record<string, unknown> = { therapistId: session.user.id };
  if (patientId) filter.patientId = patientId;
  if (status) filter.status = status;

  const skip = (page - 1) * limit;
  const [docs, total] = await Promise.all([
    Invoice.find(filter).sort({ issueDate: -1, createdAt: -1 }).skip(skip).limit(limit).lean(),
    Invoice.countDocuments(filter),
  ]);

  const invoices = docs.map((inv) => ({
    ...inv,
    _id: String(inv._id),
    therapistId: String(inv.therapistId),
    patientId: String(inv.patientId),
  }));

  return NextResponse.json({ invoices, total, page, pages: Math.ceil(total / limit) });
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

  const { patientId, lineItems, vatRate, type, dueDate, therapistName, businessNumber, therapistLicense, therapistAddress, patientName } = body;

  if (!patientId || typeof patientId !== 'string') {
    return NextResponse.json({ error: 'patientId is required' }, { status: 400 });
  }
  if (!Array.isArray(lineItems) || lineItems.length === 0) {
    return NextResponse.json({ error: 'lineItems must be a non-empty array' }, { status: 400 });
  }
  if (!lineItems.every(isLineItemInput)) {
    return NextResponse.json({ error: 'Invalid lineItems format' }, { status: 400 });
  }

  await connectDB();

  const patient = await Patient.findById(patientId).select('therapistId').lean();
  if (!patient) return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
  if (patient.therapistId.toString() !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const effectiveVatRate = typeof vatRate === 'number' ? vatRate : 0.18;
  const subtotal = lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const vatAmount = Math.round(subtotal * effectiveVatRate * 100) / 100;
  const total = Math.round((subtotal + vatAmount) * 100) / 100;

  const invoiceNumber = await nextInvoiceNumber(session.user.id);

  const validTypes = ['invoice', 'receipt', 'invoice_receipt'] as const;
  const invoiceType = (typeof type === 'string' && validTypes.includes(type as typeof validTypes[number]))
    ? (type as typeof validTypes[number])
    : 'invoice_receipt';

  const createData: Record<string, unknown> = {
    therapistId: session.user.id,
    patientId,
    invoiceNumber,
    issueDate: new Date(),
    lineItems: lineItems.map((item) => ({ ...item, sessionIds: [] })),
    subtotal,
    vatRate: effectiveVatRate,
    vatAmount,
    total,
    type: invoiceType,
    status: 'draft',
  };

  if (dueDate && typeof dueDate === 'string') {
    const d = new Date(dueDate);
    if (!isNaN(d.getTime())) createData.dueDate = d;
  }
  if (therapistName && typeof therapistName === 'string') createData.therapistName = therapistName;
  if (businessNumber && typeof businessNumber === 'string') createData.businessNumber = businessNumber;
  if (therapistLicense && typeof therapistLicense === 'string') createData.therapistLicense = therapistLicense;
  if (therapistAddress && typeof therapistAddress === 'string') createData.therapistAddress = therapistAddress;
  if (patientName && typeof patientName === 'string') createData.patientName = patientName;

  const docs = await Invoice.create([createData]);
  const created = docs[0];
  if (!created) {
    return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 });
  }

  const result = created.toObject() as unknown as Record<string, unknown>;
  return NextResponse.json(
    {
      invoice: {
        ...result,
        _id: String(result._id),
        therapistId: String(result.therapistId),
        patientId: String(result.patientId),
      },
    },
    { status: 201 }
  );
}
