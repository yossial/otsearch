'use client';

import { useOptimistic, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

interface Settings {
  showTherapistFee: boolean;
  showTherapistRating: boolean;
  showTherapistMap: boolean;
  featuredSectionEnabled: boolean;
  newRegistrationsEnabled: boolean;
  requireAdminApproval: boolean;
  contactEmail: string;
  defaultSortOrder: 'relevance' | 'rating' | 'newest';
  premiumMonthlyPrice: number;
  premiumAnnualPrice: number;
}

async function patchSettings(patch: Partial<Settings>): Promise<Settings> {
  const res = await fetch('/api/admin/settings', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error('Failed to update settings');
  return res.json() as Promise<Settings>;
}

export default function SettingsForm({ settings: initial }: { settings: Settings }) {
  const t = useTranslations('admin');
  const [optimisticSettings, applyOptimistic] = useOptimistic<Settings, Partial<Settings>>(
    initial,
    (state, patch) => ({ ...state, ...patch })
  );
  const [, startTransition] = useTransition();

  function toggle(key: keyof Settings) {
    const newVal = !optimisticSettings[key];
    startTransition(async () => {
      applyOptimistic({ [key]: newVal });
      try {
        await patchSettings({ [key]: newVal });
        toast.success(t('toast.saved'));
      } catch {
        toast.error(t('toast.error'));
      }
    });
  }

  function updateField(key: keyof Settings, value: string | number) {
    startTransition(async () => {
      try {
        await patchSettings({ [key]: value });
        toast.success(t('toast.saved'));
      } catch {
        toast.error(t('toast.error'));
      }
    });
  }

  return (
    <div className="space-y-8">
      <Section title={t('settings.sections.featureFlags')}>
        <Toggle label={t('settings.flags.showFee')} checked={optimisticSettings.showTherapistFee} onChange={() => toggle('showTherapistFee')} />
        <Toggle label={t('settings.flags.showRating')} checked={optimisticSettings.showTherapistRating} onChange={() => toggle('showTherapistRating')} />
        <Toggle label={t('settings.flags.showMap')} checked={optimisticSettings.showTherapistMap} onChange={() => toggle('showTherapistMap')} />
        <Toggle label={t('settings.flags.featuredSection')} checked={optimisticSettings.featuredSectionEnabled} onChange={() => toggle('featuredSectionEnabled')} />
      </Section>

      <Section title={t('settings.sections.registration')}>
        <Toggle label={t('settings.flags.newRegistrations')} checked={optimisticSettings.newRegistrationsEnabled} onChange={() => toggle('newRegistrationsEnabled')} />
        <Toggle label={t('settings.flags.requireApproval')} checked={optimisticSettings.requireAdminApproval} onChange={() => toggle('requireAdminApproval')} />
      </Section>

      <Section title={t('settings.sections.platform')}>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-text-primary">{t('settings.fields.contactEmail')}</label>
          <input
            type="email"
            defaultValue={optimisticSettings.contactEmail}
            onBlur={(e) => updateField('contactEmail', e.target.value)}
            className="w-full max-w-sm rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-text-primary">{t('settings.fields.defaultSort')}</label>
          <select
            defaultValue={optimisticSettings.defaultSortOrder}
            onChange={(e) => updateField('defaultSortOrder', e.target.value)}
            className="w-48 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="relevance">{t('settings.sortOptions.relevance')}</option>
            <option value="rating">{t('settings.sortOptions.rating')}</option>
            <option value="newest">{t('settings.sortOptions.newest')}</option>
          </select>
        </div>
      </Section>

      <Section title={t('settings.sections.pricing')}>
        <div className="flex gap-6">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-text-primary">{t('settings.fields.monthlyPrice')}</label>
            <input
              type="number"
              defaultValue={optimisticSettings.premiumMonthlyPrice}
              onBlur={(e) => updateField('premiumMonthlyPrice', Number(e.target.value))}
              className="w-32 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-text-primary">{t('settings.fields.annualPrice')}</label>
            <input
              type="number"
              defaultValue={optimisticSettings.premiumAnnualPrice}
              onBlur={(e) => updateField('premiumAnnualPrice', Number(e.target.value))}
              className="w-32 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="mb-4 text-base font-semibold text-text-primary">{title}</h2>
      <div className="space-y-3 rounded-xl border border-border bg-surface p-5">{children}</div>
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4">
      <span className="text-sm text-text-primary">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={onChange}
        className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors focus:outline-none ${
          checked ? 'bg-primary' : 'bg-border'
        }`}
      >
        <span
          className={`inline-block h-5 w-5 translate-y-0.5 rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0.5'
          }`}
        />
      </button>
    </label>
  );
}
