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

      {/* ── Invoice document ──────────────────────────────────────────────────── */}
      <div className="print-invoice card overflow-hidden bg-white">

        {/* Colour bar — screen only */}
        <div className="gradient-bar no-print" />

        {/* ── HEADER: provider left · document meta right ────────────────────── */}
        <div className="invoice-header flex flex-wrap items-start justify-between gap-6 p-8 pb-6">

          {/* Provider block */}
          <div className="invoice-from space-y-0.5">
            <p className="invoice-from-name text-lg font-normal text-text-primary">{therapistDisplayName}</p>
            {bd?.businessName && (
              <p className="text-sm text-text-secondary">{bd.businessName}</p>
            )}
            {bd?.businessNumber && (
              <p className="text-sm text-text-secondary">
                {t('businessNumber')}: <span className="text-text-primary">{bd.businessNumber}</span>
              </p>
            )}
            {bd?.vatNumber && (
              <p className="text-sm text-text-secondary">
                {t('vatNumber')}: <span className="text-text-primary">{bd.vatNumber}</span>
              </p>
            )}
            {bd?.businessAddress && (
              <p className="text-sm text-text-secondary">{bd.businessAddress}</p>
            )}
            {profile?.contactPhone && (
              <p className="text-sm text-text-secondary" dir="ltr">{profile.contactPhone as string}</p>
            )}
            {profile?.contactEmail && (
              <p className="text-sm text-text-secondary">{profile.contactEmail as string}</p>
            )}
          </div>

          {/* Document meta block */}
          <div className="invoice-meta space-y-2 text-end">
            <p className="invoice-type-heading text-2xl font-normal text-text-primary">
              {typeLabel[invoice.type] ?? invoice.type}
            </p>
            <table className="invoice-meta-table ms-auto text-sm">
              <tbody>
                <tr>
                  <td className="py-0.5 text-text-muted ltr:pr-4 rtl:pl-4">{t('invoiceNumber')}</td>
                  <td className="py-0.5 font-normal text-text-primary">{invoice.invoiceNumber}</td>
                </tr>
                <tr>
                  <td className="py-0.5 text-text-muted ltr:pr-4 rtl:pl-4">{t('issueDate')}</td>
                  <td className="py-0.5 font-normal text-text-primary">
                    {new Date(invoice.issueDate).toLocaleDateString(locale)}
                  </td>
                </tr>
                {invoice.dueDate && (
                  <tr>
                    <td className="py-0.5 text-text-muted ltr:pr-4 rtl:pl-4">{t('dueDate')}</td>
                    <td className="py-0.5 font-normal text-text-primary">
                      {new Date(invoice.dueDate).toLocaleDateString(locale)}
                    </td>
                  </tr>
                )}
                <tr>
                  <td className="py-0.5 text-text-muted ltr:pr-4 rtl:pl-4">{t('status')}</td>
                  <td className="py-0.5">
                    {/* Screen: badge; print: plain text (CSS handles the swap) */}
                    <span className={`invoice-status-badge no-print inline-block rounded-full px-2.5 py-0.5 text-xs font-normal ${STATUS_COLORS[invoice.status] ?? ''}`}>
                      {statusLabel[invoice.status] ?? invoice.status}
                    </span>
                    <span className="invoice-status-text print-only hidden font-normal text-text-primary">
                      {statusLabel[invoice.status] ?? invoice.status}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ── BILL TO ───────────────────────────────────────────────────────────── */}
        <div className="invoice-bill-to border-t border-border px-8 py-5">
          <p className="invoice-section-label mb-1.5 text-xs font-normal uppercase tracking-widest text-text-muted">
            {t('patientDetails')}
          </p>
          <p className="text-base font-normal text-text-primary">{invoice.patientName ?? '—'}</p>
          {invoice.patientAddress && (
            <p className="text-sm text-text-secondary">{invoice.patientAddress}</p>
          )}
        </div>

        {/* ── LINE ITEMS ────────────────────────────────────────────────────────── */}
        <div className="invoice-items border-t border-border px-8 pb-2 pt-4">
          <table className="invoice-table w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="pb-2.5 text-start text-xs font-normal uppercase tracking-widest text-text-muted">
                  {t('description')}
                </th>
                <th className="pb-2.5 text-end text-xs font-normal uppercase tracking-widest text-text-muted">
                  {t('quantity')}
                </th>
                <th className="pb-2.5 text-end text-xs font-normal uppercase tracking-widest text-text-muted">
                  {t('unitPrice')}
                </th>
                <th className="pb-2.5 text-end text-xs font-normal uppercase tracking-widest text-text-muted">
                  {t('subtotal')}
                </th>
              </tr>
            </thead>
            <tbody>
              {invoice.lineItems.map((item, i) => (
                <tr key={i} className="border-b border-border/50 last:border-0">
                  <td className="py-3 text-text-primary">{item.description}</td>
                  <td className="py-3 text-end text-text-secondary">{item.quantity}</td>
                  <td className="py-3 text-end text-text-secondary">₪{item.unitPrice.toFixed(2)}</td>
                  <td className="py-3 text-end font-normal text-text-primary">
                    ₪{(item.quantity * item.unitPrice).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── TOTALS ────────────────────────────────────────────────────────────── */}
        <div className="invoice-totals border-t border-border px-8 py-5">
          <div className="ms-auto max-w-xs">
            <table className="w-full text-sm">
              <tbody>
                <tr>
                  <td className="py-1 text-text-muted ltr:pr-6 rtl:pl-6">{t('subtotal')}</td>
                  <td className="py-1 text-end text-text-primary">₪{invoice.subtotal.toFixed(2)}</td>
                </tr>
                {invoice.vatRate > 0 && (
                  <tr>
                    <td className="py-1 text-text-muted ltr:pr-6 rtl:pl-6">
                      {t('vat')}
                    </td>
                    <td className="py-1 text-end text-text-primary">₪{invoice.vatAmount.toFixed(2)}</td>
                  </tr>
                )}
                <tr className="invoice-total-row border-t-2 border-border">
                  <td className="pt-2 text-base font-normal text-text-primary ltr:pr-6 rtl:pl-6">
                    {t('total')}
                  </td>
                  <td className="pt-2 text-end text-base font-normal text-text-primary">
                    ₪{invoice.total.toFixed(2)}
                  </td>
                </tr>
                {invoice.status === 'paid' && invoice.paidAt && (
                  <tr>
                    <td className="pt-1 text-xs text-green-600 ltr:pr-6 rtl:pl-6">{t('paidAt')}</td>
                    <td className="pt-1 text-end text-xs text-green-600">
                      {new Date(invoice.paidAt).toLocaleDateString(locale)}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── FOOTER: registration line ─────────────────────────────────────────── */}
        {(bd?.businessNumber ?? bd?.vatNumber ?? bd?.businessType) && (
          <div className="invoice-footer border-t border-border px-8 py-4 text-center text-xs text-text-muted">
            {[
              bd?.businessName ?? therapistDisplayName,
              bd?.businessNumber && `${t('businessNumber')}: ${bd.businessNumber}`,
              bd?.vatNumber && `${t('vatNumber')}: ${bd.vatNumber}`,
            ]
              .filter(Boolean)
              .join(' · ')}
          </div>
        )}
      </div>
    </div>
  );
}
