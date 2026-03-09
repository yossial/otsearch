'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import type { TherapistProfilePublic, Specialisation, SessionType, InsuranceType } from '@/types';

const SPECIALISATIONS: Specialisation[] = [
  'paediatrics', 'neurological', 'mental-health', 'hand-therapy',
  'geriatrics', 'sensory-processing', 'vocational', 'ergonomic',
];
const SESSION_TYPES: SessionType[] = ['in-person', 'telehealth', 'home-visit'];
const INSURANCE_TYPES: InsuranceType[] = ['clalit', 'maccabi', 'meuhedet', 'leumit'];
const LANGUAGES = ['he', 'ar', 'en', 'ru', 'fr', 'es', 'am'];

const SPEC_LABELS: Record<Specialisation, string> = {
  paediatrics: 'ילדים ופיתוח', neurological: 'שיקום נוירולוגי',
  'mental-health': 'בריאות הנפש', 'hand-therapy': 'טיפול ביד',
  geriatrics: 'גריאטריה', 'sensory-processing': 'עיבוד חושי',
  vocational: 'שיקום תעסוקתי', ergonomic: 'ארגונומיה',
};
const SESSION_LABELS: Record<SessionType, string> = {
  'in-person': 'פרונטלי', telehealth: 'טיפול מרחוק', 'home-visit': 'ביקור בית',
};
const INSURANCE_LABELS: Record<InsuranceType, string> = {
  clalit: 'כללית', maccabi: 'מכבי', meuhedet: 'מאוחדת', leumit: 'לאומית',
};
const LANG_LABELS: Record<string, string> = {
  he: 'עברית', ar: 'ערבית', en: 'אנגלית', ru: 'רוסית', fr: 'צרפתית', es: 'ספרדית', am: 'אמהרית',
};

interface Props {
  profile: TherapistProfilePublic;
  onSaved?: () => void;
}

