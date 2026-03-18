'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

export default function Footer() {
  const tCommon = useTranslations('common');
  const tNav = useTranslations('nav');
  const tFooter = useTranslations('footer');

  return (
    <footer
      className="relative overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at 20% 60%, #1b0f93 0%, #0d0b50 45%, #06041e 100%)' }}
    >
      {/* Subtle dot-pattern texture overlay */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">

        {/* Multi-column grid */}
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">

          {/* Col 1 — Brand */}
          <div className="flex flex-col gap-4">
            <Link href="/" className="group flex items-center gap-2">
              <span
                className="h-2 w-2 rounded-full bg-yellow-300 transition-transform duration-200 group-hover:scale-125"
                aria-hidden="true"
              />
              <span className="text-xl font-extrabold tracking-tight text-white">
                {tCommon('appName')}
              </span>
            </Link>
            <p className="max-w-[200px] text-sm leading-relaxed text-white/75">
              {tCommon('tagline')}
            </p>
          </div>

          {/* Col 2 — For Patients */}
          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-normal uppercase tracking-widest text-white/60">
              {tFooter('forPatients')}
            </h3>
            <nav className="flex flex-col gap-2">
              <Link href="/" className="text-sm text-white/80 transition-colors hover:text-white">
                {tNav('home')}
              </Link>
              <Link href="/search" className="text-sm text-white/80 transition-colors hover:text-white">
                {tFooter('searchTherapists')}
              </Link>
              <Link href="/#contact" className="text-sm text-white/80 transition-colors hover:text-white">
                {tFooter('contact')}
              </Link>
            </nav>
          </div>

          {/* Col 3 — For Therapists */}
          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-normal uppercase tracking-widest text-white/60">
              {tFooter('forTherapists')}
            </h3>
            <nav className="flex flex-col gap-2">
              <Link href="/auth/register" className="text-sm text-white/80 transition-colors hover:text-white">
                {tFooter('joinAsTherapist')}
              </Link>
              <Link href="/auth/login" className="text-sm text-white/80 transition-colors hover:text-white">
                {tNav('login')}
              </Link>
              <Link href="/dashboard" className="text-sm text-white/80 transition-colors hover:text-white">
                {tNav('dashboard')}
              </Link>
            </nav>
          </div>

          {/* Col 4 — Legal */}
          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-normal uppercase tracking-widest text-white/60">
              {tFooter('company')}
            </h3>
            <nav className="flex flex-col gap-2">
              <Link href="/about" className="text-sm text-white/80 transition-colors hover:text-white">
                {tFooter('about')}
              </Link>
              <Link href="/privacy" className="text-sm text-white/80 transition-colors hover:text-white">
                {tFooter('privacy')}
              </Link>
              <Link href="/terms" className="text-sm text-white/80 transition-colors hover:text-white">
                {tFooter('terms')}
              </Link>
            </nav>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 sm:flex-row">
          {/* Language switcher */}
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-widest text-white/50">
              Lang
            </span>
            {(['he', 'en', 'ar', 'ru'] as const).map((loc, i, arr) => (
              <span key={loc} className="flex items-center gap-2">
                <Link
                  href="/"
                  locale={loc}
                  className="rounded px-2 py-1 text-xs font-normal text-white/75 transition-colors hover:bg-white/10 hover:text-white"
                >
                  {loc === 'he' ? 'עב' : loc === 'ar' ? 'عر' : loc === 'ru' ? 'РУ' : 'EN'}
                </Link>
                {i < arr.length - 1 && (
                  <span className="h-3 w-px bg-white/15" aria-hidden="true" />
                )}
              </span>
            ))}
          </div>

          <p className="text-xs text-white/60">{tFooter('copyright')}</p>
        </div>
      </div>
    </footer>
  );
}
