import { connectDB } from '@/lib/db';
import { Invoice } from '@/lib/db/models/Invoice';

/**
 * Generates a sequential invoice number per therapist for the current year.
 * Format: "YYYY-NNNN" (e.g. "2026-0001")
 */
export async function nextInvoiceNumber(therapistId: string): Promise<string> {
  await connectDB();

  const year = new Date().getFullYear();
  const prefix = `${year}-`;

  // Find the highest invoice number for this therapist this year
  const latest = await Invoice.findOne(
    {
      therapistId,
      invoiceNumber: { $regex: `^${prefix}` },
    },
    { invoiceNumber: 1 },
    { sort: { invoiceNumber: -1 } }
  ).lean();

  let nextSeq = 1;
  if (latest?.invoiceNumber) {
    const parts = latest.invoiceNumber.split('-');
    const lastNum = parseInt(parts[1] ?? '0', 10);
    if (!isNaN(lastNum)) nextSeq = lastNum + 1;
  }

  return `${prefix}${String(nextSeq).padStart(4, '0')}`;
}
