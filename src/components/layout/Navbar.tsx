'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
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

// ── Icons ────────────────────────────────────────────────────────────────────
function IconDashboard() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="7" height="9" /><rect x="14" y="3" width="7" height="5" /><rect x="14" y="12" width="7" height="9" /><rect x="3" y="16" width="7" height="5" />
    </svg>
  );
}
function IconEdit() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}
function IconAdmin() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}
function IconLogout() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

export default function Navbar() {
  const t = useTranslations('nav');
  const locale = useLocale();
  const dir = (locale === 'he' || locale === 'ar') ? 'rtl' : 'ltr';
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { data: session } = useSession();
  const pathname = usePathname();
  const isOnboarding = pathname.includes('/onboarding');
  const isHomepage = pathname === '/';
  const isLoggedIn = !!session?.user;
  const role = (session?.user as { role?: string } | undefined)?.role;
  const isTherapist = role === 'therapist';
  const isAdmin = role === 'admin';
  const userName = session?.user?.name;
  const userEmail = session?.user?.email;
  const userImage = session?.user?.image;

  useEffect(() => {
    if (!isHomepage) return;
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [isHomepage]);

  const close = () => setMobileOpen(false);
  const transparent = isHomepage && !scrolled && !mobileOpen;

  const sectionLinks = [
    { href: '#search',        label: t('navSearch') },
    { href: '#how-it-works',  label: t('navHowItWorks') },
    { href: '#for-therapists', label: t('navForTherapists') },
    { href: '#contact',       label: t('navContact') },
  ];

  return (
    <header
      className={`fixed inset-s-0 inset-e-0 top-0 z-40 w-full border-b transition-all duration-300 ${
        transparent
          ? 'border-transparent bg-transparent'
          : 'border-border bg-surface/95 shadow-[0_1px_4px_rgba(0,0,0,0.06)] backdrop-blur-md'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

        {/* Logo */}
        <Link href="/" className="group flex shrink-0 items-center gap-2">
          {/* Accent dot */}
          <span
            className="h-2 w-2 rounded-full bg-accent shadow-accent transition-transform duration-200 group-hover:scale-125"
            aria-hidden="true"
          />
          <span className="text-xl font-extrabold tracking-tight text-primary">Therapio</span>
        </Link>

        {/* Landing page section links — desktop center */}
        {isHomepage && (
          <nav className="hidden items-center gap-0.5 md:flex" aria-label="Page sections">
            {sectionLinks.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="rounded-lg px-3 py-1.5 text-sm text-text-secondary transition-colors duration-150 hover:bg-primary-xlight hover:text-primary"
              >
                {item.label}
              </a>
            ))}
          </nav>
        )}

        {/* Desktop auth */}
        <div className="hidden items-center gap-3 md:flex">
          {isLoggedIn ? (
            <DropdownMenu.Root dir={dir}>
              <DropdownMenu.Trigger asChild>
                <button
                  type="button"
                  className="group flex items-center gap-1.5 rounded-full outline-none"
                  aria-label={userName ?? 'User menu'}
                >
                  {userImage ? (
                    <Image
                      src={userImage}
                      alt={userName ?? ''}
                      width={36}
                      height={36}
                      className="h-9 w-9 rounded-full object-cover ring-2 ring-transparent transition-all group-hover:ring-accent/40"
                    />
                  ) : (
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-sm font-bold text-text-inverse ring-2 ring-transparent transition-all group-hover:ring-accent/40">
                      {getInitials(userName)}
                    </span>
                  )}
                </button>
              </DropdownMenu.Trigger>

              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  align="end"
                  sideOffset={10}
                  className="z-50 min-w-55 rounded-xl border border-border bg-surface shadow-dropdown animate-in fade-in-0 zoom-in-95"
                >
                  {/* User info header */}
                  <div className="border-b border-border px-4 py-3">
                    <p className="truncate text-sm font-semibold text-text-primary">{userName}</p>
                    {userEmail && (
                      <p className="mt-0.5 truncate text-xs text-text-secondary">{userEmail}</p>
                    )}
                    {role && (
                      <span className={`mt-1.5 inline-block rounded px-1.5 py-0.5 text-2xs font-semibold uppercase tracking-wide ${isAdmin ? 'bg-accent text-text-inverse' : 'bg-primary-light text-primary'}`}>
                        {isAdmin ? 'Admin' : 'Therapist'}
                      </span>
                    )}
                  </div>

                  <div className="p-1.5">
                    {!isOnboarding && (
                      <DropdownMenu.Item asChild>
                        <Link href="/dashboard" className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-text-secondary outline-none transition-colors hover:bg-primary-light hover:text-primary">
                          <IconDashboard />
                          {t('dashboard')}
                        </Link>
                      </DropdownMenu.Item>
                    )}
                    {!isOnboarding && isTherapist && (
                      <DropdownMenu.Item asChild>
                        <Link href="/dashboard/edit" className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-text-secondary outline-none transition-colors hover:bg-primary-light hover:text-primary">
                          <IconEdit />
                          {t('editProfile')}
                        </Link>
                      </DropdownMenu.Item>
                    )}
                    {isAdmin && (
                      <DropdownMenu.Item asChild>
                        <Link href="/admin" className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-text-secondary outline-none transition-colors hover:bg-accent/10 hover:text-accent">
                          <IconAdmin />
                          {t('adminPanel')}
                        </Link>
                      </DropdownMenu.Item>
                    )}
                    <DropdownMenu.Separator className="my-1.5 h-px bg-border" />
                    <DropdownMenu.Item asChild>
                      <button
                        type="button"
                        onClick={() => signOut({ callbackUrl: '/' })}
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-text-secondary outline-none transition-colors hover:bg-red-50 hover:text-red-600"
                      >
                        <IconLogout />
                        {t('logout')}
                      </button>
                    </DropdownMenu.Item>
                  </div>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="rounded-lg px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-bg-alt hover:text-primary"
              >
                {t('login')}
              </Link>
              <Link
                href="/auth/register"
                className="group relative overflow-hidden rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary-mid hover:shadow-[0_4px_12px_rgba(0,29,61,0.25)]"
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
          className="flex items-center justify-center rounded-lg p-2 text-text-secondary transition-colors hover:bg-bg-alt hover:text-primary md:hidden"
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
          {isHomepage && (
            <div className="mb-2 flex flex-col gap-0.5 border-b border-border py-2">
              {sectionLinks.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={close}
                  className="rounded-lg px-3 py-2 text-sm text-text-secondary transition-colors hover:bg-bg-alt hover:text-text-primary"
                >
                  {item.label}
                </a>
              ))}
            </div>
          )}

          {isLoggedIn && (
            <div className="mb-2 flex items-center gap-3 border-b border-border py-3">
              {userImage ? (
                <Image src={userImage} alt={userName ?? ''} width={36} height={36} className="h-9 w-9 rounded-full object-cover" />
              ) : (
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-bold text-text-inverse">
                  {getInitials(userName)}
                </span>
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-text-primary">{userName}</p>
                {userEmail && <p className="truncate text-xs text-text-secondary">{userEmail}</p>}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            {isLoggedIn ? (
              <>
                {!isOnboarding && (
                  <Link href="/dashboard" onClick={close} className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:bg-primary-light hover:text-primary">
                    <IconDashboard />
                    {t('dashboard')}
                  </Link>
                )}
                {!isOnboarding && isTherapist && (
                  <Link href="/dashboard/edit" onClick={close} className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:bg-primary-light hover:text-primary">
                    <IconEdit />
                    {t('editProfile')}
                  </Link>
                )}
                {isAdmin && (
                  <Link href="/admin" onClick={close} className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:bg-accent/10 hover:text-accent">
                    <IconAdmin />
                    {t('adminPanel')}
                  </Link>
                )}
                <div className="my-1 h-px bg-border" />
                <button
                  type="button"
                  onClick={() => { close(); signOut({ callbackUrl: '/' }); }}
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:bg-red-50 hover:text-red-600"
                >
                  <IconLogout />
                  {t('logout')}
                </button>
              </>
            ) : (
              <>
                <Link href="/auth/login" onClick={close} className="rounded-lg border border-border px-4 py-2 text-center text-sm font-medium text-text-primary transition-colors hover:border-primary hover:text-primary">
                  {t('login')}
                </Link>
                <Link href="/auth/register" onClick={close} className="rounded-lg bg-primary px-4 py-2 text-center text-sm font-semibold text-white transition-colors hover:bg-primary-mid">
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
