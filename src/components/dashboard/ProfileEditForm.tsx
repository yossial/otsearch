'use client';

import { useState, useRef, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
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

function getInitials(name?: string | null): string {
  if (!name) return '?';
  return name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');
}

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
  const [specialisationsOther, setSpecialisationsOther] = useState<string[]>(profile.specialisationsOther ?? []);
  const [sessionTypesOther, setSessionTypesOther] = useState<string[]>(profile.sessionTypesOther ?? []);
  const [sessionTypes, setSessionTypes] = useState<SessionType[]>(profile.sessionTypes);
  const [insuranceAccepted, setInsuranceAccepted] = useState<InsuranceType[]>(profile.insuranceAccepted);
  const [languages, setLanguages] = useState<string[]>(profile.languages);
  const [feeMin, setFeeMin] = useState<string>(profile.feeRange ? String(profile.feeRange.min) : '');
  const [feeMax, setFeeMax] = useState<string>(profile.feeRange ? String(profile.feeRange.max) : '');
  const [acceptingPatients, setAcceptingPatients] = useState(profile.isAcceptingPatients);
  const [gender, setGender] = useState<'male' | 'female' | null>(profile.gender);
  const [photo, setPhoto] = useState<string>(profile.photo ?? '');

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  // Incremented after each save to force useMemo re-evaluation (ref updates don't trigger it)
  const [savedAt, setSavedAt] = useState(0);

  // Track initial values to detect dirty state
  const initial = useRef({
    bioHe: profile.bio.he ?? '',
    bioAr: profile.bio.ar ?? '',
    bioEn: profile.bio.en ?? '',
    city: profile.location.city ?? '',
    address: profile.location.address ?? '',
    phone: profile.contactPhone ?? '',
    specialisations: [...profile.specialisations],
    specialisationsOther: [...(profile.specialisationsOther ?? [])],
    sessionTypesOther: [...(profile.sessionTypesOther ?? [])],
    sessionTypes: [...profile.sessionTypes],
    insuranceAccepted: [...profile.insuranceAccepted],
    languages: [...profile.languages],
    feeMin: profile.feeRange ? String(profile.feeRange.min) : '',
    feeMax: profile.feeRange ? String(profile.feeRange.max) : '',
    acceptingPatients: profile.isAcceptingPatients,
    gender: profile.gender,
    photo: profile.photo ?? '',
  });

  const isDirty = useMemo(() => {
    const i = initial.current;
    return (
      bioHe !== i.bioHe ||
      bioAr !== i.bioAr ||
      bioEn !== i.bioEn ||
      city !== i.city ||
      address !== i.address ||
      phone !== i.phone ||
      JSON.stringify(specialisations) !== JSON.stringify(i.specialisations) ||
      JSON.stringify(specialisationsOther) !== JSON.stringify(i.specialisationsOther) ||
      JSON.stringify(sessionTypesOther) !== JSON.stringify(i.sessionTypesOther) ||
      JSON.stringify(sessionTypes) !== JSON.stringify(i.sessionTypes) ||
      JSON.stringify(insuranceAccepted) !== JSON.stringify(i.insuranceAccepted) ||
      JSON.stringify(languages) !== JSON.stringify(i.languages) ||
      feeMin !== i.feeMin ||
      feeMax !== i.feeMax ||
      acceptingPatients !== i.acceptingPatients ||
      gender !== i.gender ||
      photo !== i.photo
    );
  // savedAt is included so useMemo re-runs after save (ref update alone won't trigger it)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedAt, bioHe, bioAr, bioEn, city, address, phone, specialisations, specialisationsOther, sessionTypesOther, sessionTypes, insuranceAccepted, languages, feeMin, feeMax, acceptingPatients, gender, photo]);

  function toggle<T extends string>(arr: T[], val: T, setArr: (v: T[]) => void) {
    setArr(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const body: Record<string, unknown> = {
      bio: { he: bioHe, ar: bioAr, en: bioEn },
      location: { ...profile.location, city: city.trim(), address: address.trim() },
      contactPhone: phone.trim(),
      specialisations,
      specialisationsOther: specialisationsOther.length ? specialisationsOther : undefined,
      sessionTypesOther: sessionTypesOther.length ? sessionTypesOther : undefined,
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
      // Reset dirty baseline so button disables after save
      initial.current = {
        bioHe, bioAr, bioEn, city, address, phone,
        specialisations: [...specialisations],
        specialisationsOther: [...specialisationsOther],
        sessionTypesOther: [...sessionTypesOther],
        sessionTypes: [...sessionTypes],
        insuranceAccepted: [...insuranceAccepted],
        languages: [...languages],
        feeMin, feeMax, acceptingPatients, gender, photo,
      };
      setSavedAt((s) => s + 1); // trigger isDirty re-evaluation
      toast.success(t('saveSuccess'));
      onSaved?.();
    } catch {
      toast.error(t('saveError'));
    } finally {
      setSaving(false);
    }
  }

  const displayName = profile.displayName.he || profile.displayName.en || '';

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">

      {/* Hero card */}
      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <div className="h-1 bg-gradient-to-r from-primary-mid via-primary to-accent" />
        <div className="flex items-center gap-4 p-4">
          {/* Avatar — clickable to upload */}
          <div
            className={`relative h-16 w-16 flex-shrink-0 cursor-pointer overflow-hidden rounded-full border-2 border-dashed bg-bg-alt transition-colors ${uploading ? 'border-primary opacity-70' : 'border-border hover:border-primary'}`}
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
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photo} alt={displayName} className="h-full w-full object-cover" />
            ) : (
              <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-text-secondary">
                {displayName ? getInitials(displayName) : (
                  <svg className="h-6 w-6 text-text-muted" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                  </svg>
                )}
              </span>
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
              setUploading(true);
              try {
                const form = new FormData();
                form.append('file', file);
                const res = await fetch('/api/upload', { method: 'POST', body: form });
                if (res.ok) {
                  const data = await res.json() as { url: string };
                  setPhoto(data.url);
                } else {
                  toast.error(t('photoError'));
                }
              } catch {
                toast.error(t('photoError'));
              } finally {
                setUploading(false);
              }
            }}
          />

          <div className="min-w-0 flex-1">
            {displayName && (
              <p className="truncate text-base font-bold text-text-primary">{displayName}</p>
            )}
            <p className="text-xs text-text-secondary">
              {uploading ? t('photoUploading') : t('photoHint')}
            </p>
          </div>

          {/* Save button in hero */}
          <button
            type="submit"
            disabled={saving || !isDirty}
            className="inline-flex flex-shrink-0 items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold tracking-wide text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary-dark hover:shadow-[0_4px_12px_rgba(0,29,61,0.2)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none"
          >
            {saving ? (
              <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
            )}
            {t('save')}
          </button>
        </div>

      </div>

      {/* Bio */}
      <Section title={t('bio')}>
        <textarea
          value={bioHe}
          onChange={(e) => setBioHe(e.target.value)}
          rows={3}
          dir="rtl"
          className={textareaCls}
        />
        <label className="mt-3 block text-sm font-medium text-text-primary">{t('bioAr')}</label>
        <textarea
          value={bioAr}
          onChange={(e) => setBioAr(e.target.value)}
          rows={3}
          dir="rtl"
          className={`mt-1.5 ${textareaCls}`}
        />
        <label className="mt-3 block text-sm font-medium text-text-primary">{t('bioEn')}</label>
        <textarea
          value={bioEn}
          onChange={(e) => setBioEn(e.target.value)}
          rows={3}
          dir="ltr"
          className={`mt-1.5 ${textareaCls}`}
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
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
        <div className="grid grid-cols-2 gap-3 sm:w-64">
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
        <ChipGroup
          options={SPECIALISATIONS}
          selected={specialisations}
          labels={SPEC_LABELS}
          onToggle={(v) => toggle(specialisations, v as Specialisation, setSpecialisations)}
        />
        <div className="mt-3">
          <OtherTagInput
            tags={specialisationsOther}
            onAdd={(v) => setSpecialisationsOther((prev) => [...prev, v])}
            onRemove={(v) => setSpecialisationsOther((prev) => prev.filter((t) => t !== v))}
            placeholder={t('otherPlaceholder')}
          />
        </div>
      </Section>

      {/* Session types */}
      <Section title={t('sessionTypes')}>
        <ChipGroup
          options={SESSION_TYPES}
          selected={sessionTypes}
          labels={SESSION_LABELS}
          onToggle={(v) => toggle(sessionTypes, v as SessionType, setSessionTypes)}
        />
        <div className="mt-3">
          <OtherTagInput
            tags={sessionTypesOther}
            onAdd={(v) => setSessionTypesOther((prev) => [...prev, v])}
            onRemove={(v) => setSessionTypesOther((prev) => prev.filter((t) => t !== v))}
            placeholder={t('otherPlaceholder')}
          />
        </div>
      </Section>

      {/* Insurance */}
      <Section title={t('insurance')}>
        <ChipGroup
          options={INSURANCE_TYPES}
          selected={insuranceAccepted}
          labels={INSURANCE_LABELS}
          onToggle={(v) => toggle(insuranceAccepted, v as InsuranceType, setInsuranceAccepted)}
        />
      </Section>

      {/* Languages */}
      <Section title={t('languages')}>
        <ChipGroup
          options={LANGUAGES}
          selected={languages}
          labels={LANG_LABELS}
          onToggle={(v) => toggle(languages, v, setLanguages)}
        />
      </Section>

      {/* Accepting patients — toggle switch */}
      <div className="flex items-center justify-between rounded-xl border border-border bg-surface p-4">
        <div>
          <p className="text-sm font-semibold text-text-primary">{t('acceptingPatients')}</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={acceptingPatients}
          onClick={() => setAcceptingPatients((v) => !v)}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${acceptingPatients ? 'bg-primary' : 'bg-border'}`}
        >
          <span
            aria-hidden="true"
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ltr:translate-x-0 rtl:-translate-x-0 ${acceptingPatients ? 'ltr:translate-x-5 rtl:-translate-x-5' : ''}`}
          />
        </button>
      </div>

    </form>
  );
}

