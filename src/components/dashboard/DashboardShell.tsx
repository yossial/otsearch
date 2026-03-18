'use client';

import { Suspense } from 'react';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { BreadcrumbProvider } from '@/components/ui/BreadcrumbContext';
import BreadcrumbNav from '@/components/ui/BreadcrumbNav';
import ConfettiEffect from '@/components/ui/ConfettiEffect';

export type HeroData = {
  name: string;
  photo: string | null;
  isActive: boolean;
  isAcceptingPatients: boolean;
  isPremium: boolean;
  slug: string | null;
  profileViews: number;
  specialisationsCount: number;
  sessionTypesCount: number;
  insuranceCount: number;
  ratingAvg: number;
  ratingCount: number;
};

// Hero card shown only on the 5 root tab pages, not on sub-pages
const MAIN_PAGE_RE = /\/dashboard(\/patients|\/schedule|\/billing|\/settings)?$/;

export default function DashboardShell({
  heroData,
  isPremium,
  children,
}: {
  heroData: HeroData | null;
  isPremium: boolean;
  children: React.ReactNode;
}) {
  const t = useTranslations('dashboard');
  const pathname = usePathname();
  const isMainPage = MAIN_PAGE_RE.test(pathname);

  const tabs = [
    { key: 'overview', href: '/dashboard', segment: null as string | null },
    { key: 'patients', href: '/dashboard/patients', segment: 'patients' },
    { key: 'schedule', href: '/dashboard/schedule', segment: 'schedule' },
    { key: 'billing', href: '/dashboard/billing', segment: 'billing' },
    { key: 'settings', href: '/dashboard/settings', segment: 'settings' },
  ] as const;

  const tabLabels: Record<string, string> = {
    overview: t('tabs.overview'),
    patients: t('patients.title'),
    schedule: t('schedule.title'),
    billing: t('billing.title'),
    settings: t('tabs.settings'),
  };

  function isActive(tab: (typeof tabs)[number]) {
    if (!tab.segment) return /\/dashboard$/.test(pathname);
    return pathname.includes(`/dashboard/${tab.segment}`);
  }

  return (
    <BreadcrumbProvider>
    <div className="min-h-screen bg-[#EEF1F8] print:bg-white">
      {/* Hero card — only on main tab pages */}
      {isMainPage && heroData && (
        <div className="no-print mx-auto max-w-5xl px-4 pt-8 sm:px-6 lg:px-8">
          <HeroCard data={heroData} t={t} />
        </div>
      )}

      {/* Sticky tab bar */}
      <div className="no-print sticky top-16 z-10 border-b border-border bg-[#EEF1F8]">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <nav className="-mb-px flex" aria-label="Dashboard sections">
            {tabs.map((tab) => {
              const active = isActive(tab);
              return (
                <Link
                  key={tab.key}
                  href={tab.href}
                  className={`inline-flex items-center gap-1.5 border-b-2 px-4 py-3 text-sm font-normal transition-colors ${
                    active
                      ? 'border-accent text-accent'
                      : 'border-transparent text-text-muted hover:border-border hover:text-text-secondary'
                  }`}
                >
                  {tabLabels[tab.key]}
                  {!isPremium && tab.key !== 'overview' && tab.key !== 'settings' && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="11"
                      height="11"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="opacity-40"
                      aria-hidden="true"
                    >
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Page content */}
      <div className="mx-auto max-w-5xl space-y-4 px-4 pb-6 pt-4 sm:px-6 lg:px-8 print:max-w-none print:p-0">
        <Suspense fallback={null}>
          <ConfettiEffect />
        </Suspense>
        {!isMainPage && <BreadcrumbNav />}
        {children}
      </div>
    </div>
    </BreadcrumbProvider>
  );
}

function HeroCard({
  data,
  t,
}: {
  data: HeroData;
  t: ReturnType<typeof useTranslations<'dashboard'>>;
}) {
  return (
    <div className="card overflow-hidden">
      <div className="gradient-bar" />

      <div className="flex flex-wrap items-start justify-between gap-4 p-6">
        {/* Avatar + name */}
        <div className="flex items-start gap-4">
          {data.photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={data.photo}
              alt={data.name}
              width={72}
              height={72}
              className="h-[72px] w-[72px] shrink-0 rounded-full object-cover ring-[3px] ring-primary-light"
            />
          ) : (
            <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-full bg-primary text-2xl font-normal text-white ring-[3px] ring-primary-light">
              {data.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-xl font-normal leading-tight text-text-primary">{data.name}</h1>
            <p className="mt-0.5 text-sm text-text-muted">{t('therapistRole')}</p>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-normal ${
                  data.isActive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${data.isActive ? 'bg-green-500' : 'bg-red-400'}`}
                />
                {data.isActive ? t('profileActive') : t('profileInactive')}
              </span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-normal ${
                  data.isAcceptingPatients
                    ? 'bg-primary-light text-primary'
                    : 'bg-bg-alt text-text-muted'
                }`}
              >
                {data.isAcceptingPatients ? t('acceptingPatients') : t('notAccepting')}
              </span>
              {data.isPremium && (
                <span className="rounded-full bg-yellow-50 px-2.5 py-0.5 text-xs font-normal text-yellow-700">
                  {t('subscriptionPremium')}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* CTA buttons */}
        <div className="flex shrink-0 gap-2">
          <Link
            href="/dashboard/edit"
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-normal tracking-wide text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary-dark hover:shadow-primary"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            {t('editProfile')}
          </Link>
          {data.slug && (
            <Link
              href={`/therapist/${data.slug}?from=dashboard`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm font-normal text-text-secondary transition-all duration-200 hover:border-primary/30 hover:bg-primary-light hover:text-primary"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              {t('viewProfile')}
            </Link>
          )}
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex flex-wrap gap-x-6 gap-y-2 border-t border-border bg-bg-alt px-6 py-3">
        <StatItem
          label={t('profileViews')}
          value={data.profileViews.toLocaleString()}
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          }
        />
        <StatItem
          label={t('specialisationsLabel')}
          value={data.specialisationsCount}
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          }
        />
        <StatItem
          label={t('sessionTypesLabel')}
          value={data.sessionTypesCount}
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          }
        />
        <StatItem
          label={t('insuranceLabel')}
          value={data.insuranceCount}
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          }
        />
        {data.ratingCount > 0 && (
          <StatItem
            label={t('rating')}
            value={`${data.ratingAvg.toFixed(1)} (${data.ratingCount})`}
            icon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="text-accent"
                aria-hidden="true"
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            }
          />
        )}
      </div>
    </div>
  );
}

function StatItem({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-1.5 text-text-secondary">
      {icon}
      <span className="text-sm font-normal text-text-primary">{value}</span>
      <span className="text-xs text-text-secondary">{label}</span>
    </div>
  );
}
