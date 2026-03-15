'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import type { Specialisation, InsuranceType, SessionType } from '@/types';
import CitySelect from '@/components/ui/CitySelect';
import StreetSelect from '@/components/ui/StreetSelect';
import { Button } from '@/components/ui/Button';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Step1Data {
  firstName: string;
  lastName: string;
  bio: string;
  languages: string[];
  gender: 'male' | 'female' | null;
  photo: string;
}

interface Step2Data {
  city: string;
  cityCode: number;
  street: string;
  buildingNumber: string;
  specialisations: Specialisation[];
  specialisationsOther: string[];
  sessionTypes: SessionType[];
  sessionTypesOther: string[];
}

interface MohVerifiedData {
  fullName: string;
  licenseNumber: string;
  city: string;
  status: string;
  statusDetail: string;
  issueDate: string;
}

interface Step3Data {
  phone: string;
  email: string;
  feeMin: string;
  feeMax: string;
  insuranceAccepted: InsuranceType[];
  mohNumber: string;
  mohVerified: boolean;
  mohVerifiedData: MohVerifiedData | null;
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
      className={`rounded-full border px-3.5 py-1.5 text-sm font-normal transition-colors ${
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
  return <label className="text-sm font-normal text-text-primary">{children}</label>;
}

function OtherTagInput({
  tags, onAdd, onRemove, placeholder,
}: {
  tags: string[];
  onAdd: (v: string) => void;
  onRemove: (v: string) => void;
  placeholder?: string;
}) {
  const [input, setInput] = useState('');

  function add() {
    const val = input.trim();
    if (val && !tags.includes(val)) {
      onAdd(val);
    }
    setInput('');
  }

  return (
    <div className="flex flex-col gap-2">
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="flex items-center gap-1.5 rounded-full border border-primary bg-primary/10 px-3 py-1 text-sm font-normal text-primary"
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
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
          placeholder={placeholder}
          dir="auto"
          className="form-field flex-1"
        />
        <button
          type="button"
          onClick={add}
          disabled={!input.trim()}
          className="rounded-lg border border-primary px-3.5 py-2 text-sm font-normal text-primary transition-colors hover:bg-primary hover:text-white disabled:opacity-40"
        >
          +
        </button>
      </div>
    </div>
  );
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
      className="form-field w-full"
    />
  );
}

// ─── Progress bar ──────────────────────────────────────────────────────────

function ProgressBar({ currentStep, totalSteps, stepTitle }: { currentStep: number; totalSteps: number; stepTitle: string }) {
  const t = useTranslations('onboarding.therapist');
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between text-sm">
        <span className="font-normal text-text-primary">{stepTitle}</span>
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
      <div className="flex flex-col gap-1.5">
        <FieldLabel>
          {t('bio')} <span className="font-normal text-text-muted">({t('optional')})</span>
        </FieldLabel>
        <textarea
          id="bio"
          value={data.bio}
          onChange={(e) => onChange({ bio: e.target.value })}
          placeholder={t('bioPlaceholder')}
          dir="rtl"
          rows={4}
          maxLength={800}
          className="form-field w-full resize-none"
        />
        <p className="text-xs text-text-muted">{data.bio.length}/800</p>
      </div>

      <div className="flex flex-col gap-2">
        <FieldLabel>{t('gender')}</FieldLabel>
        <div className="flex flex-wrap gap-2">
          {([['male', t('genderMale')], ['female', t('genderFemale')], [null, t('genderUnspecified')]] as [('male' | 'female' | null), string][]).map(([val, label]) => (
            <button
              key={String(val)}
              type="button"
              onClick={() => onChange({ gender: val })}
              className={`rounded-full border px-3.5 py-1.5 text-sm font-normal transition-colors ${
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
        <FieldLabel>{t('city')}</FieldLabel>
        <CitySelect
          value={data.city}
          onChange={(name, code) => onChange({ city: name, cityCode: code, street: '', buildingNumber: '' })}
          required
        />
      </div>

      {data.city && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <FieldLabel>{t('address')} <span className="font-normal text-text-muted">({t('optional')})</span></FieldLabel>
            <StreetSelect
              cityCode={data.cityCode}
              value={data.street}
              onChange={(v) => onChange({ street: v })}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <FieldLabel>מספר בית <span className="font-normal text-text-muted">({t('optional')})</span></FieldLabel>
            <TextInput
              id="buildingNumber"
              value={data.buildingNumber}
              onChange={(v) => onChange({ buildingNumber: v })}
              dir="ltr"
              placeholder="12"
            />
          </div>
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
        <OtherTagInput
          tags={data.specialisationsOther}
          onAdd={(v) => onChange({ specialisationsOther: [...data.specialisationsOther, v] })}
          onRemove={(v) => onChange({ specialisationsOther: data.specialisationsOther.filter((t) => t !== v) })}
          placeholder={t('otherPlaceholder')}
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
        <OtherTagInput
          tags={data.sessionTypesOther}
          onAdd={(v) => onChange({ sessionTypesOther: [...data.sessionTypesOther, v] })}
          onRemove={(v) => onChange({ sessionTypesOther: data.sessionTypesOther.filter((t) => t !== v) })}
          placeholder={t('otherPlaceholder')}
        />
      </div>
    </div>
  );
}

// ─── Step 3: Contact + fees ─────────────────────────────────────────────────

const PHONE_PREFIXES = ['050','051','052','053','054','055','056','057','058','059'];

function Step3({
  data, onChange,
}: { data: Step3Data; onChange: (d: Partial<Step3Data>) => void }) {
  const t = useTranslations('onboarding.therapist');
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState('');

  const MOH_FORMAT = /^\d{2}-\d{6}$|^\d{5,6}$/;

  async function handleVerify() {
    setVerifyError('');
    if (!MOH_FORMAT.test(data.mohNumber.trim())) {
      setVerifyError(t('mohInvalidFormat'));
      return;
    }
    setVerifying(true);
    try {
      const res = await fetch('/api/onboarding/verify-license', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mohNumber: data.mohNumber.trim() }),
      });
      if (res.status === 404) {
        setVerifyError(t('mohNotFound'));
        onChange({ mohVerified: false, mohVerifiedData: null });
        return;
      }
      if (!res.ok) {
        setVerifyError(t('saveError'));
        onChange({ mohVerified: false, mohVerifiedData: null });
        return;
      }
      const result = await res.json() as MohVerifiedData;
      onChange({ mohVerifiedData: result, mohVerified: false });
    } catch {
      setVerifyError(t('saveError'));
    } finally {
      setVerifying(false);
    }
  }

  // Derive prefix/suffix from data.phone; default prefix 050
  const prefix = data.phone.length >= 3 && PHONE_PREFIXES.includes(data.phone.slice(0, 3))
    ? data.phone.slice(0, 3) : '050';
  const suffix = data.phone.length >= 3 ? data.phone.slice(3) : data.phone;

  function setPrefix(p: string) { onChange({ phone: p + suffix }); }
  function setSuffix(s: string) { onChange({ phone: prefix + s.replace(/\D/g, '').slice(0, 7) }); }

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <FieldLabel>{t('phone')}</FieldLabel>
          <div className="flex gap-2" dir="ltr">
            <select
              value={prefix}
              onChange={(e) => setPrefix(e.target.value)}
              className="form-field w-24"
            >
              {PHONE_PREFIXES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <input
              id="phone"
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              value={suffix}
              onChange={(e) => setSuffix(e.target.value)}
              placeholder="1234567"
              maxLength={7}
              dir="ltr"
              required
              className="form-field flex-1"
            />
          </div>
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
            className="form-field"
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
            className="form-field"
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
            className="form-field"
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
        <div className="flex gap-2">
          <div className="flex-1">
            <TextInput
              id="mohNumber"
              value={data.mohNumber}
              onChange={(v) => {
                onChange({ mohNumber: v.replace(/[^\d-]/g, ''), mohVerified: false, mohVerifiedData: null });
                setVerifyError('');
              }}
              dir="ltr"
              required
              inputMode="text"
              maxLength={9}
            />
          </div>
          <Button
            type="button"
            onClick={() => void handleVerify()}
            disabled={verifying || !data.mohNumber.trim()}
            className="shrink-0"
          >
            {verifying ? t('mohVerifying') : t('mohVerify')}
          </Button>
        </div>
        <p className="text-xs text-text-muted">{t('mohNumberHint')}</p>

        {verifyError && (
          <p className="text-xs text-red-600">{verifyError}</p>
        )}

        {data.mohVerifiedData && !verifyError && (
          <div id="mohVerify" className="mt-2 overflow-hidden rounded-xl border border-green-200 bg-green-50">
            {/* Header */}
            <div className="flex items-center gap-2 border-b border-green-200 bg-green-100/70 px-4 py-2.5" dir="rtl">
              <svg className="h-4 w-4 shrink-0 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-normal text-green-800">{t('mohVerifyFound')}</span>
            </div>

            {/* Details */}
            <div className="divide-y divide-green-100 px-4" dir="rtl">
              {(
                [
                  { label: t('mohVerifyName'),    value: data.mohVerifiedData.fullName,       ltr: false },
                  { label: t('mohVerifyLicense'), value: data.mohVerifiedData.licenseNumber,  ltr: true  },
                  { label: t('mohVerifyCity'),    value: data.mohVerifiedData.city || '—',    ltr: false },
                ] as { label: string; value: string; ltr: boolean }[]
              ).map(({ label, value, ltr }) => (
                <div key={label} className="flex items-center justify-between py-2.5 text-sm">
                  <span className="text-text-muted">{label}</span>
                  <span className="font-normal text-text-primary" dir={ltr ? 'ltr' : undefined}>{value}</span>
                </div>
              ))}
              <div className="flex items-center justify-between py-2.5 text-sm">
                <span className="text-text-muted">{t('mohVerifyStatus')}</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-green-200 px-2.5 py-0.5 text-xs font-normal text-green-800">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-600" />
                  {data.mohVerifiedData.status}
                </span>
              </div>
            </div>

            {/* Confirm */}
            <label className="flex cursor-pointer items-start gap-3 border-t border-green-200 bg-white/60 px-4 py-3" dir="rtl">
              <input
                type="checkbox"
                checked={data.mohVerified}
                onChange={(e) => onChange({ mohVerified: e.target.checked })}
                className="form-checkbox mt-0.5 shrink-0"
              />
              <span className="text-sm font-normal leading-snug text-green-900">
                {t('mohVerifyConfirm')}
              </span>
            </label>
          </div>
        )}
      </div>

      <label className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={data.acceptingPatients}
          onChange={(e) => onChange({ acceptingPatients: e.target.checked })}
          className="form-checkbox"
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
  const locale = useLocale();
  const { update: updateSession } = useSession();

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [step1, setStep1] = useState<Step1Data>({
    firstName: '',
    lastName: '',
    bio: '',
    languages: ['he'],
    gender: null,
    photo: '',
  });
  const [step2, setStep2] = useState<Step2Data>({
    city: '',
    cityCode: 0,
    street: '',
    buildingNumber: '',
    specialisations: [],
    specialisationsOther: [],
    sessionTypes: [],
    sessionTypesOther: [],
  });
  const [step3, setStep3] = useState<Step3Data>({
    phone: '',
    email: '',
    feeMin: '',
    feeMax: '',
    insuranceAccepted: [],
    mohNumber: '',
    mohVerified: false,
    mohVerifiedData: null,
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
      if (step3.phone.replace(/\D/g, '').length < 10) return 'phone';
      if (!step3.mohNumber.trim()) return 'mohNumber';
      if (!/^\d{2}-\d{6}$|^\d{5,6}$/.test(step3.mohNumber.trim())) return 'mohNumber';
      if (!step3.mohVerified) return 'mohVerify';
    }
    return null;
  }

  function showValidationError(field: string) {
    let msg: string;
    if (field === 'mohNumber') {
      msg = t('mohInvalidFormat');
    } else if (field === 'mohVerify') {
      msg = t('mohVerifyRequired');
    } else if (field === 'phone') {
      msg = t('phoneInvalid');
    } else {
      msg = t('requiredFields');
    }
    setError(msg);
    const el = document.getElementById(field);
    el?.focus();
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function handleNext() {
    const missing = validateCurrent();
    if (missing) {
      showValidationError(missing);
      return;
    }
    setError('');
    setStep((s) => s + 1);
  }

  async function handleFinish() {
    const missing = validateCurrent();
    if (missing) {
      showValidationError(missing);
      return;
    }
    setError('');

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
      bio: {
        he: step1.bio.trim(),
        en: '',
        ar: '',
      },
      languages: step1.languages,
      location: {
        type: 'Point',
        coordinates: [34.7818, 32.0853],
        city: step2.city,
        address: addressParts,
        country: 'IL',
      },
      specialisations: step2.specialisations,
      specialisationsOther: step2.specialisationsOther.length ? step2.specialisationsOther : undefined,
      sessionTypes: step2.sessionTypes,
      sessionTypesOther: step2.sessionTypesOther.length ? step2.sessionTypesOther : undefined,
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
          toast.error(t('mohNotFound'));
        } else if (errMsg.toLowerCase().includes('status') || errMsg.toLowerCase().includes('licence status')) {
          toast.error(t('mohExpired'));
        } else {
          toast.error(t('saveError'));
        }
        setSaving(false);
        return;
      }

      const data = (await res.json()) as { role?: string; therapistProfileId?: string; photo?: string | null };

      // Await session update so JWT cookie is reissued before navigating.
      // Hard navigation ensures the middleware reads the updated token.
      await updateSession({ role: data.role, therapistProfileId: data.therapistProfileId, image: data.photo ?? null });
      window.location.href = `/${locale}/dashboard?milestone=onboarded`;
    } catch (err) {
      console.error('[handleFinish]', err);
      toast.error(t('saveError'));
      setSaving(false);
    }
  }

  const stepTitles = [t('step1Title'), t('step2Title'), t('step3Title')];

  return (
    <div className="mx-auto max-w-xl px-4 py-10 sm:px-6">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-normal text-text-primary">{t('title')}</h1>
        <p className="mt-1 text-sm text-text-secondary">{t('subtitle')}</p>
      </div>

      {/* Progress */}
      <div className="mb-8">
        <ProgressBar currentStep={step} totalSteps={TOTAL_STEPS} stepTitle={stepTitles[step - 1]} />
      </div>

      {/* Step content */}
      <div className="card p-6 sm:p-8">
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
            <Button
              type="button"
              variant="secondary"
              onClick={() => setStep((s) => s - 1)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="rtl:rotate-180"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>
              {t('back')}
            </Button>
          ) : (
            <div />
          )}

          {step < TOTAL_STEPS ? (
            <Button
              type="button"
              size="lg"
              onClick={handleNext}
            >
              {t('next')}
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="rtl:rotate-180"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            </Button>
          ) : (
            <Button
              type="button"
              size="lg"
              onClick={() => void handleFinish()}
              disabled={saving}
            >
              {saving ? '...' : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
                  {t('finish')}
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
