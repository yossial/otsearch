'use client';

import { useTranslations } from 'next-intl';

export default function PrintInvoiceButton() {
  const t = useTranslations('dashboard.billing');
  return (
    <button
      onClick={() => window.print()}
      className="no-print inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-5 py-2.5 text-sm font-normal text-text-primary transition-all duration-200 hover:border-primary/30 hover:text-primary"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>
      </svg>
      {t('print')}
    </button>
  );
}
