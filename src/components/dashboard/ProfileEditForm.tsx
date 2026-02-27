'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { OTProfilePublic, Specialisation, SessionType, InsuranceType } from '@/types';

const SPECIALISATIONS: Specialisation[] = [
  'paediatrics', 'neurological', 'mental-health', 'hand-therapy',
  'geriatrics', 'sensory-processing', 'vocational', 'ergonomic',
];
const SESSION_TYPES: SessionType[] = ['in-person', 'telehealth', 'home-visit'];
const INSURANCE_TYPES: InsuranceType[] = ['clalit', 'maccabi', 'meuhedet', 'leumit', 'private'];
const LANGUAGES = ['he', 'ar', 'en', 'ru', 'fr', 'am'];

const SPEC_LABELS: Record<Specialisation, string> = {
  paediatrics: 'ילדים ופיתוח', neurological: 'שיקום נוירולוגי',
  'mental-health': 'בריאות הנפש', 'hand-therapy': 'טיפול ביד',
  geriatrics: 'גריאטריה', 'sensory-processing': 'עיבוד חושי',
  vocational: 'שיקום תעסוקתי', ergonomic: 'ארגונומיה',
};
const SESSION_LABELS: Record<SessionType, string> = {
  'in-person': 'פרונטלי', telehealth: 'טלה-מדיסין', 'home-visit': 'ביקור בית',
};
const INSURANCE_LABELS: Record<InsuranceType, string> = {
  clalit: 'כללית', maccabi: 'מכבי', meuhedet: 'מאוחדת', leumit: 'לאומית', private: 'פרטי בלבד',
};
const LANG_LABELS: Record<string, string> = {
  he: 'עברית', ar: 'ערבית', en: 'אנגלית', ru: 'רוסית', fr: 'צרפתית', am: 'אמהרית',
};

interface Props {
  profile: OTProfilePublic;
}

