'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import type { Specialisation, InsuranceType, SessionType } from '@/types';
import CitySelect from '@/components/ui/CitySelect';
import StreetSelect from '@/components/ui/StreetSelect';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Step1Data {
  firstName: string;
  lastName: string;
  languages: string[];
  gender: 'male' | 'female' | null;
  photo: string;
}

interface Step2Data {
  country: string;
  city: string;
  cityCode: number;
  street: string;
  buildingNumber: string;
  specialisations: Specialisation[];
  specialisationsOther: string;
  sessionTypes: SessionType[];
  sessionTypesOther: string;
}

interface Step3Data {
  phone: string;
  email: string;
  feeMin: string;
  feeMax: string;
  insuranceAccepted: InsuranceType[];
  mohNumber: string;
  acceptingPatients: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const LANGUAGES = ['he', 'en', 'ru', 'fr', 'es', 'am'] as const;
const LANGUAGE_LABELS: Record<string, string> = {
  he: 'עברית / Hebrew',
  en: 'English',
  ru: 'Русский / Russian',
  fr: 'Français / French',
  es: 'Español / Spanish',
  am: 'አማርኛ / Amharic',
};

const SPECIALISATIONS: Specialisation[] = [
  'paediatrics', 'neurological', 'mental-health', 'hand-therapy',
  'geriatrics', 'sensory-processing', 'vocational', 'ergonomic',
];
const SPECIALISATION_LABELS: Record<Specialisation, string> = {
  paediatrics: 'התפתחות הילד / Child Development',
  neurological: 'שיקום נוירולוגי / Neurological',
  'mental-health': 'בריאות הנפש / Mental Health',
  'hand-therapy': 'שיקום כף יד / Hand Rehab',
  geriatrics: 'גריאטריה / Geriatrics',
  'sensory-processing': 'עיבוד חושי / Sensory Processing',
  vocational: 'שיקום תעסוקתי / Vocational',
  ergonomic: 'ארגונומיה / Ergonomics',
};

const SESSION_TYPES: SessionType[] = ['in-person', 'telehealth', 'home-visit'];
const SESSION_TYPE_LABELS: Record<SessionType, string> = {
  'in-person': 'פרונטלי / In-person',
  telehealth: 'טיפול מרחוק / Remote session',
  'home-visit': 'ביקור בית / Home visit',
};

const INSURANCE_TYPES: InsuranceType[] = ['clalit', 'maccabi', 'meuhedet', 'leumit'];

const COUNTRIES: { code: string; label: string }[] = [
  { code: 'IL', label: '🇮🇱 ישראל / Israel' },
  { code: 'US', label: '🇺🇸 United States' },
  { code: 'GB', label: '🇬🇧 United Kingdom' },
  { code: 'DE', label: '🇩🇪 Germany / Deutschland' },
  { code: 'FR', label: '🇫🇷 France' },
  { code: 'CA', label: '🇨🇦 Canada' },
  { code: 'AU', label: '🇦🇺 Australia' },
  { code: 'NL', label: '🇳🇱 Netherlands' },
  { code: 'CH', label: '🇨🇭 Switzerland' },
  { code: 'other', label: 'Other' },
];
const INSURANCE_LABELS: Record<InsuranceType, string> = {
  clalit: 'כללית / Clalit',
  maccabi: 'מכבי / Maccabi',
  meuhedet: 'מאוחדת / Meuhedet',
  leumit: 'לאומית / Leumit',
};

// ─── Small reusable components ─────────────────────────────────────────────

function ToggleChip<T extends string>({
  value, label, selected, onToggle,
}: { value: T; label: string; selected: boolean; onToggle: (v: T) => void }) {
  return (
    <button
      type="button"
      onClick={() => onToggle(value)}
      className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
        selected
          ? 'border-primary bg-primary text-white'
          : 'border-border bg-bg text-text-secondary hover:border-primary/50'
      }`}
    >
      {label}
    </button>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="text-sm font-medium text-text-primary">{children}</label>;
}

function TextInput({
  id, value, onChange, placeholder, required, dir, inputMode, maxLength,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  dir?: 'rtl' | 'ltr' | 'auto';
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
  maxLength?: number;
}) {
  return (
    <input
      id={id}
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      required={required}
      dir={dir}
      inputMode={inputMode}
      maxLength={maxLength}
      className="rounded-lg border border-border bg-bg px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
    />
  );
}

// ─── Progress bar ──────────────────────────────────────────────────────────

function ProgressBar({ currentStep, totalSteps, stepTitle }: { currentStep: number; totalSteps: number; stepTitle: string }) {
  const t = useTranslations('onboarding.therapist');
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold text-text-primary">{stepTitle}</span>
        <span className="text-text-muted">
          {t('step', { current: currentStep, total: totalSteps })}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
        <div
          className="h-full rounded-full bg-primary transition-all duration-300"
          style={{ width: `${(currentStep / totalSteps) * 100}%` }}
        />
      </div>
    </div>
  );
}

// ─── Step 1: Basic info ────────────────────────────────────────────────────

function Step1({
  data, onChange,
}: { data: Step1Data; onChange: (d: Partial<Step1Data>) => void }) {
  const t = useTranslations('onboarding.therapist');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  return (
    <div className="flex flex-col gap-5">
      {/* Avatar upload */}
      <div className="flex flex-col items-center gap-3">
        <div
          className={`relative h-24 w-24 cursor-pointer overflow-hidden rounded-full border-2 border-dashed bg-bg-alt transition-colors ${uploading ? 'border-primary opacity-70' : 'border-border hover:border-primary'}`}
          onClick={() => !uploading && document.getElementById('avatar-upload')?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && !uploading && document.getElementById('avatar-upload')?.click()}
          aria-label={t('photoLabel')}
        >
          {uploading ? (
            <svg className="absolute inset-0 m-auto h-6 w-6 animate-spin text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
            </svg>
          ) : data.photo ? (
            <Image src={data.photo} alt="Avatar" fill className="object-cover" unoptimized />
          ) : (
            <svg className="absolute inset-0 m-auto h-8 w-8 text-text-muted" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
          )}
        </div>
        <input
          id="avatar-upload"
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
                const data2 = await res.json() as { url: string };
                onChange({ photo: data2.url });
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
        <p className="text-xs text-text-muted">
          {uploading ? t('photoUploading') : t('photoHint')}
        </p>
        {uploadError && <p className="text-xs text-red-600">{uploadError}</p>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <FieldLabel>{t('firstName')} *</FieldLabel>
          <TextInput
            id="firstName"
            value={data.firstName}
            onChange={(v) => onChange({ firstName: v })}
            dir="auto"
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <FieldLabel>{t('lastName')} *</FieldLabel>
          <TextInput
            id="lastName"
            value={data.lastName}
            onChange={(v) => onChange({ lastName: v })}
            dir="auto"
            required
          />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <FieldLabel>{t('gender')}</FieldLabel>
        <div className="flex flex-wrap gap-2">
          {([['male', t('genderMale')], ['female', t('genderFemale')], [null, t('genderUnspecified')]] as [('male' | 'female' | null), string][]).map(([val, label]) => (
            <button
              key={String(val)}
              type="button"
              onClick={() => onChange({ gender: val })}
              className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                data.gender === val
                  ? 'border-primary bg-primary text-white'
                  : 'border-border bg-bg text-text-secondary hover:border-primary/50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <FieldLabel>{t('languages')}</FieldLabel>
        <div className="flex flex-wrap gap-2">
          {LANGUAGES.map((lang) => (
            <ToggleChip
              key={lang}
              value={lang}
              label={LANGUAGE_LABELS[lang]}
              selected={data.languages.includes(lang)}
              onToggle={(v) => {
                const next = data.languages.includes(v)
                  ? data.languages.filter((l) => l !== v)
                  : [...data.languages, v];
                onChange({ languages: next });
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Step 2: Location + specialisations ────────────────────────────────────

function Step2({
  data, onChange,
}: { data: Step2Data; onChange: (d: Partial<Step2Data>) => void }) {
  const t = useTranslations('onboarding.therapist');
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <FieldLabel>{t('country')}</FieldLabel>
        <select
          value={data.country}
          onChange={(e) => onChange({ country: e.target.value, city: '', cityCode: 0, street: '', buildingNumber: '' })}
          className="rounded-lg border border-border bg-bg px-3.5 py-2.5 text-sm text-text-primary focus:border-primary focus:outline-none"
        >
          {COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>{c.label}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <FieldLabel>{t('city')}</FieldLabel>
        {data.country === 'IL' ? (
          <CitySelect
            value={data.city}
            onChange={(name, code) => onChange({ city: name, cityCode: code, street: '', buildingNumber: '' })}
            required
          />
        ) : (
          <TextInput
            id="city"
            value={data.city}
            onChange={(v) => onChange({ city: v })}
            dir="auto"
            required
          />
        )}
      </div>

      {data.city && data.country === 'IL' && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <FieldLabel>{t('address')}</FieldLabel>
            <StreetSelect
              cityCode={data.cityCode}
              value={data.street}
              onChange={(v) => onChange({ street: v })}
            />
          </div>
          {data.street && (
            <div className="flex flex-col gap-1.5">
              <FieldLabel>מספר בית</FieldLabel>
              <TextInput
                id="buildingNumber"
                value={data.buildingNumber}
                onChange={(v) => onChange({ buildingNumber: v })}
                dir="ltr"
                placeholder="12"
              />
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <FieldLabel>{t('specialisations')}</FieldLabel>
        <div className="flex flex-wrap gap-2">
          {SPECIALISATIONS.map((sp) => (
            <ToggleChip
              key={sp}
              value={sp}
              label={SPECIALISATION_LABELS[sp]}
              selected={data.specialisations.includes(sp)}
              onToggle={(v) => {
                const next = data.specialisations.includes(v)
                  ? data.specialisations.filter((s) => s !== v)
                  : [...data.specialisations, v];
                onChange({ specialisations: next });
              }}
            />
          ))}
        </div>
        <TextInput
          id="specialisationsOther"
          value={data.specialisationsOther}
          onChange={(v) => onChange({ specialisationsOther: v })}
          placeholder={t('otherPlaceholder')}
          dir="auto"
        />
      </div>

      <div className="flex flex-col gap-2">
        <FieldLabel>{t('sessionTypes')}</FieldLabel>
        <div className="flex flex-wrap gap-2">
          {SESSION_TYPES.map((st) => (
            <ToggleChip
              key={st}
              value={st}
              label={SESSION_TYPE_LABELS[st]}
              selected={data.sessionTypes.includes(st)}
              onToggle={(v) => {
                const next = data.sessionTypes.includes(v)
                  ? data.sessionTypes.filter((s) => s !== v)
                  : [...data.sessionTypes, v];
                onChange({ sessionTypes: next });
              }}
            />
          ))}
        </div>
        <TextInput
          id="sessionTypesOther"
          value={data.sessionTypesOther}
          onChange={(v) => onChange({ sessionTypesOther: v })}
          placeholder={t('otherPlaceholder')}
          dir="auto"
        />
      </div>
    </div>
  );
}

// ─── Step 3: Contact + fees ─────────────────────────────────────────────────

function Step3({
  data, onChange,
}: { data: Step3Data; onChange: (d: Partial<Step3Data>) => void }) {
  const t = useTranslations('onboarding.therapist');
  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <FieldLabel>{t('phone')}</FieldLabel>
          <input
            id="phone"
            type="tel"
            autoComplete="tel"
            value={data.phone}
            onChange={(e) => onChange({ phone: e.target.value })}
            dir="ltr"
            required
            className="rounded-lg border border-border bg-bg px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <FieldLabel>{t('email')}</FieldLabel>
          <input
            id="contact-email"
            type="email"
            autoComplete="email"
            value={data.email}
            onChange={(e) => onChange({ email: e.target.value })}
            dir="ltr"
            className="rounded-lg border border-border bg-bg px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <FieldLabel>{t('feeMin')}</FieldLabel>
          <input
            id="feeMin"
            type="number"
            min="0"
            step="10"
            value={data.feeMin}
            onChange={(e) => onChange({ feeMin: e.target.value })}
            dir="ltr"
            className="rounded-lg border border-border bg-bg px-3.5 py-2.5 text-sm text-text-primary focus:outline-none"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <FieldLabel>{t('feeMax')}</FieldLabel>
          <input
            id="feeMax"
            type="number"
            min="0"
            step="10"
            value={data.feeMax}
            onChange={(e) => onChange({ feeMax: e.target.value })}
            dir="ltr"
            className="rounded-lg border border-border bg-bg px-3.5 py-2.5 text-sm text-text-primary focus:outline-none"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <FieldLabel>{t('insurance')}</FieldLabel>
        <div className="flex flex-wrap gap-2">
          {INSURANCE_TYPES.map((ins) => (
            <ToggleChip
              key={ins}
              value={ins}
              label={INSURANCE_LABELS[ins]}
              selected={data.insuranceAccepted.includes(ins)}
              onToggle={(v) => {
                const next = data.insuranceAccepted.includes(v)
                  ? data.insuranceAccepted.filter((i) => i !== v)
                  : [...data.insuranceAccepted, v];
                onChange({ insuranceAccepted: next });
              }}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <FieldLabel>{t('mohNumber')} *</FieldLabel>
        <TextInput
          id="mohNumber"
          value={data.mohNumber}
          onChange={(v) => onChange({ mohNumber: v.replace(/\D/g, '') })}
          dir="ltr"
          required
          inputMode="numeric"
          maxLength={6}
        />
        <p className="text-xs text-text-muted">{t('mohNumberHint')}</p>
      </div>

      <label className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={data.acceptingPatients}
          onChange={(e) => onChange({ acceptingPatients: e.target.checked })}
          className="h-4 w-4 rounded border-border text-primary"
        />
        <span className="text-sm text-text-primary">{t('acceptingPatients')}</span>
      </label>
    </div>
  );
}

// ─── Main wizard ────────────────────────────────────────────────────────────

const TOTAL_STEPS = 3;

export default function TherapistOnboardingWizard({ therapistProfileId }: { therapistProfileId: string }) {
  const t = useTranslations('onboarding.therapist');
  const router = useRouter();
  const { update: updateSession } = useSession();

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [step1, setStep1] = useState<Step1Data>({
    firstName: '',
    lastName: '',
    languages: ['he'],
    gender: null,
    photo: '',
  });
  const [step2, setStep2] = useState<Step2Data>({
    country: 'IL',
    city: '',
    cityCode: 0,
    street: '',
    buildingNumber: '',
    specialisations: [],
    specialisationsOther: '',
    sessionTypes: [],
    sessionTypesOther: '',
  });
  const [step3, setStep3] = useState<Step3Data>({
    phone: '',
    email: '',
    feeMin: '',
    feeMax: '',
    insuranceAccepted: [],
    mohNumber: '',
    acceptingPatients: true,
  });

  // Use _ to avoid unused var warning — therapistProfileId is passed but auth is session-based
  void therapistProfileId;

  function validateCurrent(): string | null {
    if (step === 1) {
      if (!step1.firstName.trim()) return 'firstName';
      if (!step1.lastName.trim()) return 'lastName';
      if (step1.languages.length === 0) return 'languages';
    }
    if (step === 2) {
      if (!step2.city.trim()) return 'city';
      if (step2.specialisations.length === 0) return 'specialisations';
      if (step2.sessionTypes.length === 0) return 'sessionTypes';
    }
    if (step === 3) {
      if (!step3.phone.trim()) return 'phone';
      if (!/^0(5[0-9]|[2-489])[0-9]{7}$/.test(step3.phone.trim())) return 'phone';
      if (!step3.mohNumber.trim()) return 'mohNumber';
      if (!/^\d{5,6}$/.test(step3.mohNumber.trim())) return 'mohNumber';
    }
    return null;
  }

  function handleNext() {
    const missing = validateCurrent();
    if (missing) {
      const el = document.getElementById(missing);
      el?.focus();
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    setStep((s) => s + 1);
  }

  async function handleFinish() {
    const missing = validateCurrent();
    if (missing) {
      const el = document.getElementById(missing);
      el?.focus();
      return;
    }

    setSaving(true);
    setError('');

    const feeMin = parseFloat(step3.feeMin);
    const feeMax = parseFloat(step3.feeMax);

    const addressParts = [step2.street, step2.buildingNumber].filter(Boolean).join(' ');

    const fullName = `${step1.firstName.trim()} ${step1.lastName.trim()}`.trim();

    const payload: Record<string, unknown> = {
      firstName: step1.firstName.trim(),
      lastName: step1.lastName.trim(),
      displayName: {
        he: fullName,
        en: fullName,
        ar: fullName,
      },
      languages: step1.languages,
      location: {
        type: 'Point',
        coordinates: [34.7818, 32.0853],
        city: step2.city,
        address: addressParts,
        country: step2.country,
      },
      specialisations: step2.specialisations,
      specialisationsOther: step2.specialisationsOther.trim() || undefined,
      sessionTypes: step2.sessionTypes,
      sessionTypesOther: step2.sessionTypesOther.trim() || undefined,
      contactPhone: step3.phone,
      contactEmail: step3.email || undefined,
      insuranceAccepted: step3.insuranceAccepted,
      isAcceptingPatients: step3.acceptingPatients,
      gender: step1.gender,
      mohRegistrationNumber: step3.mohNumber.trim(),
      photo: step1.photo || undefined,
    };

    if (!isNaN(feeMin) && !isNaN(feeMax) && feeMin > 0 && feeMax >= feeMin) {
      payload.feeRange = { min: feeMin, max: feeMax, currency: 'ILS' };
    }

    try {
      const res = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        const errMsg = body.error ?? '';
        if (errMsg.toLowerCase().includes('not found') || errMsg.toLowerCase().includes('not found in')) {
          setError(t('mohNotFound'));
        } else if (errMsg.toLowerCase().includes('status') || errMsg.toLowerCase().includes('licence status')) {
          setError(t('mohExpired'));
        } else {
          setError(t('saveError'));
        }
        setSaving(false);
        return;
      }

      const data = (await res.json()) as { role?: string; therapistProfileId?: string };

      // Refresh JWT so session reflects new role + profileId
      await updateSession({ role: data.role, therapistProfileId: data.therapistProfileId });

      router.push('/dashboard');
      router.refresh();
    } catch {
      setError(t('saveError'));
      setSaving(false);
    }
  }

  const stepTitles = [t('step1Title'), t('step2Title'), t('step3Title')];

  return (
    <div className="mx-auto max-w-xl px-4 py-10 sm:px-6">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-text-primary">{t('title')}</h1>
        <p className="mt-1 text-sm text-text-secondary">{t('subtitle')}</p>
      </div>

      {/* Progress */}
      <div className="mb-8">
        <ProgressBar currentStep={step} totalSteps={TOTAL_STEPS} stepTitle={stepTitles[step - 1]} />
      </div>

      {/* Step content */}
      <div className="rounded-2xl bg-surface p-6 border border-border sm:p-8">
        {step === 1 && (
          <Step1 data={step1} onChange={(d) => setStep1((s) => ({ ...s, ...d }))} />
        )}
        {step === 2 && (
          <Step2 data={step2} onChange={(d) => setStep2((s) => ({ ...s, ...d }))} />
        )}
        {step === 3 && (
          <Step3 data={step3} onChange={(d) => setStep3((s) => ({ ...s, ...d }))} />
        )}

        {error && (
          <p role="alert" className="mt-4 rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
            {error}
          </p>
        )}

        {/* Navigation */}
        <div className="mt-6 flex items-center justify-between gap-4">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:bg-bg"
            >
              {t('back')}
            </button>
          ) : (
            <div />
          )}

          {step < TOTAL_STEPS ? (
            <button
              type="button"
              onClick={handleNext}
              className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
            >
              {t('next')}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void handleFinish()}
              disabled={saving}
              className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-60"
            >
              {saving ? '...' : t('finish')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
