import { notFound, redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { auth } from '@/lib/auth/auth';
import { connectDB } from '@/lib/db';
import { User } from '@/lib/db/models/User';
import { TherapistProfile } from '@/lib/db/models/TherapistProfile';
import { Invoice } from '@/lib/db/models/Invoice';
import PrintInvoiceButton from '@/components/dashboard/billing/PrintInvoiceButton';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

type PageProps = { params: Promise<{ locale: string; id: string }> };

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-bg-alt text-text-muted',
  sent: 'bg-primary-light text-primary',
  paid: 'bg-green-50 text-green-700',
  overdue: 'bg-red-50 text-red-600',
  cancelled: 'bg-bg-alt text-text-muted',
};

export default async function InvoiceDetailPage({ params }: PageProps) {
  const { locale, id } = await params;
  const session = await auth();
  const role = (session?.user as { role?: string | null } | undefined)?.role;
  if (!session?.user || role !== 'therapist') redirect(`/${locale}/auth/login`);

  if (!mongoose.Types.ObjectId.isValid(id)) notFound();

  const t = await getTranslations('dashboard.billing');

  await connectDB();

  const [invoice, user] = await Promise.all([
    Invoice.findById(id).lean(),
    User.findById(session.user.id).select('therapistProfileId').lean(),
  ]);

  if (!invoice) notFound();
  if (invoice.therapistId.toString() !== session.user.id) notFound();

  const profile = user?.therapistProfileId
    ? await TherapistProfile.findById(user.therapistProfileId)
        .select('businessDetails displayName contactPhone contactEmail')
        .lean()
    : null;

  const bd = profile?.businessDetails as Record<string, string> | undefined;
  const dn = profile?.displayName as Record<string, string> | undefined;
  const therapistDisplayName = dn?.[locale] ?? dn?.he ?? dn?.en ?? invoice.therapistName ?? '';

  const statusLabel: Record<string, string> = {
    draft: t('statusDraft'),
    sent: t('statusSent'),
    paid: t('statusPaid'),
    overdue: t('statusOverdue'),
    cancelled: t('statusCancelled'),
  };

  const typeLabel: Record<string, string> = {
    invoice: t('typeInvoice'),
    receipt: t('typeReceipt'),
    invoice_receipt: t('typeInvoiceReceipt'),
  };

  return (
    <div className="space-y-4">
      {/* Back + actions bar — hidden on print */}
      <div className="no-print flex items-center justify-between gap-3">
        <Link
          href="/dashboard/billing"
          className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-primary"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="rtl:rotate-180">
            <path d="M19 12H5"/><path d="m12 19-7-7 7-7"/>
          </svg>
          {t('title')}
        </Link>
        <PrintInvoiceButton />
      </div>

      {/* Invoice document */}
      <div className="print-invoice card overflow-hidden bg-white">
        <div className="gradient-bar no-print" />

        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-6 p-8">
          {/* Therapist info */}
          <div className="space-y-0.5">
            <p className="text-lg font-normal text-text-primary">{therapistDisplayName}</p>
            {bd?.businessName && <p className="text-sm text-text-secondary">{bd.businessName}</p>}
            {bd?.businessNumber && (
              <p className="text-sm text-text-secondary">
                {t('businessNumber')}: {bd.businessNumber}
              </p>
            )}
            {bd?.vatNumber && (
              <p className="text-sm text-text-secondary">
                {t('vatNumber')}: {bd.vatNumber}
              </p>
            )}
            {bd?.businessAddress && <p className="text-sm text-text-secondary">{bd.businessAddress}</p>}
            {profile?.contactPhone && (
              <p className="text-sm text-text-secondary" dir="ltr">{profile.contactPhone as string}</p>
            )}
            {profile?.contactEmail && (
              <p className="text-sm text-text-secondary">{profile.contactEmail as string}</p>
            )}
          </div>

          {/* Invoice meta */}
          <div className="space-y-1 text-end">
            <p className="text-2xl font-normal text-text-primary">{typeLabel[invoice.type] ?? invoice.type}</p>
            <p className="text-sm text-text-muted">
              {t('invoiceNumber')}: <span className="font-normal text-text-primary">{invoice.invoiceNumber}</span>
            </p>
            <p className="text-sm text-text-muted">
              {t('issueDate')}: <span className="font-normal text-text-primary">{new Date(invoice.issueDate).toLocaleDateString(locale)}</span>
            </p>
            {invoice.dueDate && (
              <p className="text-sm text-text-muted">
                {t('dueDate')}: <span className="font-normal text-text-primary">{new Date(invoice.dueDate).toLocaleDateString(locale)}</span>
              </p>
            )}
            <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-normal ${STATUS_COLORS[invoice.status] ?? ''}`}>
              {statusLabel[invoice.status] ?? invoice.status}
            </span>
          </div>
        </div>

        {/* Patient info */}
        <div className="border-t border-border px-8 py-4">
          <p className="mb-1 text-xs font-normal uppercase tracking-wide text-text-muted">{t('patientDetails')}</p>
          <p className="text-sm font-normal text-text-primary">{invoice.patientName ?? '—'}</p>
          {invoice.patientAddress && <p className="text-sm text-text-secondary">{invoice.patientAddress}</p>}
        </div>

        {/* Line items */}
        <div className="border-t border-border px-8 py-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="pb-2 text-start text-xs font-normal uppercase tracking-wide text-text-muted">{t('description')}</th>
                <th className="pb-2 text-end text-xs font-normal uppercase tracking-wide text-text-muted">{t('quantity')}</th>
                <th className="pb-2 text-end text-xs font-normal uppercase tracking-wide text-text-muted">{t('unitPrice')}</th>
                <th className="pb-2 text-end text-xs font-normal uppercase tracking-wide text-text-muted">{t('subtotal')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {invoice.lineItems.map((item, i) => (
                <tr key={i}>
                  <td className="py-2.5 text-text-primary">{item.description}</td>
                  <td className="py-2.5 text-end text-text-secondary">{item.quantity}</td>
                  <td className="py-2.5 text-end text-text-secondary">₪{item.unitPrice.toFixed(2)}</td>
                  <td className="py-2.5 text-end font-normal text-text-primary">₪{(item.quantity * item.unitPrice).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="border-t border-border px-8 py-4">
          <div className="ml-auto max-w-xs space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">{t('subtotal')}</span>
              <span className="text-text-primary">₪{invoice.subtotal.toFixed(2)}</span>
            </div>
            {invoice.vatRate > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">{t('vat')}</span>
                <span className="text-text-primary">₪{invoice.vatAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-border pt-1.5 text-base font-normal">
              <span className="text-text-primary">{t('total')}</span>
              <span className="text-text-primary">₪{invoice.total.toFixed(2)}</span>
            </div>
            {invoice.status === 'paid' && invoice.paidAt && (
              <div className="flex justify-between text-sm text-green-600">
                <span>{t('paidAt')}</span>
                <span>{new Date(invoice.paidAt).toLocaleDateString(locale)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
