'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';

interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

interface InvoiceFormProps {
  locale: string;
  patients: { _id: string; name: string }[];
  therapistName: string;
  businessNumber: string;
  defaultPatientId?: string;
}

const VAT_RATE = 0.18;

export default function InvoiceForm({
  patients,
  therapistName: initialTherapistName,
  businessNumber: initialBusinessNumber,
  defaultPatientId = '',
}: InvoiceFormProps) {
  const t = useTranslations('dashboard.billing');
  const router = useRouter();

  const [patientId, setPatientId] = useState(defaultPatientId);
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { description: '', quantity: 1, unitPrice: 0 },
  ]);
  const [vatIncluded, setVatIncluded] = useState(true);
  const [dueDate, setDueDate] = useState('');
  const [therapistName, setTherapistName] = useState(initialTherapistName);
  const [businessNumber, setBusinessNumber] = useState(initialBusinessNumber);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subtotal = lineItems.reduce((s, item) => s + item.quantity * item.unitPrice, 0);
  const vatAmount = vatIncluded ? Math.round(subtotal * VAT_RATE * 100) / 100 : 0;
  const total = subtotal + vatAmount;

  function updateLine(idx: number, field: keyof LineItem, value: string | number) {
    setLineItems((prev) =>
      prev.map((item, i) => i === idx ? { ...item, [field]: value } : item)
    );
  }

  function addLine() {
    setLineItems((prev) => [...prev, { description: '', quantity: 1, unitPrice: 0 }]);
  }

  function removeLine(idx: number) {
    setLineItems((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!patientId) { setError(t('selectPatient')); return; }
    const validLines = lineItems.filter((l) => l.description.trim() && l.quantity > 0 && l.unitPrice >= 0);
    if (validLines.length === 0) { setError(t('lineItems')); return; }

    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId,
          lineItems: validLines,
          vatRate: vatIncluded ? VAT_RATE : 0,
          dueDate: dueDate || undefined,
          therapistName: therapistName.trim() || undefined,
          businessNumber: businessNumber.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? 'Error');
      }
      router.push('/dashboard/billing');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={(e) => { void handleSubmit(e); }} className="space-y-5">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {/* Patient select */}
      <div className="card p-5">
        <h2 className="mb-4 text-sm font-normal uppercase tracking-wide text-text-muted">{t('patientDetails')}</h2>
        <div>
          <label className="form-label">
            {t('selectPatient')} <span className="text-red-500">*</span>
          </label>
          <select
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
            required
            className="form-field w-full"
          >
            <option value="">—</option>
            {patients.map((p) => (
              <option key={p._id} value={p._id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Therapist details */}
      <div className="card p-5">
        <h2 className="mb-4 text-sm font-normal uppercase tracking-wide text-text-muted">{t('therapistDetails')}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="form-label">{t('therapistDetails')}</label>
            <input
              type="text"
              value={therapistName}
              onChange={(e) => setTherapistName(e.target.value)}
              className="form-field w-full"
            />
          </div>
          <div>
            <label className="form-label">{t('businessNumber')}</label>
            <input
              type="text"
              value={businessNumber}
              onChange={(e) => setBusinessNumber(e.target.value)}
              className="form-field w-full"
            />
          </div>
          <div>
            <label className="form-label">{t('dueDate')}</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="form-field w-full"
            />
          </div>
        </div>
      </div>

      {/* Line items */}
      <div className="card p-5">
        <h2 className="mb-4 text-sm font-normal uppercase tracking-wide text-text-muted">{t('lineItems')}</h2>
        <div className="space-y-3">
          {lineItems.map((item, idx) => (
            <div key={idx} className="grid items-end gap-3 sm:grid-cols-[1fr_80px_100px_auto]">
              <div>
                {idx === 0 && <p className="mb-1 text-xs text-text-muted">{t('description')}</p>}
                <input
                  type="text"
                  value={item.description}
                  onChange={(e) => updateLine(idx, 'description', e.target.value)}
                  placeholder={t('description')}
                  className="form-field w-full"
                />
              </div>
              <div>
                {idx === 0 && <p className="mb-1 text-xs text-text-muted">{t('quantity')}</p>}
                <input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => updateLine(idx, 'quantity', parseInt(e.target.value, 10) || 1)}
                  className="form-field w-full"
                />
              </div>
              <div>
                {idx === 0 && <p className="mb-1 text-xs text-text-muted">{t('unitPrice')} (₪)</p>}
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.unitPrice}
                  onChange={(e) => updateLine(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                  className="form-field w-full"
                />
              </div>
              <div>
                {idx === 0 && <p className="mb-1 text-xs opacity-0">x</p>}
                <button
                  type="button"
                  onClick={() => removeLine(idx)}
                  disabled={lineItems.length === 1}
                  className="rounded-lg border border-border px-2.5 py-2 text-sm text-text-muted hover:border-red-200 hover:text-red-500 disabled:opacity-30"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addLine}
          className="mt-3 text-sm text-primary hover:underline"
        >
          + {t('addLine')}
        </button>
      </div>

      {/* Totals */}
      <div className="card p-5">
        <div className="flex items-center gap-3 mb-3">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-text-secondary">
            <input
              type="checkbox"
              checked={vatIncluded}
              onChange={(e) => setVatIncluded(e.target.checked)}
              className="form-checkbox"
            />
            {t('vatIncluded')} (18%)
          </label>
        </div>
        <dl className="space-y-1.5 text-sm">
          <div className="flex justify-between">
            <dt className="text-text-muted">{t('subtotal')}</dt>
            <dd className="text-text-primary">₪{subtotal.toFixed(2)}</dd>
          </div>
          {vatIncluded && (
            <div className="flex justify-between">
              <dt className="text-text-muted">{t('vat')}</dt>
              <dd className="text-text-primary">₪{vatAmount.toFixed(2)}</dd>
            </div>
          )}
          <div className="flex justify-between border-t border-border pt-1.5 font-normal">
            <dt className="text-text-primary">{t('total')}</dt>
            <dd className="text-text-primary">₪{total.toFixed(2)}</dd>
          </div>
        </dl>
      </div>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg border border-border px-4 py-2 text-sm font-normal text-text-secondary hover:text-primary"
        >
          {t('cancel')}
        </button>
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-primary px-6 py-2 text-sm font-normal text-white hover:bg-primary-hover disabled:opacity-50"
        >
          {saving ? '...' : t('save')}
        </button>
      </div>
    </form>
  );
}
