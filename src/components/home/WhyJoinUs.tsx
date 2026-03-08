import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';

// ── Icons ─────────────────────────────────────────────────────────────────────

function IconTarget() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

function IconShield() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function IconClock() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function IconMegaphone() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 11l19-9-9 19-2-8-8-2z" />
    </svg>
  );
}

function IconStar() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function IconUsers() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default async function WhyJoinUs() {
  const tHome = await getTranslations('home');
  const t = (key: string) => tHome(`whyJoinUs.${key}` as Parameters<typeof tHome>[0]);

  const seekerPoints = [
    { titleKey: 'seekers.point1Title', descKey: 'seekers.point1Desc', icon: <IconTarget /> },
    { titleKey: 'seekers.point2Title', descKey: 'seekers.point2Desc', icon: <IconShield /> },
    { titleKey: 'seekers.point3Title', descKey: 'seekers.point3Desc', icon: <IconClock /> },
  ] as const;

  const therapistPoints = [
    { titleKey: 'therapists.point1Title', descKey: 'therapists.point1Desc', icon: <IconMegaphone /> },
    { titleKey: 'therapists.point2Title', descKey: 'therapists.point2Desc', icon: <IconStar /> },
    { titleKey: 'therapists.point3Title', descKey: 'therapists.point3Desc', icon: <IconUsers /> },
  ] as const;

  return (
    <section id="why-join-us" className="border-t border-border">
      <div className="grid grid-cols-1 lg:grid-cols-2">

        {/* Left / Start column — Seekers (white bg) */}
        <div className="bg-surface px-6 py-14 sm:px-10 lg:px-14">
          <h2 className="mb-8 text-xl font-bold text-text-primary sm:text-2xl">
            {t('seekers.heading')}
          </h2>
          <ul className="flex flex-col gap-6">
            {seekerPoints.map(({ titleKey, descKey, icon }) => (
              <li key={titleKey} className="flex items-start gap-4">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-light text-primary">
                  {icon}
                </div>
                <div>
                  <p className="text-sm font-semibold text-text-primary">{t(titleKey)}</p>
                  <p className="mt-0.5 text-sm leading-relaxed text-text-secondary">{t(descKey)}</p>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-10">
            <a
              href="#search"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-primary-dark"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
              {tHome('searchButton')}
            </a>
          </div>
        </div>

        {/* Right / End column — Therapists (light navy tint) */}
        <div className="bg-[#edf4fd] px-6 py-14 sm:px-10 lg:px-14">
          <h2 className="mb-8 text-xl font-bold text-text-primary sm:text-2xl">
            {t('therapists.heading')}
          </h2>
          <ul className="flex flex-col gap-6">
            {therapistPoints.map(({ titleKey, descKey, icon }) => (
              <li key={titleKey} className="flex items-start gap-4">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
                  {icon}
                </div>
                <div>
                  <p className="text-sm font-semibold text-text-primary">{t(titleKey)}</p>
                  <p className="mt-0.5 text-sm leading-relaxed text-text-secondary">{t(descKey)}</p>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-10">
            <Link
              href="/auth/register"
              className="inline-flex items-center gap-2 rounded-xl border border-accent bg-accent px-6 py-3 text-sm font-bold text-text-inverse transition-colors hover:bg-accent/90"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" />
              </svg>
              {tHome('heroTherapistCta')}
            </Link>
          </div>
        </div>

      </div>
    </section>
  );
}
