'use client';

import { useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import type { Specialisation, InsuranceType, SessionType } from '@/types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Step1Data {
  displayNameHe: string;
  displayNameEn: string;
  displayNameAr: string;
  languages: string[];
}

interface Step2Data {
  city: string;
  address: string;
  specialisations: Specialisation[];
  sessionTypes: SessionType[];
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

const LANGUAGES = ['he', 'ar', 'en', 'ru', 'am'] as const;
const LANGUAGE_LABELS: Record<string, string> = {
  he: 'עברית / Hebrew',
  ar: 'عربية / Arabic',
  en: 'English',
  ru: 'Русский / Russian',
  am: 'አማርኛ / Amharic',
};

const SPECIALISATIONS: Specialisation[] = [
  'paediatrics', 'neurological', 'mental-health', 'hand-therapy',
  'geriatrics', 'sensory-processing', 'vocational', 'ergonomic',
];
const SPECIALISATION_LABELS: Record<Specialisation, string> = {
  paediatrics: 'ילדים ופיתוח / Paediatrics',
  neurological: 'שיקום נוירולוגי / Neurological',
  'mental-health': 'בריאות הנפש / Mental Health',
  'hand-therapy': 'טיפול ביד / Hand Therapy',
  geriatrics: 'גריאטריה / Geriatrics',
  'sensory-processing': 'עיבוד חושי / Sensory Processing',
  vocational: 'שיקום תעסוקתי / Vocational',
  ergonomic: 'ארגונומיה / Ergonomics',
};

const SESSION_TYPES: SessionType[] = ['in-person', 'telehealth', 'home-visit'];
const SESSION_TYPE_LABELS: Record<SessionType, string> = {
  'in-person': 'פרונטלי / In-person',
  telehealth: 'טלה-מדיסין / Telehealth',
  'home-visit': 'ביקור בית / Home visit',
};

const INSURANCE_TYPES: InsuranceType[] = ['clalit', 'maccabi', 'meuhedet', 'leumit', 'private'];
const INSURANCE_LABELS: Record<InsuranceType, string> = {
  clalit: 'כללית / Clalit',
  maccabi: 'מכבי / Maccabi',
  meuhedet: 'מאוחדת / Meuhedet',
  leumit: 'לאומית / Leumit',
  private: 'פרטי / Private pay',
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
  id, value, onChange, placeholder, required, dir,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  dir?: 'rtl' | 'ltr' | 'auto';
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
      className="rounded-lg border border-border bg-bg px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
    />
  );
}

// ─── Progress bar ──────────────────────────────────────────────────────────

function ProgressBar({ currentStep, totalSteps, stepTitle }: { currentStep: number; totalSteps: number; stepTitle: string }) {
  const t = useTranslations('onboarding.ot');
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
  const t = useTranslations('onboarding.ot');
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <FieldLabel>{t('displayNameHe')}</FieldLabel>
        <TextInput
          id="displayNameHe"
          value={data.displayNameHe}
          onChange={(v) => onChange({ displayNameHe: v })}
          dir="rtl"
          required
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <FieldLabel>{t('displayNameEn')}</FieldLabel>
        <TextInput
          id="displayNameEn"
          value={data.displayNameEn}
          onChange={(v) => onChange({ displayNameEn: v })}
          dir="ltr"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <FieldLabel>{t('displayNameAr')}</FieldLabel>
        <TextInput
          id="displayNameAr"
          value={data.displayNameAr}
          onChange={(v) => onChange({ displayNameAr: v })}
          dir="rtl"
        />
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
  const t = useTranslations('onboarding.ot');
  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <FieldLabel>{t('city')}</FieldLabel>
          <TextInput
            id="city"
            value={data.city}
            onChange={(v) => onChange({ city: v })}
            dir="auto"
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <FieldLabel>{t('address')}</FieldLabel>
          <TextInput
            id="address"
            value={data.address}
            onChange={(v) => onChange({ address: v })}
            dir="auto"
          />
        </div>
      </div>

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
      </div>
    </div>
  );
}