export default function ProfileEditForm({ profile }: Props) {
  const t = useTranslations('dashboard.edit');

  const [bioHe, setBioHe] = useState(profile.bio.he);
  const [bioEn, setBioEn] = useState(profile.bio.en);
  const [city, setCity] = useState(profile.location.city);
  const [address, setAddress] = useState(profile.location.address);
  const [phone, setPhone] = useState(profile.contactPhone);
  const [specialisations, setSpecialisations] = useState<Specialisation[]>(profile.specialisations);
  const [sessionTypes, setSessionTypes] = useState<SessionType[]>(profile.sessionTypes);
  const [insuranceAccepted, setInsuranceAccepted] = useState<InsuranceType[]>(profile.insuranceAccepted);
  const [languages, setLanguages] = useState<string[]>(profile.languages);
  const [feeMin, setFeeMin] = useState<string>(profile.feeRange ? String(profile.feeRange.min) : '');
  const [feeMax, setFeeMax] = useState<string>(profile.feeRange ? String(profile.feeRange.max) : '');
  const [acceptingPatients, setAcceptingPatients] = useState(profile.isAcceptingPatients);

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  function toggle<T extends string>(arr: T[], val: T, setArr: (v: T[]) => void) {
    setArr(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess(false);

    const body: Record<string, unknown> = {
      bio: { he: bioHe, ar: profile.bio.ar, en: bioEn },
      location: { ...profile.location, city: city.trim(), address: address.trim() },
      contactPhone: phone.trim(),
      specialisations,
      sessionTypes,
      insuranceAccepted,
      languages,
      isAcceptingPatients: acceptingPatients,
    };

    if (feeMin && feeMax) {
      body.feeRange = { min: Number(feeMin), max: Number(feeMax), currency: 'ILS' };
    } else {
      body.feeRange = null;
    }

    try {
      const res = await fetch('/api/dashboard/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('save failed');
      setSuccess(true);
    } catch {
      setError(t('saveError'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
      {/* Bio */}
      <Section title={t('bio')}>
        <textarea
          value={bioHe}
          onChange={(e) => setBioHe(e.target.value)}
          rows={4}
          dir="rtl"
          className="w-full rounded-lg border border-border bg-bg px-3.5 py-2.5 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        <label className="mt-3 block text-sm font-medium text-text-primary">{t('bioEn')}</label>
        <textarea
          value={bioEn}
          onChange={(e) => setBioEn(e.target.value)}
          rows={4}
          dir="ltr"
          className="mt-1.5 w-full rounded-lg border border-border bg-bg px-3.5 py-2.5 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </Section>

      {/* Location & contact */}
      <Section title={t('city')}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-primary">{t('city')}</label>
            <input value={city} onChange={(e) => setCity(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-primary">{t('address')}</label>
            <input value={address} onChange={(e) => setAddress(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-primary">{t('phone')}</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" className={inputCls} dir="ltr" />
          </div>
        </div>
      </Section>

      {/* Fees */}
      <Section title={t('feeMin')}>
        <div className="grid grid-cols-2 gap-4 sm:w-72">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-primary">{t('feeMin')}</label>
            <input value={feeMin} onChange={(e) => setFeeMin(e.target.value)} type="number" min={0} className={inputCls} dir="ltr" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-primary">{t('feeMax')}</label>
            <input value={feeMax} onChange={(e) => setFeeMax(e.target.value)} type="number" min={0} className={inputCls} dir="ltr" />
          </div>
        </div>
      </Section>

      {/* Specialisations */}
      <Section title={t('specialisations')}>
        <CheckboxGroup
          options={SPECIALISATIONS}
          selected={specialisations}
          labels={SPEC_LABELS}
          onToggle={(v) => toggle(specialisations, v as Specialisation, setSpecialisations)}
        />
      </Section>

      {/* Session types */}
      <Section title={t('sessionTypes')}>
        <CheckboxGroup
          options={SESSION_TYPES}
          selected={sessionTypes}
          labels={SESSION_LABELS}
          onToggle={(v) => toggle(sessionTypes, v as SessionType, setSessionTypes)}
        />
      </Section>

      {/* Insurance */}
      <Section title={t('insurance')}>
        <CheckboxGroup
          options={INSURANCE_TYPES}
          selected={insuranceAccepted}
          labels={INSURANCE_LABELS}
          onToggle={(v) => toggle(insuranceAccepted, v as InsuranceType, setInsuranceAccepted)}
        />
      </Section>

      {/* Languages */}
      <Section title={t('languages')}>
        <CheckboxGroup
          options={LANGUAGES}
          selected={languages}
          labels={LANG_LABELS}
          onToggle={(v) => toggle(languages, v, setLanguages)}
        />
      </Section>

      {/* Accepting patients */}
      <div className="flex items-center gap-3">
        <input
          id="accepting"
          type="checkbox"
          checked={acceptingPatients}
          onChange={(e) => setAcceptingPatients(e.target.checked)}
          className="h-4 w-4 rounded border-border accent-primary"
        />
        <label htmlFor="accepting" className="text-sm font-medium text-text-primary">
          {t('acceptingPatients')}
        </label>
      </div>

      {success && (
        <p className="rounded-lg bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
          {t('saveSuccess')}
        </p>
      )}
      {error && (
        <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:opacity-60"
        >
          {saving ? '...' : t('save')}
        </button>
      </div>
    </form>
  );
}

const inputCls =
  'w-full rounded-lg border border-border bg-bg px-3.5 py-2.5 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-surface p-6 shadow-card">
      <h2 className="mb-4 text-base font-semibold text-text-primary">{title}</h2>
      {children}
    </div>
  );
}

function CheckboxGroup<T extends string>({
  options, selected, labels, onToggle,
}: {
  options: T[];
  selected: T[];
  labels: Record<string, string>;
  onToggle: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <label key={opt} className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={selected.includes(opt)}
            onChange={() => onToggle(opt)}
            className="h-4 w-4 rounded border-border accent-primary"
          />
          <span className="text-sm text-text-primary">{labels[opt] ?? opt}</span>
        </label>
      ))}
    </div>
  );
}