export default function ProfileEditForm({ profile, onSaved }: Props) {
  const t = useTranslations('dashboard.edit');

  const [bioHe, setBioHe] = useState(profile.bio.he ?? '');
  const [bioAr, setBioAr] = useState(profile.bio.ar ?? '');
  const [bioEn, setBioEn] = useState(profile.bio.en ?? '');
  const [city, setCity] = useState(profile.location.city ?? '');
  const [address, setAddress] = useState(profile.location.address ?? '');
  const [phone, setPhone] = useState(profile.contactPhone ?? '');
  const [specialisations, setSpecialisations] = useState<Specialisation[]>(profile.specialisations);
  const [specialisationsOther, setSpecialisationsOther] = useState(profile.specialisationsOther ?? '');
  const [sessionTypesOther, setSessionTypesOther] = useState(profile.sessionTypesOther ?? '');
  const [sessionTypes, setSessionTypes] = useState<SessionType[]>(profile.sessionTypes);
  const [insuranceAccepted, setInsuranceAccepted] = useState<InsuranceType[]>(profile.insuranceAccepted);
  const [languages, setLanguages] = useState<string[]>(profile.languages);
  const [feeMin, setFeeMin] = useState<string>(profile.feeRange ? String(profile.feeRange.min) : '');
  const [feeMax, setFeeMax] = useState<string>(profile.feeRange ? String(profile.feeRange.max) : '');
  const [acceptingPatients, setAcceptingPatients] = useState(profile.isAcceptingPatients);
  const [gender, setGender] = useState<'male' | 'female' | null>(profile.gender);
  const [photo, setPhoto] = useState<string>(profile.photo ?? '');

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  function toggle<T extends string>(arr: T[], val: T, setArr: (v: T[]) => void) {
    setArr(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess(false);

    const body: Record<string, unknown> = {
      bio: { he: bioHe, ar: bioAr, en: bioEn },
      location: { ...profile.location, city: city.trim(), address: address.trim() },
      contactPhone: phone.trim(),
      specialisations,
      specialisationsOther: specialisationsOther.trim() || undefined,
      sessionTypesOther: sessionTypesOther.trim() || undefined,
      sessionTypes,
      insuranceAccepted,
      languages,
      isAcceptingPatients: acceptingPatients,
      gender,
    };

    if (photo) body.photo = photo;

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
      onSaved?.();
    } catch {
      setError(t('saveError'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
      {/* Photo upload */}
      <div className="rounded-lg bg-surface p-6 border border-border">
        <h2 className="mb-4 text-base font-semibold text-text-primary">{t('photoLabel')}</h2>
        <div className="flex items-center gap-4">
          <div
            className={`relative h-20 w-20 cursor-pointer overflow-hidden rounded-full border-2 border-dashed bg-bg-alt transition-colors ${uploading ? 'border-primary opacity-70' : 'border-border hover:border-primary'}`}
            onClick={() => !uploading && document.getElementById('profile-photo-upload')?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && !uploading && document.getElementById('profile-photo-upload')?.click()}
            aria-label={t('photoLabel')}
          >
            {uploading ? (
              <svg className="absolute inset-0 m-auto h-5 w-5 animate-spin text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
              </svg>
            ) : photo ? (
              <Image src={photo} alt="Profile photo" fill className="object-cover" unoptimized />
            ) : (
              <svg className="absolute inset-0 m-auto h-7 w-7 text-text-muted" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
            )}
          </div>
          <input
            id="profile-photo-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setUploadError('');
              setUploading(true);
              try {
                const form = new FormData();
                form.append('file', file);
                const res = await fetch('/api/upload', { method: 'POST', body: form });
                if (res.ok) {
                  const data = await res.json() as { url: string };
                  setPhoto(data.url);
                } else {
                  setUploadError(t('photoError'));
                }
              } catch {
                setUploadError(t('photoError'));
              } finally {
                setUploading(false);
              }
            }}
          />
          <div>
            <p className="text-sm text-text-muted">
              {uploading ? t('photoUploading') : t('photoHint')}
            </p>
            {uploadError && <p className="mt-1 text-xs text-red-600">{uploadError}</p>}
          </div>
        </div>
      </div>

      {/* Bio */}
      <Section title={t('bio')}>
        <textarea
          value={bioHe}
          onChange={(e) => setBioHe(e.target.value)}
          rows={4}
          dir="rtl"
          className="w-full rounded-lg border border-border bg-bg px-3.5 py-2.5 text-sm text-text-primary focus:outline-none"
        />
        <label className="mt-3 block text-sm font-medium text-text-primary">{t('bioAr')}</label>
        <textarea
          value={bioAr}
          onChange={(e) => setBioAr(e.target.value)}
          rows={4}
          dir="rtl"
          className="mt-1.5 w-full rounded-lg border border-border bg-bg px-3.5 py-2.5 text-sm text-text-primary focus:outline-none"
        />
        <label className="mt-3 block text-sm font-medium text-text-primary">{t('bioEn')}</label>
        <textarea
          value={bioEn}
          onChange={(e) => setBioEn(e.target.value)}
          rows={4}
          dir="ltr"
          className="mt-1.5 w-full rounded-lg border border-border bg-bg px-3.5 py-2.5 text-sm text-text-primary focus:outline-none"
        />
      </Section>

      {/* Gender */}
      <Section title={t('gender')}>
        <div className="flex flex-wrap gap-2">
          {([['male', t('genderMale')], ['female', t('genderFemale')], [null, t('genderUnspecified')]] as [('male' | 'female' | null), string][]).map(([val, label]) => (
            <button
              key={String(val)}
              type="button"
              onClick={() => setGender(val)}
              className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                gender === val
                  ? 'border-primary bg-primary text-white'
                  : 'border-border bg-bg text-text-secondary hover:border-primary/50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
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
        <input
          value={specialisationsOther}
          onChange={(e) => setSpecialisationsOther(e.target.value)}
          placeholder={t('otherPlaceholder')}
          className={`mt-3 ${inputCls}`}
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
        <input
          value={sessionTypesOther}
          onChange={(e) => setSessionTypesOther(e.target.value)}
          placeholder={t('otherPlaceholder')}
          className={`mt-3 ${inputCls}`}
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
          className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-60"
        >
          {saving ? '...' : t('save')}
        </button>
      </div>
    </form>
  );
}

const inputCls =
  'w-full rounded-lg border border-border bg-bg px-3.5 py-2.5 text-sm text-text-primary focus:outline-none';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-surface p-6 border border-border">
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
        <label key={opt} className="flex items-center gap-2">
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
