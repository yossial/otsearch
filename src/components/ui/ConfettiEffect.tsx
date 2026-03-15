'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import confetti from 'canvas-confetti';

type Milestone = 'onboarded' | 'first_patient';

export default function ConfettiEffect() {
  const t = useTranslations('dashboard.milestones');
  const router = useRouter();
  const pathname = usePathname();
  // Lazy init: read milestone from URL on first client render
  const [active, setActive] = useState<Milestone | null>(() => {
    if (typeof window === 'undefined') return null;
    return new URLSearchParams(window.location.search).get('milestone') as Milestone | null;
  });

  useEffect(() => {
    if (!active) return;

    const params = new URLSearchParams(window.location.search);

    // Fire confetti bursts
    void confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.55 },
      colors: ['#000080', '#FFD60A', '#ffffff', '#0000B6', '#FFD60A'],
    });
    setTimeout(() => {
      void confetti({
        particleCount: 60,
        spread: 130,
        origin: { y: 0.4 },
        colors: ['#000080', '#FFD60A', '#ffffff'],
      });
    }, 300);

    // Clean the milestone param from the URL
    setTimeout(() => {
      params.delete('milestone');
      const clean = params.size > 0 ? `${pathname}?${params.toString()}` : pathname;
      router.replace(clean, { scroll: false });
    }, 150);

    // Auto-dismiss toast
    const dismiss = setTimeout(() => setActive(null), 4500);
    return () => clearTimeout(dismiss);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!active) return null;

  const messages: Record<Milestone, { title: string; sub: string }> = {
    onboarded: { title: t('onboarded'), sub: t('onboardedSub') },
    first_patient: { title: t('firstPatient'), sub: t('firstPatientSub') },
  };

  const msg = messages[active];

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-4 top-20 z-50 mx-auto max-w-sm rounded-xl border border-primary/20 bg-bg px-5 py-4 shadow-lg"
    >
      <div className="flex items-start gap-3">
        <span className="text-xl" aria-hidden="true">
          🎉
        </span>
        <div>
          <p className="font-normal text-text-primary">{msg.title}</p>
          <p className="mt-0.5 text-sm text-text-muted">{msg.sub}</p>
        </div>
        <button
          onClick={() => setActive(null)}
          className="ms-auto shrink-0 text-text-muted transition-colors hover:text-text-primary"
          aria-label="Dismiss"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>
  );
}
