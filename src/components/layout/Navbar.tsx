'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useSession, signOut } from 'next-auth/react';
import { Link, usePathname } from '@/i18n/navigation';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import Image from 'next/image';

function getInitials(name?: string | null): string {
  if (!name) return '?';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

export default function Navbar() {
  const t = useTranslations('nav');
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: session } = useSession();
  const pathname = usePathname();
  const isOnboarding = pathname.includes('/onboarding');
  const isLoggedIn = !!session?.user;
  const role = (session?.user as { role?: string } | undefined)?.role;
  const isTherapist = role === 'therapist';
  const userName = session?.user?.name;
  const userImage = session?.user?.image;

  const close = () => setMobileOpen(false);

  return (
    <header className="border-b border-border bg-surface shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold text-primary tracking-tight">Therapio</span>
        </Link>

        {/* Desktop auth */}
        <div className="hidden md:flex items-center gap-3">
          {isLoggedIn ? (
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button
                  type="button"
                  className="flex h-10 w-10 items-center justify-center rounded-full overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  aria-label={userName ?? 'User menu'}
                >
                  {userImage ? (
                    <Image
                      src={userImage}
                      alt={userName ?? ''}
                      width={40}
                      height={40}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-text-inverse">
                      {getInitials(userName)}
                    </span>
                  )}
                </button>
              </DropdownMenu.Trigger>

              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  align="end"
                  sideOffset={8}
                  className="z-50 min-w-[180px] rounded-lg border border-border bg-surface p-1 shadow-dropdown animate-in fade-in-0 zoom-in-95"
                >
                  {!isOnboarding && (
                    <DropdownMenu.Item asChild>
                      <Link
                        href="/dashboard"
                        className="flex rounded px-3 py-2 text-sm text-text-primary outline-none hover:bg-bg-alt focus:bg-bg-alt"
                      >
                        {t('dashboard')}
                      </Link>
                    </DropdownMenu.Item>
                  )}
                  {!isOnboarding && isTherapist && (
                    <DropdownMenu.Item asChild>
                      <Link
                        href="/dashboard/edit"
                        className="flex rounded px-3 py-2 text-sm text-text-primary outline-none hover:bg-bg-alt focus:bg-bg-alt"
                      >
                        {t('editProfile')}
                      </Link>
                    </DropdownMenu.Item>
                  )}
                  <DropdownMenu.Separator className="my-1 h-px bg-border" />
                  <DropdownMenu.Item asChild>
                    <button
                      type="button"
                      onClick={() => signOut({ callbackUrl: '/' })}
                      className="flex w-full rounded px-3 py-2 text-sm text-text-primary outline-none hover:bg-bg-alt focus:bg-bg-alt"
                    >
                      {t('logout')}
                    </button>
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
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
                {!isOnboarding && (
                  <Link
                    href="/dashboard"
                    onClick={close}
                    className="rounded-lg border border-border px-4 py-2 text-center text-sm font-medium text-text-primary transition-colors hover:border-primary hover:text-primary"
                  >
                    {t('dashboard')}
                  </Link>
                )}
                {!isOnboarding && isTherapist && (
                  <Link
                    href="/dashboard/edit"
                    onClick={close}
                    className="rounded-lg border border-border px-4 py-2 text-center text-sm font-medium text-text-primary transition-colors hover:border-primary hover:text-primary"
                  >
                    {t('editProfile')}
                  </Link>
                )}
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
