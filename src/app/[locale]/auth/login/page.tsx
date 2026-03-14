import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import LoginForm from '@/components/auth/LoginForm';

export async function generateMetadata() {
  const t = await getTranslations('auth.login');
  return { title: t('title') };
}

export default async function LoginPage() {
  const t = await getTranslations('auth');
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-8">

      {/* Back button */}
      <Link
        href="/"
        className="absolute start-4 top-4 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-text-secondary transition-colors hover:bg-bg-alt hover:text-text-primary"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="rtl:rotate-180">
          <path d="m15 18-6-6 6-6"/>
        </svg>
        {t('backHome')}
      </Link>

      {/* Card */}
      <div className="w-full max-w-sm">

        {/* Brand */}
        <div className="mb-6 text-center">
          <p className="mb-1 text-[11px] font-normal uppercase tracking-widest text-text-muted">Therapio</p>
          <h1 className="text-xl font-normal text-text-primary">{t('login.title')}</h1>
        </div>

        <div className="rounded-xl border border-border bg-surface p-6">
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