// ─── Step 3: Contact + fees ─────────────────────────────────────────────────

function Step3({
  data, onChange,
}: { data: Step3Data; onChange: (d: Partial<Step3Data>) => void }) {
  const t = useTranslations('onboarding.ot');
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
            className="rounded-lg border border-border bg-bg px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
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
            className="rounded-lg border border-border bg-bg px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
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
            className="rounded-lg border border-border bg-bg px-3.5 py-2.5 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
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
            className="rounded-lg border border-border bg-bg px-3.5 py-2.5 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
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
        <FieldLabel>{t('mohNumber')}</FieldLabel>
        <TextInput
          id="mohNumber"
          value={data.mohNumber}
          onChange={(v) => onChange({ mohNumber: v })}
          dir="ltr"
        />
      </div>

      <label className="flex cursor-pointer items-center gap-3">
        <input
          type="checkbox"
          checked={data.acceptingPatients}
          onChange={(e) => onChange({ acceptingPatients: e.target.checked })}
          className="h-4 w-4 rounded border-border text-primary focus:ring-primary/20"
        />
        <span className="text-sm text-text-primary">{t('acceptingPatients')}</span>
      </label>
    </div>
  );
}

// ─── Main wizard ────────────────────────────────────────────────────────────

const TOTAL_STEPS = 3;

export default function OTOnboardingWizard({ otProfileId }: { otProfileId: string }) {
  const t = useTranslations('onboarding.ot');
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [step1, setStep1] = useState<Step1Data>({
    displayNameHe: '',
    displayNameEn: '',
    displayNameAr: '',
    languages: ['he'],
  });
  const [step2, setStep2] = useState<Step2Data>({
    city: '',
    address: '',
    specialisations: [],
    sessionTypes: [],
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

  function validateCurrent(): string | null {
    if (step === 1) {
      if (!step1.displayNameHe.trim()) return 'displayNameHe';
      if (step1.languages.length === 0) return 'languages';
    }
    if (step === 2) {
      if (!step2.city.trim()) return 'city';
      if (step2.specialisations.length === 0) return 'specialisations';
      if (step2.sessionTypes.length === 0) return 'sessionTypes';
    }
    if (step === 3) {
      if (!step3.phone.trim()) return 'phone';
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

    const payload: Record<string, unknown> = {
      displayName: {
        he: step1.displayNameHe,
        en: step1.displayNameEn || step1.displayNameHe,
        ar: step1.displayNameAr || step1.displayNameHe,
      },
      languages: step1.languages,
      location: {
        type: 'Point',
        coordinates: [34.7818, 32.0853],
        city: step2.city,
        address: step2.address,
      },
      specialisations: step2.specialisations,
      sessionTypes: step2.sessionTypes,
      contactPhone: step3.phone,
      contactEmail: step3.email || undefined,
      insuranceAccepted: step3.insuranceAccepted,
      isAcceptingPatients: step3.acceptingPatients,
    };

    if (!isNaN(feeMin) && !isNaN(feeMax) && feeMin > 0 && feeMax >= feeMin) {
      payload.feeRange = { min: feeMin, max: feeMax, currency: 'ILS' };
    }

    if (step3.mohNumber.trim()) {
      payload.mohRegistrationNumber = step3.mohNumber.trim();
    }

    // Use _ to avoid unused var warning — otProfileId is passed but auth is session-based
    void otProfileId;

    try {
      const res = await fetch('/api/dashboard/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        setError(t('saveError'));
        setSaving(false);
        return;
      }

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
      <div className="rounded-2xl bg-surface p-6 shadow-card sm:p-8">
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
              className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
            >
              {t('next')}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void handleFinish()}
              disabled={saving}
              className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:opacity-60"
            >
              {saving ? '...' : t('finish')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
