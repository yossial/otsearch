'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

const SPECIALTIES = [
  { value: 'paediatrics', labelKey: 'paediatrics' },
  { value: 'neuro', labelKey: 'neuro' },
  { value: 'mentalHealth', labelKey: 'mentalHealth' },
  { value: 'handTherapy', labelKey: 'handTherapy' },
  { value: 'geriatrics', labelKey: 'geriatrics' },
  { value: 'sensoryProcessing', labelKey: 'sensoryProcessing' },
] as const;

const SPECIALTY_LABELS: Record<string, string> = {
  paediatrics: 'ילדים ופיתוח',
  neuro: 'שיקום נוירולוגי',
  mentalHealth: 'בריאות הנפש',
  handTherapy: 'טיפול ביד',
  geriatrics: 'גריאטריה',
  sensoryProcessing: 'עיבוד חושי',
};

const INSURANCE_OPTIONS = [
  { value: 'clalit', label: 'כללית' },
  { value: 'maccabi', label: 'מכבי' },
  { value: 'meuhedet', label: 'מאוחדת' },
  { value: 'leumit', label: 'לאומית' },
  { value: 'private', label: 'פרטי בלבד' },
];

const SESSION_TYPE_OPTIONS = [
  { value: 'inPerson', label: 'פרונטלי' },
  { value: 'telehealth', label: 'טלה-מדיסין' },
  { value: 'homeVisit', label: 'ביקור בית' },
];

const LANGUAGE_OPTIONS = [
  { value: 'he', label: 'עברית' },
  { value: 'ar', label: 'ערבית' },
  { value: 'en', label: 'אנגלית' },
  { value: 'ru', label: 'רוסית' },
];

function FilterSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2.5">
      <h3 className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary">
        {title}
      </h3>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  );
}

function CheckboxItem({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className={cn(
          'h-4 w-4 cursor-pointer appearance-none rounded border-2 border-border transition-colors',
          'checked:border-primary checked:bg-primary',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1'
        )}
      />
      <span className="text-sm text-text-primary">{label}</span>
    </label>
  );
}

export default function FilterSidebar() {
  const tSearch = useTranslations('search');

  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [selectedInsurance, setSelectedInsurance] = useState<string[]>([]);
  const [selectedSessionTypes, setSelectedSessionTypes] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [acceptingOnly, setAcceptingOnly] = useState(false);

  function toggleItem(
    value: string,
    current: string[],
    setter: (v: string[]) => void
  ) {
    setter(
      current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value]
    );
  }

  function clearAll() {
    setSelectedSpecialties([]);
    setSelectedInsurance([]);
    setSelectedSessionTypes([]);
    setSelectedLanguages([]);
    setAcceptingOnly(false);
  }

  const hasFilters =
    selectedSpecialties.length > 0 ||
    selectedInsurance.length > 0 ||
    selectedSessionTypes.length > 0 ||
    selectedLanguages.length > 0 ||
    acceptingOnly;

  return (
    <aside className="md:sticky md:top-20 flex flex-col gap-5 rounded-lg border border-border bg-surface p-5 shadow-card md:w-72 md:flex-shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-text-primary">
          {tSearch('sortBy')}
        </h2>
        {hasFilters && (
          <button
            type="button"
            onClick={clearAll}
            className="text-xs font-medium text-primary hover:underline"
          >
            נקה הכל
          </button>
        )}
      </div>

      <div className="h-px bg-border" />

      {/* Specialisation */}
      <FilterSection title={tSearch('filters.specialisation')}>
        {SPECIALTIES.map((s) => (
          <CheckboxItem
            key={s.value}
            label={SPECIALTY_LABELS[s.value]}
            checked={selectedSpecialties.includes(s.value)}
            onChange={() =>
              toggleItem(s.value, selectedSpecialties, setSelectedSpecialties)
            }
          />
        ))}
      </FilterSection>

      <div className="h-px bg-border" />

      {/* Insurance */}
      <FilterSection title={tSearch('filters.insurance')}>
        {INSURANCE_OPTIONS.map((opt) => (
          <CheckboxItem
            key={opt.value}
            label={opt.label}
            checked={selectedInsurance.includes(opt.value)}
            onChange={() =>
              toggleItem(opt.value, selectedInsurance, setSelectedInsurance)
            }
          />
        ))}
      </FilterSection>

      <div className="h-px bg-border" />

      {/* Session type */}
      <FilterSection title={tSearch('filters.sessionType')}>
        {SESSION_TYPE_OPTIONS.map((opt) => (
          <CheckboxItem
            key={opt.value}
            label={opt.label}
            checked={selectedSessionTypes.includes(opt.value)}
            onChange={() =>
              toggleItem(
                opt.value,
                selectedSessionTypes,
                setSelectedSessionTypes
              )
            }
          />
        ))}
      </FilterSection>

      <div className="h-px bg-border" />

      {/* Language */}
      <FilterSection title={tSearch('filters.language')}>
        {LANGUAGE_OPTIONS.map((opt) => (
          <CheckboxItem
            key={opt.value}
            label={opt.label}
            checked={selectedLanguages.includes(opt.value)}
            onChange={() =>
              toggleItem(opt.value, selectedLanguages, setSelectedLanguages)
            }
          />
        ))}
      </FilterSection>

      <div className="h-px bg-border" />

      {/* Accepting patients toggle */}
      <label className="flex cursor-pointer items-center justify-between gap-3">
        <span className="text-sm font-medium text-text-primary">
          מקבל/ת מטופלים חדשים
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={acceptingOnly}
          onClick={() => setAcceptingOnly((prev) => !prev)}
          className={cn(
            'relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200',
            acceptingOnly ? 'bg-primary' : 'bg-border'
          )}
        >
          <span
            className={cn(
              'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200',
              acceptingOnly ? 'translate-x-4' : 'translate-x-0'
            )}
          />
        </button>
      </label>
    </aside>
  );
}
