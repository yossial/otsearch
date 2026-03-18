'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

interface Invoice {
  _id: string;
  invoiceNumber: string;
  patientId: string;
  patientName?: string;
  issueDate: string;
  dueDate?: string;
  total: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  type: 'invoice' | 'receipt' | 'invoice_receipt';
}

interface InvoiceListProps {
  patientId?: string;
  locale: string;
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-bg-alt text-text-muted',
  sent: 'bg-primary-light text-primary',
  paid: 'bg-green-50 text-green-700',
  overdue: 'bg-red-50 text-red-600',
  cancelled: 'bg-bg-alt text-text-muted line-through',
};

export default function InvoiceList({ patientId, locale }: InvoiceListProps) {
  const t = useTranslations('dashboard.billing');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markingPaid, setMarkingPaid] = useState<string | null>(null);

  const fetchInvoices = useCallback(async () => {
    try {
      const qs = patientId ? `?patientId=${patientId}` : '';
      const res = await fetch(`/api/invoices${qs}`);
      if (!res.ok) throw new Error('Failed to fetch invoices');
      const data = (await res.json()) as { invoices: Invoice[] };
      setInvoices(data.invoices);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => { void fetchInvoices(); }, [fetchInvoices]);

  async function markPaid(invoiceId: string) {
    setMarkingPaid(invoiceId);
    try {
      const res = await fetch(`/api/invoices/${invoiceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'paid' }),
      });
      if (!res.ok) throw new Error('Failed');
      const data = (await res.json()) as { invoice: Invoice };
      setInvoices((prev) => prev.map((inv) => inv._id === invoiceId ? data.invoice : inv));
    } catch {
      // silently fail
    } finally {
      setMarkingPaid(null);
    }
  }

  const statusLabel: Record<string, string> = {
    draft: t('statusDraft'),
    sent: t('statusSent'),
    paid: t('statusPaid'),
    overdue: t('statusOverdue'),
    cancelled: t('statusCancelled'),
  };

  if (loading) {
    return (
      <div className="space-y-3 p-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-14 animate-pulse rounded-lg bg-bg-alt" />
        ))}
      </div>
    );
  }

  if (error) return <p className="p-6 text-sm text-red-600">{error}</p>;

  if (invoices.length === 0) {
    return (
      <div className="p-6 text-center">
        <p className="text-sm text-text-muted">{t('noInvoices')}</p>
        <Link
          href="/dashboard/billing/new"
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-normal text-white hover:bg-primary-hover"
        >
          + {t('new')}
        </Link>
      </div>
    );
  }

  const unpaidCount = invoices.filter((inv) => inv.status === 'sent' || inv.status === 'overdue').length;
  const revenueThisMonth = invoices
    .filter((inv) => {
      if (inv.status !== 'paid') return false;
      const d = new Date(inv.issueDate);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((sum, inv) => sum + inv.total, 0);

  return (
    <div>
      {/* Stats bar */}
      {!patientId && (
        <div className="flex flex-wrap gap-4 border-b border-border px-5 py-3">
          <div className="text-sm">
            <span className="text-text-muted">{t('revenueThisMonth')}: </span>
            <span className="font-normal text-text-primary">₪{revenueThisMonth.toFixed(0)}</span>
          </div>
          <div className="text-sm">
            <span className="text-text-muted">{t('unpaidCount')}: </span>
            <span className={`font-normal ${unpaidCount > 0 ? 'text-red-600' : 'text-text-primary'}`}>{unpaidCount}</span>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-bg-alt">
              <th className="px-5 py-3 text-start text-xs font-normal uppercase tracking-wide text-text-muted">{t('invoiceNumber')}</th>
              {!patientId && <th className="px-5 py-3 text-start text-xs font-normal uppercase tracking-wide text-text-muted">{t('patientDetails')}</th>}
              <th className="px-5 py-3 text-start text-xs font-normal uppercase tracking-wide text-text-muted">{t('issueDate')}</th>
              <th className="px-5 py-3 text-end text-xs font-normal uppercase tracking-wide text-text-muted">{t('total')}</th>
              <th className="px-5 py-3 text-start text-xs font-normal uppercase tracking-wide text-text-muted">{t('status')}</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {invoices.map((inv) => (
              <tr key={inv._id} className="transition-colors hover:bg-bg-alt/50">
                <td className="px-5 py-3 font-normal text-text-primary">{inv.invoiceNumber}</td>
                {!patientId && <td className="px-5 py-3 text-text-secondary">{inv.patientName ?? '—'}</td>}
                <td className="px-5 py-3 text-text-secondary">
                  {new Date(inv.issueDate).toLocaleDateString(locale)}
                </td>
                <td className="px-5 py-3 text-end font-normal text-text-primary">₪{inv.total.toFixed(0)}</td>
                <td className="px-5 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-normal ${STATUS_COLORS[inv.status] ?? ''}`}>
                    {statusLabel[inv.status] ?? inv.status}
                  </span>
                </td>
                <td className="px-5 py-3 text-end">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/dashboard/billing/${inv._id}`}
                      className="rounded-lg border border-border px-2.5 py-1 text-xs text-text-secondary transition-colors hover:border-primary/30 hover:text-primary"
                    >
                      {t('view')}
                    </Link>
                    {(inv.status === 'sent' || inv.status === 'draft') && (
                      <button
                        onClick={() => { void markPaid(inv._id); }}
                        disabled={markingPaid === inv._id}
                        className="rounded-lg border border-green-200 bg-green-50 px-2.5 py-1 text-xs text-green-700 transition-colors hover:bg-green-100 disabled:opacity-50"
                      >
                        {markingPaid === inv._id ? '...' : t('markPaid')}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
