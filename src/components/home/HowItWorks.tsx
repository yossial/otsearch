import type { ReactNode } from 'react';
import { getTranslations } from 'next-intl/server';

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
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.18 2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.5a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
      </svg>
    ),
  },
];

export default async function HowItWorks() {
  const t = await getTranslations('home.howItWorks');

  return (
    /* Warm primary-light background — the HubSpot "salmon section" equivalent */
    <section id="how-it-works" className="bg-primary-light py-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="mb-14 text-center">
          <h2 className="text-2xl font-bold text-text-primary sm:text-3xl">
            {t('title')}
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {STEPS.map((step) => (
            <div
              key={step.number}
              className="group flex flex-col gap-5 rounded-2xl border border-primary/10 bg-surface p-8 shadow-sm transition-all duration-200 hover:border-primary/30 hover:shadow-[0_8px_32px_rgba(42,127,98,0.12)]"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-light text-primary transition-all duration-200 group-hover:bg-primary group-hover:text-white">
                  {step.icon}
                </div>
                <span className="select-none text-5xl font-extrabold tabular-nums leading-none text-primary/15">
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
          ))}
        </div>
      </div>
    </section>
  );
}
