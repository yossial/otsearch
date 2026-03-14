import type { ReactNode } from 'react';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';

type ChipKey = 'paediatrics' | 'neuro' | 'mentalHealth' | 'handTherapy';

interface QuickFilterChipsProps {
  variant?: 'light' | 'dark';
}

const CHIP_SPECS: ReadonlyArray<{ key: ChipKey; spec: string }> = [
  { key: 'paediatrics', spec: 'paediatrics' },
  { key: 'neuro', spec: 'neurological' },
  { key: 'mentalHealth', spec: 'mental-health' },
  { key: 'handTherapy', spec: 'hand-therapy' },
];

const ICONS: Record<ChipKey, ReactNode> = {
  paediatrics: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="7" r="3" />
      <path d="M5.5 20v-1a6.5 6.5 0 0 1 13 0v1" />
      <path d="M19 2.5l.5 1.5 1.5.5-1.5.5-.5 1.5-.5-1.5-1.5-.5 1.5-.5z" />
    </svg>
  ),
  neuro: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 5.5C9 5.5 6.5 7.7 6.5 10.5c0 1.1.4 2.1 1.1 2.9A3.8 3.8 0 0 0 6 17a3.2 3.2 0 0 0 2.8 3" />
      <path d="M12 5.5c3 0 5.5 2.2 5.5 5c0 1.1-.4 2.1-1.1 2.9A3.8 3.8 0 0 1 18 17a3.2 3.2 0 0 1-2.8 3" />
      <line x1="12" y1="5.5" x2="12" y2="20" />
      <path d="M9.5 20v1.5a1 1 0 0 0 2 0V20" />
      <path d="M14.5 20v1a1 1 0 0 0 2 0v-1" />
    </svg>
  ),
  mentalHealth: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="11" r="6" />
      <circle cx="10" cy="9.5" r="0.6" fill="currentColor" stroke="none" />
      <circle cx="14" cy="9.5" r="0.6" fill="currentColor" stroke="none" />
      <path d="M9.5 13c.7.8 1.5 1.2 2.5 1.2s1.8-.4 2.5-1.2" />
      <line x1="12" y1="17" x2="12" y2="20" />
      <line x1="9" y1="20" x2="15" y2="20" />
    </svg>
  ),
  handTherapy: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 11V6a2 2 0 0 0-4 0" />
      <path d="M14 10V4a2 2 0 0 0-4 0v2" />
      <path d="M10 10.5V6a2 2 0 0 0-4 0v8" />
      <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
    </svg>
  ),
};

export default async function QuickFilterChips({ variant = 'light' }: QuickFilterChipsProps) {
  const t = await getTranslations('home');

  const isDark = variant === 'dark';

  const cardBase = isDark
    ? 'border-white/15 bg-white/8 backdrop-blur-sm hover:border-white/30 hover:bg-white/14'
    : 'border-border bg-surface shadow-sm hover:border-primary/40 hover:shadow-primary';

  const iconBase = isDark
    ? 'bg-white/15 text-white group-hover:bg-white/25'
    : 'bg-primary-light text-primary group-hover:bg-primary group-hover:text-white';

  const labelClass = isDark
    ? 'text-white group-hover:text-white'
    : 'text-text-primary group-hover:text-primary';

  const taglineClass = isDark ? 'text-white/50' : 'text-text-muted';

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
      {CHIP_SPECS.map(({ key, spec }) => (
        <Link
          key={key}
          href={`/?specialisation=${spec}`}
          className={`group flex flex-col gap-4 rounded-xl border p-5 transition-all duration-200 ${cardBase}`}
        >
          <div className={`flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-200 ${iconBase}`}>
            {ICONS[key]}
          </div>
          <div>
            <p className={`text-sm font-normal transition-colors duration-150 ${labelClass}`}>
              {t(`quickFilters.${key}`)}
            </p>
            <p className={`mt-1 text-xs leading-snug ${taglineClass}`}>
              {t(`quickFilters.${key}Tagline`)}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}
