'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useSession, signOut } from 'next-auth/react';
import { Link } from '@/i18n/navigation';

export default function Navbar() {
  const t = useTranslations('nav');
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user;
  const role = (session?.user as { role?: string } | undefined)?.role;
  const isOT = role === 'ot';

  const close = () => setMobileOpen(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-surface shadow-[0_1px_4px_rgba(91,63,212,0.06)]">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold text-primary tracking-tight">Therapio</span>
        </Link>

        {/* Desktop auth */}
        <div className="hidden md:flex items-center gap-3">
          {isLoggedIn ? (
            <>
              {isOT && (
                <Link
                  href="/dashboard/edit"
                  className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-primary transition-colors hover:border-primary hover:text-primary"
                >
                  {t('editProfile')}
                </Link>
              )}
              <Link
                href="/dashboard"
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-primary transition-colors hover:border-primary hover:text-primary"
              >
                {t('dashboard')}
              </Link>
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: '/' })}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
              >
                {t('logout')}
              </button>
            </>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-primary transition-colors hover:border-primary hover:text-primary"
              >
                {t('login')}
              </Link>
              <Link
                href="/auth/register"
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
              >
                {t('register')}
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          onClick={() => setMobileOpen((prev) => !prev)}
          className="flex md:hidden items-center justify-center rounded-lg p-2 text-text-secondary hover:bg-bg-alt hover:text-primary transition-colors"
          aria-label="Toggle menu"
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-border bg-surface px-4 pb-4 md:hidden">
          <div className="mt-3 flex flex-col gap-2">
            {isLoggedIn ? (
              <>
                {isOT && (
                  <Link
                    href="/dashboard/edit"
                    onClick={close}
                    className="rounded-lg border border-border px-4 py-2 text-center text-sm font-medium text-text-primary transition-colors hover:border-primary hover:text-primary"
                  >
                    {t('editProfile')}
                  </Link>
                )}
                <Link
                  href="/dashboard"
                  onClick={close}
                  className="rounded-lg border border-border px-4 py-2 text-center text-sm font-medium text-text-primary transition-colors hover:border-primary hover:text-primary"
                >
                  {t('dashboard')}
                </Link>
                <button
                  type="button"
                  onClick={() => { close(); signOut({ callbackUrl: '/' }); }}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
                >
                  {t('logout')}
                </button>
              </>
            ) : (
              <>
                <Link href="/auth/login" onClick={close} className="rounded-lg border border-border px-4 py-2 text-center text-sm font-medium text-text-primary transition-colors hover:border-primary hover:text-primary">
                  {t('login')}
                </Link>
                <Link href="/auth/register" onClick={close} className="rounded-lg bg-primary px-4 py-2 text-center text-sm font-semibold text-white transition-colors hover:bg-primary-dark">
                  {t('register')}
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
