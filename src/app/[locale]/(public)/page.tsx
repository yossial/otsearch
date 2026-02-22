import { useTranslations } from 'next-intl';

export default function HomePage() {
  const t = useTranslations('home');

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-bg px-4">
      <div className="w-full max-w-3xl text-center">
        <h1 className="mb-4 text-4xl font-extrabold tracking-tight text-text-primary lg:text-5xl">
          {t('heroTitle')}
        </h1>
        <p className="mb-8 text-lg text-text-secondary">{t('heroSubtitle')}</p>
        <div className="flex w-full items-center gap-2 rounded-xl border border-border bg-surface px-4 py-3 shadow-[0_2px_8px_rgba(91,63,212,0.08)]">
          <input
            type="search"
            placeholder={t('searchPlaceholder')}
            className="flex-1 bg-transparent text-base text-text-primary outline-none placeholder:text-text-muted"
          />
          <button className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-dark">
            {t('searchButton')}
          </button>
        </div>
      </div>
    </main>
  );
}
