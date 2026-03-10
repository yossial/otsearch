import type { ReactNode } from 'react';
import { getTranslations } from 'next-intl/server';
import { FadeInUp, StaggerList, StaggerItem } from '@/components/ui/motion';

type StepKey = 'step1Title' | 'step2Title' | 'step3Title';
type DescKey = 'step1Desc' | 'step2Desc' | 'step3Desc';

interface Step {
  number: string;
  titleKey: StepKey;
  descKey: DescKey;
  icon: ReactNode;
}

const STEPS: Step[] = [
  {
    number: '01',
    titleKey: 'step1Title',
    descKey: 'step1Desc',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
        <line x1="8" y1="9" x2="14" y2="9" />
        <line x1="9" y1="12" x2="13" y2="12" />
      </svg>
    ),
  },
  {
    number: '02',
    titleKey: 'step2Title',
    descKey: 'step2Desc',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="4" width="8" height="12" rx="2" />
        <rect x="13" y="4" width="8" height="12" rx="2" />
        <line x1="5" y1="7" x2="9" y2="7" />
        <line x1="15" y1="7" x2="19" y2="7" />
        <line x1="5" y1="10" x2="9" y2="10" />
        <line x1="15" y1="10" x2="19" y2="10" />
      </svg>
    ),
  },
  {
    number: '03',
    titleKey: 'step3Title',
    descKey: 'step3Desc',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.18 2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.5a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
      </svg>
    ),
  },
];

export default async function HowItWorks() {
  const t = await getTranslations('home.howItWorks');

  return (
    <section id="how-it-works" className="bg-primary-light py-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">

        {/* Section header */}
        <FadeInUp>
          <div className="mb-14 text-center">
            <div className="mb-4 inline-flex items-center gap-2.5 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5">
              <span
                className="h-1.5 w-1.5 rounded-full bg-primary"
                style={{ animation: 'pulse-dot 2s ease-in-out infinite' }}
                aria-hidden="true"
              />
              <span className="text-xs font-medium uppercase tracking-[0.15em] text-primary">
                {t('eyebrow')}
              </span>
            </div>
            <h2 className="font-display text-2xl font-normal text-text-primary sm:text-3xl">
              {t('title')}
            </h2>
          </div>
        </FadeInUp>

        {/* Steps grid with arrow connectors */}
        <StaggerList className="grid grid-cols-1 gap-5 sm:grid-cols-3 sm:items-start">
          {STEPS.map((step, idx) => (
            <StaggerItem key={step.number} className="relative">

              {/* Arrow connector between steps (desktop only) */}
              {idx < STEPS.length - 1 && (
                <div
                  className="absolute -end-2.5 top-10 z-10 hidden h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full bg-accent shadow-accent sm:flex rtl:rotate-180"
                  aria-hidden="true"
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-text-accent">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </div>
              )}

              <div className="group flex h-full flex-col gap-5 rounded-xl border border-primary/10 bg-surface p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-card-hover">
                <div className="flex items-start justify-between">
                  {/* Icon — navy gradient background */}
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-white shadow-[0_2px_8px_rgba(0,29,61,0.2)] transition-all duration-200 group-hover:shadow-[0_4px_12px_rgba(0,29,61,0.3)]">
                    {step.icon}
                  </div>
                  {/* Decorative step number */}
                  <span className="select-none text-5xl font-extrabold tabular-nums leading-none text-primary/10">
                    {step.number}
                  </span>
                </div>
                <div>
                  <h3 className="mb-2 text-base font-bold text-text-primary">
                    {t(step.titleKey)}
                  </h3>
                  <p className="text-sm leading-relaxed text-text-secondary">
                    {t(step.descKey)}
                  </p>
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerList>

      </div>
    </section>
  );
}
