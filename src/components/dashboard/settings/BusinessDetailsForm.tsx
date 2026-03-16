'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

interface BusinessDetails {
  businessName?: string;
  businessNumber?: string;
  vatNumber?: string;
  businessAddress?: string;
  businessType?: 'licensed' | 'exempt' | 'company';
}

interface Props {
  initial: BusinessDetails;
}

export default function BusinessDetailsForm({ initial }: Props) {
  const t = useTranslations('dashboard.settings.business');
  const tCommon = useTranslations('common');

  const [form, setForm] = useState<BusinessDetails>({
    businessName: initial.businessName ?? '',
    businessNumber: initial.businessNumber ?? '',
    vatNumber: initial.vatNumber ?? '',
    businessAddress: initial.businessAddress ?? '',
    businessType: initial.businessType,
  });

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set(key: keyof BusinessDetails, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/settings/business', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Failed to save');
      setSaved(true);
    } catch {
      setError(tCommon('error'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={(e) => { void handleSubmit(e); }} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Business name */}
        <div className="space-y-1.5">
          <label className="text-sm font-normal text-text-secondary">{t('businessName')}</label>
          <input
            type="text"
            value={form.businessName}
            onChange={(e) => set('businessName', e.target.value)}
            className="input w-full"
            placeholder={t('businessNamePlaceholder')}
          />
        </div>

        {/* Business type */}
        <div className="space-y-1.5">
          <label className="text-sm font-normal text-text-secondary">{t('businessType')}</label>
          <select
            value={form.businessType ?? ''}
            onChange={(e) => set('businessType', e.target.value)}
            className="input w-full"
          >
            <option value="">{t('businessTypeNone')}</option>
            <option value="licensed">{t('businessTypeLicensed')}</option>
            <option value="exempt">{t('businessTypeExempt')}</option>
            <option value="company">{t('businessTypeCompany')}</option>
          </select>
        </div>

        {/* Business number (מספר עוסק) */}
        <div className="space-y-1.5">
          <label className="text-sm font-normal text-text-secondary">{t('businessNumber')}</label>
          <input
            type="text"
            value={form.businessNumber}
            onChange={(e) => set('businessNumber', e.target.value)}
            className="input w-full"
            placeholder={t('businessNumberPlaceholder')}
            dir="ltr"
          />
        </div>

        {/* VAT number */}
        <div className="space-y-1.5">
          <label className="text-sm font-normal text-text-secondary">{t('vatNumber')}</label>
          <input
            type="text"
            value={form.vatNumber}
            onChange={(e) => set('vatNumber', e.target.value)}
            className="input w-full"
            placeholder={t('vatNumberPlaceholder')}
            dir="ltr"
          />
        </div>
      </div>

      {/* Business address */}
      <div className="space-y-1.5">
        <label className="text-sm font-normal text-text-secondary">{t('businessAddress')}</label>
        <input
          type="text"
          value={form.businessAddress}
          onChange={(e) => set('businessAddress', e.target.value)}
          className="input w-full"
          placeholder={t('businessAddressPlaceholder')}
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-normal text-white transition-all duration-200 hover:bg-primary-dark disabled:opacity-60"
        >
          {saving ? tCommon('loading') : tCommon('save')}
        </button>
        {saved && (
          <span className="text-sm text-green-600">{t('saved')}</span>
        )}
      </div>
    </form>
  );
}
