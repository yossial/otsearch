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
  const therapistName = dn?.[locale] ?? dn?.he ?? dn?.en ?? invoice.therapistName ?? '';

  const businessName   = bd?.businessName ?? therapistName;
  const businessNumber = invoice.businessNumber ?? bd?.businessNumber;
  const vatNumber      = invoice.vatNumber ?? bd?.vatNumber;
  const address        = invoice.therapistAddress ?? bd?.businessAddress;
  const phone          = profile?.contactPhone as string | undefined;
  const email          = profile?.contactEmail as string | undefined;

  const vatPct = Math.round(invoice.vatRate * 100);

  const statusLabel: Record<string, string> = {
    draft:     t('statusDraft'),
    sent:      t('statusSent'),
    paid:      t('statusPaid'),
    overdue:   t('statusOverdue'),
    cancelled: t('statusCancelled'),
  };

  const typeLabel: Record<string, string> = {
    invoice:          t('typeInvoice'),
    receipt:          t('typeReceipt'),
    invoice_receipt:  t('typeInvoiceReceipt'),
  };

  const docTitle = typeLabel[invoice.type] ?? invoice.type;

  return (
    <div className="bg-[#e8e8e8] py-6 print:bg-white print:py-0">
      {/* ── Toolbar — hidden on print ─────────────────────────────────────────── */}
      <div className="no-print mx-auto mb-4 flex max-w-[794px] items-center justify-between gap-3 px-2">
        <Link
          href="/dashboard/billing"
          className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-primary"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="rtl:rotate-180">
            <path d="M19 12H5"/><path d="m12 19-7-7 7-7"/>
          </svg>
          {t('title')}
        </Link>
        <PrintInvoiceButton />
      </div>

      {/* ── Paper ────────────────────────────────────────────────────────────── */}
      <div
        dir="rtl"
        className="invoice-paper mx-auto max-w-[794px] bg-white shadow-[0_4px_24px_rgba(0,0,0,0.14)] print:shadow-none"
      >
        {/* 1 ── Top accent stripe ──────────────────────────────────────────── */}
        <div className="invoice-stripe h-[6px] bg-primary" />

        {/* 2 ── Header: provider RIGHT · document meta LEFT ───────────────── */}
        <div className="invoice-header grid grid-cols-2 gap-8 px-10 pb-6 pt-8">

          {/* RIGHT col — provider details */}
          <div className="invoice-from">
            <p className="invoice-provider-name mb-1 text-xl font-semibold text-[#111]">{businessName}</p>
            {businessName !== therapistName && (
              <p className="text-sm text-[#444]">{therapistName}</p>
            )}
            {businessNumber && (
              <p className="mt-0.5 text-sm text-[#444]">
                <span className="font-medium text-[#111]">עוסק מורשה</span> מס׳ {businessNumber}
              </p>
            )}
            {vatNumber && (
              <p className="text-sm text-[#444]">
                {t('vatNumber')}: {vatNumber}
              </p>
            )}
            {address && <p className="mt-0.5 text-sm text-[#444]">{address}</p>}
            {phone  && <p className="text-sm text-[#444]" dir="ltr">{phone}</p>}
            {email  && <p className="text-sm text-[#444]">{email}</p>}
          </div>

          {/* LEFT col — document type, number, dates */}
          <div className="invoice-meta flex flex-col items-start gap-1.5">
            <p className="invoice-doc-title text-3xl font-bold text-primary leading-tight">{docTitle}</p>
            <table className="invoice-meta-table mt-1 text-sm">
              <tbody>
                <tr>
                  <td className="py-0.5 pl-5 text-[#777]">{t('invoiceNumber')}</td>
                  <td className="py-0.5 font-semibold text-[#111]">{invoice.invoiceNumber}</td>
                </tr>
                <tr>
                  <td className="py-0.5 pl-5 text-[#777]">{t('issueDate')}</td>
                  <td className="py-0.5 font-medium text-[#111]">
                    {new Date(invoice.issueDate).toLocaleDateString(locale)}
                  </td>
                </tr>
                {invoice.dueDate && (
                  <tr>
                    <td className="py-0.5 pl-5 text-[#777]">{t('dueDate')}</td>
                    <td className="py-0.5 font-medium text-[#111]">
                      {new Date(invoice.dueDate).toLocaleDateString(locale)}
                    </td>
                  </tr>
                )}
                <tr>
                  <td className="py-0.5 pl-5 text-[#777]">{t('status')}</td>
                  <td className="py-0.5 font-medium text-[#111]">
                    {statusLabel[invoice.status] ?? invoice.status}
                  </td>
                </tr>
              </tbody>
            </table>
            {/* Original stamp */}
            <span className="invoice-original mt-1 inline-block rounded border border-primary/40 px-2 py-0.5 text-xs font-medium text-primary">
              מקור
            </span>
          </div>
        </div>

        {/* 3 ── FROM / TO band ─────────────────────────────────────────────── */}
        <div className="invoice-parties grid grid-cols-2 border-y border-[#e0e0e0] bg-[#f7f7f7]">
          {/* RIGHT — supplier short (mirrors header but compact) */}
          <div className="invoice-party-from border-l border-[#e0e0e0] px-10 py-4">
            <p className="invoice-party-label mb-1 text-[10px] font-bold uppercase tracking-widest text-[#999]">
              מאת
            </p>
            <p className="text-sm font-semibold text-[#111]">{businessName}</p>
            {businessNumber && (
              <p className="text-xs text-[#555]">עוסק מורשה: {businessNumber}</p>
            )}
            {address && <p className="text-xs text-[#555]">{address}</p>}
          </div>

          {/* LEFT — customer */}
          <div className="invoice-party-to px-10 py-4">
            <p className="invoice-party-label mb-1 text-[10px] font-bold uppercase tracking-widest text-[#999]">
              לכבוד
            </p>
            <p className="text-sm font-semibold text-[#111]">{invoice.patientName ?? '—'}</p>
            {invoice.patientAddress && (
              <p className="text-xs text-[#555]">{invoice.patientAddress}</p>
            )}
          </div>
        </div>

        {/* 4 ── Line items ─────────────────────────────────────────────────── */}
        <div className="invoice-items px-10 py-6">
          <table className="invoice-table w-full border-collapse text-sm">
            <thead>
              <tr className="invoice-thead-row bg-primary text-white">
                <th className="invoice-th w-8 px-3 py-3 text-center text-xs font-semibold">#</th>
                <th className="invoice-th px-3 py-3 text-right text-xs font-semibold">{t('description')}</th>
                <th className="invoice-th w-16 px-3 py-3 text-center text-xs font-semibold">{t('quantity')}</th>
                <th className="invoice-th w-28 px-3 py-3 text-left text-xs font-semibold">{t('unitPrice')}</th>
                <th className="invoice-th w-28 px-3 py-3 text-left text-xs font-semibold">{t('subtotal')}</th>
              </tr>
            </thead>
            <tbody>
              {invoice.lineItems.map((item, i) => (
                <tr
                  key={i}
                  className={i % 2 === 0 ? 'bg-white' : 'bg-[#f9f9f9]'}
                >
                  <td className="invoice-td border-b border-[#ececec] px-3 py-3 text-center text-[#888]">
                    {i + 1}
                  </td>
                  <td className="invoice-td border-b border-[#ececec] px-3 py-3 text-right text-[#222]">
                    {item.description}
                  </td>
                  <td className="invoice-td border-b border-[#ececec] px-3 py-3 text-center text-[#555]">
                    {item.quantity}
                  </td>
                  <td className="invoice-td border-b border-[#ececec] px-3 py-3 text-left text-[#555]" dir="ltr">
                    ₪{item.unitPrice.toFixed(2)}
                  </td>
                  <td className="invoice-td border-b border-[#ececec] px-3 py-3 text-left font-semibold text-[#111]" dir="ltr">
                    ₪{(item.quantity * item.unitPrice).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 5 ── Totals + footer in one row ─────────────────────────────────── */}
        <div className="invoice-bottom flex items-end justify-between gap-8 border-t border-[#e0e0e0] px-10 py-6">

          {/* LEFT — notes / thank-you */}
          <div className="invoice-notes flex-1 text-sm text-[#777]">
            <p className="font-medium text-[#333]">תודה על עסקך</p>
            {invoice.dueDate && (
              <p className="mt-1 text-xs">
                תשלום עד: {new Date(invoice.dueDate).toLocaleDateString(locale)}
              </p>
            )}
          </div>

          {/* RIGHT — totals box */}
          <div className="invoice-totals-box w-56 shrink-0 border border-[#e0e0e0]">
            <div className="space-y-0 divide-y divide-[#e0e0e0]">
              <div className="flex justify-between px-4 py-2 text-sm">
                <span className="text-[#555]">{t('subtotal')}</span>
                <span className="font-medium text-[#111]" dir="ltr">₪{invoice.subtotal.toFixed(2)}</span>
              </div>
              {invoice.vatRate > 0 && (
                <div className="flex justify-between px-4 py-2 text-sm">
                  <span className="text-[#555]">מע&quot;מ {vatPct}%</span>
                  <span className="font-medium text-[#111]" dir="ltr">₪{invoice.vatAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="invoice-grand-total flex justify-between bg-primary px-4 py-3">
                <span className="text-sm font-bold text-[#fff]">{t('total')}</span>
                <span className="text-base font-bold text-[#fff]" dir="ltr">₪{invoice.total.toFixed(2)}</span>
              </div>
              {invoice.status === 'paid' && invoice.paidAt && (
                <div className="flex justify-between bg-green-50 px-4 py-2 text-xs">
                  <span className="text-green-700">{t('paidAt')}</span>
                  <span className="font-medium text-green-700">
                    {new Date(invoice.paidAt).toLocaleDateString(locale)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 6 ── Legal footer ───────────────────────────────────────────────── */}
        <div className="invoice-footer border-t border-[#e0e0e0] px-10 py-3">
          <p className="text-center text-[11px] text-[#aaa]">
            {[
              businessName,
              businessNumber && `עוסק מורשה מס׳ ${businessNumber}`,
              vatNumber && `מע"מ: ${vatNumber}`,
              address,
            ]
              .filter(Boolean)
              .join(' · ')}
          </p>
        </div>
      </div>
    </div>
  );
}
