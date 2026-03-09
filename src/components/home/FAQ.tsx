'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { FadeInUp } from '@/components/ui/motion';

const KEYS = ['1', '2', '3', '4', '5'] as const;

function FAQItem({
  q,
  a,
  isOpen,
  onToggle,
}: {
  q: string;
  a: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border-b border-border last:border-0">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between gap-4 py-5 text-start transition-colors hover:text-primary"
      >
        <span className="text-sm font-semibold text-text-primary">{q}</span>
        <span
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-all duration-200 ${
            isOpen
              ? 'rotate-45 border-primary bg-primary text-white'
              : 'border-border text-text-secondary'
          }`}
          aria-hidden="true"
        >
          <svg
            width="11"
            height="11"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </span>
      </button>

      {isOpen && (
        <p className="pb-5 text-sm leading-relaxed text-text-secondary">{a}</p>
      )}
    </div>
  );
}

export default function FAQ() {
  const t = useTranslations('home.faq');
  const [open, setOpen] = useState<string | null>('1');

  return (
    <section id="faq" className="bg-bg-alt py-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">

        {/* Section header */}
        <FadeInUp>
          <div className="mb-12 text-center">
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

        <FadeInUp delay={0.1}>
          <div className="rounded-2xl border border-border bg-surface px-7">
            {KEYS.map((key) => (
              <FAQItem
                key={key}
                q={t(`q${key}`)}
                a={t(`a${key}`)}
                isOpen={open === key}
                onToggle={() => setOpen(open === key ? null : key)}
              />
            ))}
          </div>
        </FadeInUp>

      </div>
    </section>
  );
}
