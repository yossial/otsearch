'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

export default function Footer() {
  const tCommon = useTranslations('common');
  const tNav = useTranslations('nav');
  const tFooter = useTranslations('footer');

  return (
    <footer className="border-t border-border bg-bg-alt">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Multi-column grid */}
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Col 1 — Brand */}
          <div className="flex flex-col gap-3">
            <Link href="/" className="text-xl font-bold text-primary">
              {tCommon('appName')}
            </Link>
            <p className="max-w-[200px] text-sm leading-relaxed text-text-muted">
              {tCommon('tagline')}
            </p>
          </div>

          {/* Col 2 — For Patients */}
          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              {tFooter('forPatients')}
            </h3>
            <nav className="flex flex-col gap-2">
              <Link
                href="/"
                className="text-sm text-text-secondary transition-colors hover:text-primary"
              >
                {tNav('home')}
              </Link>
              <Link
                href="/search"
                className="text-sm text-text-secondary transition-colors hover:text-primary"
              >
                {tFooter('searchTherapists')}
              </Link>
              <Link
                href="/#contact"
                className="text-sm text-text-secondary transition-colors hover:text-primary"
              >
                {tFooter('contact')}
              </Link>
            </nav>
          </div>

          {/* Col 3 — For Therapists */}
          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              {tFooter('forTherapists')}
            </h3>
            <nav className="flex flex-col gap-2">
              <Link
                href="/auth/register"
                className="text-sm text-text-secondary transition-colors hover:text-primary"
              >
                {tFooter('joinAsTherapist')}
              </Link>
              <Link
                href="/auth/login"
                className="text-sm text-text-secondary transition-colors hover:text-primary"
              >
                {tNav('login')}
              </Link>
              <Link
                href="/dashboard"
                className="text-sm text-text-secondary transition-colors hover:text-primary"
              >
                {tNav('dashboard')}
              </Link>
            </nav>
          </div>

          {/* Col 4 — Legal */}
          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              {tFooter('company')}
            </h3>
            <nav className="flex flex-col gap-2">
              <Link
                href="/about"
                className="text-sm text-text-secondary transition-colors hover:text-primary"
              >
                {tFooter('about')}
              </Link>
              <Link
                href="/privacy"
                className="text-sm text-text-secondary transition-colors hover:text-primary"
              >
                {tFooter('privacy')}
              </Link>
              <Link
                href="/terms"
                className="text-sm text-text-secondary transition-colors hover:text-primary"
              >
                {tFooter('terms')}
              </Link>
            </nav>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 sm:flex-row">
          {/* Language switcher */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium uppercase tracking-wide text-text-muted">
              Lang
            </span>
            <Link
              href="/"
              locale="he"
              className="rounded px-2 py-1 text-xs font-medium text-text-secondary transition-colors hover:bg-primary-light hover:text-primary"
            >
              עב
            </Link>
            <Link
              href="/"
              locale="en"
              className="rounded px-2 py-1 text-xs font-medium text-text-secondary transition-colors hover:bg-primary-light hover:text-primary"
            >
              EN
            </Link>
            <Link
              href="/"
              locale="ar"
              className="rounded px-2 py-1 text-xs font-medium text-text-secondary transition-colors hover:bg-primary-light hover:text-primary"
            >
              عر
            </Link>
          </div>

          <p className="text-xs text-text-muted">{tFooter('copyright')}</p>
        </div>
      </div>
    </footer>
  );
}
