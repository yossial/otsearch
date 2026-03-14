import { getTranslations } from 'next-intl/server';
import { FadeInUp } from '@/components/ui/motion';

export default async function StatsBar() {
  const t = await getTranslations('home.stats');

  const STATS = [
    { value: t('therapists'), label: t('therapistsLabel') },
    { value: t('cities'),     label: t('citiesLabel') },
    { value: t('specialisations'), label: t('specialisationsLabel') },
    { value: t('funds'),      label: t('fundsLabel') },
  ];

  return (
    <section className="relative overflow-hidden bg-bg-dark py-14">
      {/* Dot texture */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />
      {/* Ambient accent glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -start-10 top-1/2 h-[200px] w-[200px] -translate-y-1/2 rounded-full bg-accent opacity-[0.06] blur-[80px]"
      />

      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 sm:divide-x sm:divide-white/10 rtl:sm:divide-x-reverse">
          {STATS.map(({ value, label }, idx) => (
            <FadeInUp key={label} delay={idx * 0.07}>
              <div className="flex flex-col items-center gap-2 px-6 py-8 text-center">
                <span className="text-4xl font-extrabold tabular-nums text-accent sm:text-5xl">
                  {value}
                </span>
                <span className="text-xs font-normal uppercase tracking-widest text-white/50">
                  {label}
                </span>
              </div>
            </FadeInUp>
          ))}
        </div>
      </div>
    </section>
  );
}
