import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { connectDB } from '@/lib/db';
import { Invoice } from '@/lib/db/models/Invoice';
import { createNotification } from '@/lib/notify';
import type { InvoiceStatus } from '@/lib/db/models/Invoice';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const session = await auth();
  const role = (session?.user as { role?: string | null } | undefined)?.role;
  if (!session?.user || role !== 'therapist') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await connectDB();

  const invoice = await Invoice.findById(id).lean();
  if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
  if (invoice.therapistId.toString() !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.json({
    invoice: {
      ...invoice,
      _id: String(invoice._id),
      therapistId: String(invoice.therapistId),
      patientId: String(invoice.patientId),
    },
  });
}

export async function PUT(req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
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

  await connectDB();

  const invoice = await Invoice.findById(id);
  if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
  if (invoice.therapistId.toString() !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Can only edit draft invoices (status and payment fields are always updateable)
  const validStatuses: InvoiceStatus[] = ['draft', 'sent', 'paid', 'overdue', 'cancelled'];

  if (typeof body.status === 'string' && validStatuses.includes(body.status as InvoiceStatus)) {
    const newStatus = body.status as InvoiceStatus;
    const prevStatus = invoice.status;

    invoice.status = newStatus;

    // Auto-set paidAt when marking as paid
    if (newStatus === 'paid' && prevStatus !== 'paid') {
      invoice.paidAt = new Date();

      // Notify therapist
      await createNotification({
        recipientId: session.user.id,
        recipientType: 'therapist',
        type: 'invoice_paid',
        title: 'חשבונית שולמה',
        body: `חשבונית ${invoice.invoiceNumber} סומנה כשולמה`,
        relatedEntity: { type: 'Invoice', id: String(invoice._id) },
      });
    }
  }

  if (body.paidAt && typeof body.paidAt === 'string') {
    const d = new Date(body.paidAt);
    if (!isNaN(d.getTime())) invoice.paidAt = d;
  }
  if (typeof body.paidAmount === 'number') {
    invoice.paidAmount = body.paidAmount;
  }

  await invoice.save();

  const result = invoice.toObject() as unknown as Record<string, unknown>;
  return NextResponse.json({
    invoice: {
      ...result,
      _id: String(result._id),
      therapistId: String(result.therapistId),
      patientId: String(result.patientId),
    },
  });
}