const inputCls =
  'w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text-primary focus:outline-none';
const textareaCls =
  'w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text-primary focus:outline-none';

function OtherTagInput({
  tags, onAdd, onRemove, placeholder,
}: {
  tags: string[];
  onAdd: (v: string) => void;
  onRemove: (v: string) => void;
  placeholder?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);

  function add() {
    const val = ref.current?.value.trim() ?? '';
    if (val && !tags.includes(val)) {
      onAdd(val);
      if (ref.current) ref.current.value = '';
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="flex items-center gap-1.5 rounded-full border border-primary bg-primary/10 px-3 py-1 text-sm font-medium text-primary"
            >
              {tag}
              <button
                type="button"
                onClick={() => onRemove(tag)}
                className="flex h-4 w-4 items-center justify-center rounded-full hover:bg-primary/20"
                aria-label={`Remove ${tag}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <input
          ref={ref}
          type="text"
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
          placeholder={placeholder}
          dir="auto"
          className={inputCls}
        />
        <button
          type="button"
          onClick={add}
          className="rounded-lg border border-primary px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary hover:text-white"
        >
          +
        </button>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <h2 className="mb-3 text-sm font-semibold text-text-primary">{title}</h2>
      {children}
    </div>
  );
}

function ChipGroup<T extends string>({
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
        <button
          key={opt}
          type="button"
          onClick={() => onToggle(opt)}
          className={`rounded-full border px-3 py-1 text-sm font-medium transition-colors ${
            selected.includes(opt)
              ? 'border-primary bg-primary text-white'
              : 'border-border bg-bg text-text-secondary hover:border-primary/50'
          }`}
        >
          {labels[opt] ?? opt}
        </button>
      ))}
    </div>
  );
}
