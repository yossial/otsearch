'use client';

import { useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import type { Specialisation, SessionType } from '@/types';

// ─── Constants (reuse same lists as OT wizard but for filtering) ──────────────

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

// ─── Sub-components ────────────────────────────────────────────────────────────

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

type Who = 'self' | 'child' | 'family';

// ─── Main form ─────────────────────────────────────────────────────────────────

export default function PatientOnboardingForm() {
  const t = useTranslations('onboarding.patient');
  const tSearch = useTranslations('search');
  const router = useRouter();

  const [who, setWho] = useState<Who | null>(null);
  const [specialisations, setSpecialisations] = useState<Specialisation[]>([]);
  const [city, setCity] = useState('');
  const [sessionType, setSessionType] = useState<SessionType | null>(null);

  function toggleSpecialisation(sp: Specialisation) {
    setSpecialisations((prev) =>
      prev.includes(sp) ? prev.filter((s) => s !== sp) : [...prev, sp]
    );
  }

  function buildSearchUrl() {
    const params = new URLSearchParams();
    specialisations.forEach((sp) => params.append('specialisation', sp));
    if (city.trim()) params.set('city', city.trim());
    if (sessionType) params.set('sessionType', sessionType);
    const qs = params.toString();
    return qs ? `/?${qs}` : '/';
  }

  function handleSubmit() {
    router.push(buildSearchUrl());
    router.refresh();
  }

  function handleSkip() {
    router.push('/');
    router.refresh();
  }

  const whoOptions: Array<{ value: Who; label: string }> = [
    { value: 'self', label: t('whoSelf') },
    { value: 'child', label: t('whoChild') },
    { value: 'family', label: t('whoFamily') },
  ];

  return (
    <div className="mx-auto max-w-xl px-4 py-10 sm:px-6">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-text-primary">{t('title')}</h1>
        <p className="mt-1 text-sm text-text-secondary">{t('subtitle')}</p>
      </div>

      <div className="flex flex-col gap-7 rounded-2xl bg-surface p-6 shadow-card sm:p-8">

        {/* Who */}
        <div className="flex flex-col gap-3">
          <p className="text-sm font-semibold text-text-primary">{t('whoLabel')}</p>
          <div className="flex flex-wrap gap-2">
            {whoOptions.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setWho(value)}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                  who === value
                    ? 'border-primary bg-primary text-white'
                    : 'border-border bg-bg text-text-secondary hover:border-primary/50'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Specialisations */}
        <div className="flex flex-col gap-3">
          <p className="text-sm font-semibold text-text-primary">{t('specialisationsLabel')}</p>
          <div className="flex flex-wrap gap-2">
            {SPECIALISATIONS.map((sp) => (
              <ToggleChip
                key={sp}
                value={sp}
                label={SPECIALISATION_LABELS[sp]}
                selected={specialisations.includes(sp)}
                onToggle={toggleSpecialisation}
              />
            ))}
          </div>
        </div>

        {/* City */}
        <div className="flex flex-col gap-2">
          <label htmlFor="patient-city" className="text-sm font-semibold text-text-primary">
            {t('cityLabel')}
          </label>
          <input
            id="patient-city"
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder={t('cityPlaceholder')}
            dir="auto"
            className="rounded-lg border border-border bg-bg px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Session type */}
        <div className="flex flex-col gap-3">
          <p className="text-sm font-semibold text-text-primary">{t('sessionTypeLabel')}</p>
          <div className="flex flex-wrap gap-2">
            {/* "No preference" option */}
            <button
              type="button"
              onClick={() => setSessionType(null)}
              className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                sessionType === null
                  ? 'border-primary bg-primary text-white'
                  : 'border-border bg-bg text-text-secondary hover:border-primary/50'
              }`}
            >
              {t('sessionTypeAny')}
            </button>
            {SESSION_TYPES.map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setSessionType(st === sessionType ? null : st)}
                className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                  sessionType === st
                    ? 'border-primary bg-primary text-white'
                    : 'border-border bg-bg text-text-secondary hover:border-primary/50'
                }`}
              >
                {tSearch(`sessionTypes.${st === 'in-person' ? 'inPerson' : st === 'home-visit' ? 'homeVisit' : 'telehealth'}`)}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between gap-4 pt-2">
          <button
            type="button"
            onClick={handleSkip}
            className="text-sm text-text-muted underline-offset-2 hover:text-text-secondary hover:underline"
          >
            {t('skip')}
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
          >
            {t('findTherapists')}
          </button>
        </div>
      </div>
    </div>
  );
}
