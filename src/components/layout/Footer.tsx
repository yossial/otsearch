'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

export default function Footer() {
  const tCommon = useTranslations('common');
  const tNav = useTranslations('nav');

  return (
    <footer className="border-t border-border bg-bg-alt py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Main footer row */}
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          {/* Logo + tagline */}
          <div className="flex flex-col gap-1">
            <Link href="/" className="text-lg font-bold text-primary">
              {tCommon('appName')}
            </Link>
            <p className="text-sm text-text-muted">
              מציאת מרפאים בעיסוק פרטיים בישראל
            </p>
          </div>

          {/* Nav links */}
          <nav className="flex flex-wrap items-center gap-5">
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
              {tNav('search')}
            </Link>
            <Link
              href="/for-therapists"
              className="text-sm text-text-secondary transition-colors hover:text-primary"
            >
              For Therapists
            </Link>
            <Link
              href="/login"
              className="text-sm text-text-secondary transition-colors hover:text-primary"
            >
              {tNav('login')}
            </Link>
            <Link
              href="/register"
              className="text-sm text-text-secondary transition-colors hover:text-primary"
            >
              {tNav('register')}
            </Link>
          </nav>

          {/* Locale switcher */}
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
        </div>

        {/* Bottom row */}
        <div className="mt-6 border-t border-border pt-4">
          <p className="text-center text-xs text-text-muted">
            &copy; 2025 Therapio. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
