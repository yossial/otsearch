import { getTranslations } from 'next-intl/server';

export default async function StatsBar() {
  const t = await getTranslations('home.stats');

  const STATS = [
    { value: t('therapists'), label: t('therapistsLabel') },
    { value: t('cities'), label: t('citiesLabel') },
    { value: t('specialisations'), label: t('specialisationsLabel') },
    { value: t('funds'), label: t('fundsLabel') },
  ];

  return (
    <section className="border-y border-border bg-surface">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 divide-x divide-y divide-border rtl:divide-x-reverse sm:grid-cols-4 sm:divide-y-0">
          {STATS.map(({ value, label }) => (
            <div key={label} className="flex flex-col items-center gap-1.5 px-6 py-9 text-center">
              <span className="text-4xl font-extrabold tabular-nums text-primary sm:text-5xl">
                {value}
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
