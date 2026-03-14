import type { ReactNode } from 'react';
import { getTranslations } from 'next-intl/server';
import { FadeInUp } from '@/components/ui/motion';

interface Step {
  titleKey: 'step1Title' | 'step2Title' | 'step3Title';
  descKey:  'step1Desc'  | 'step2Desc'  | 'step3Desc';
  icon: ReactNode;
}

const STEPS: Step[] = [
  {
    titleKey: 'step1Title',
    descKey:  'step1Desc',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
      </svg>
    ),
  },
  {
    titleKey: 'step2Title',
    descKey:  'step2Desc',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
  {
    titleKey: 'step3Title',
    descKey:  'step3Desc',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.18 2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.5a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
      </svg>
    ),
  },
];

export default async function HowItWorks() {
  const t = await getTranslations('home.howItWorks');

  return (
    <section id="how-it-works" className="bg-surface py-20">
      <div className="mx-auto max-w-xl px-4 sm:px-6 lg:px-8">

        {/* Section header */}
        <FadeInUp>
          <div className="mb-14 text-center">
            <div className="mb-4 inline-flex items-center gap-2.5 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5">
              <span
                className="h-1.5 w-1.5 rounded-full bg-accent"
                style={{ animation: 'pulse-dot 2s ease-in-out infinite' }}
                aria-hidden="true"
              />
              <span className="section-eyebrow text-primary">{t('eyebrow')}</span>
            </div>
            <h2 className="font-display text-2xl font-normal text-text-primary sm:text-3xl">
              {t('title')}
            </h2>
          </div>
        </FadeInUp>

        {/* ── Timeline + cards ──────────────────────────────────────── */}
        <ol className="relative flex flex-col gap-4">

          {/* Spine */}
          <div
            className="pointer-events-none absolute start-[23px] top-6 w-px overflow-hidden bg-primary/10"
            style={{ height: 'calc(100% - 3.5rem)' }}
            aria-hidden="true"
          >
            <div
              className="absolute inset-x-0 h-28"
              style={{
                background: 'linear-gradient(to bottom, transparent, var(--color-primary-glow-lg) 45%, transparent)',
                animation: 'spine-glow 3s ease-in-out infinite',
              }}
            />
          </div>

          {STEPS.map((step, idx) => (
            <FadeInUp key={step.titleKey} delay={idx * 0.12}>
              <li className="group flex items-start gap-5">

                {/* Node */}
                <div className="relative z-10 flex-shrink-0 pt-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-primary/25 bg-surface text-primary shadow-sm transition-all duration-300 group-hover:border-primary group-hover:bg-primary group-hover:text-white group-hover:shadow-[0_0_0_5px_var(--color-primary-glow-sm)]">
                    {step.icon}
                  </div>
                  <span className="absolute -end-1 -top-0 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-normal text-white">
                    {idx + 1}
                  </span>
                </div>

                {/* Card */}
                <div className="flex-1 rounded-xl border border-border bg-bg p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-card-hover">
                  <h3 className="text-base font-normal text-text-primary">{t(step.titleKey)}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-text-secondary">{t(step.descKey)}</p>
                </div>

              </li>
            </FadeInUp>
          ))}
        </ol>

      </div>
    </section>
  );
}
