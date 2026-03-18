import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { searchTherapists } from '@/lib/db/therapists';
import { searchMockTherapists } from '@/lib/mock-search';
import StatsMapSection from '@/components/home/StatsMapSection';
import HowItWorks from '@/components/home/HowItWorks';
import WhatIsOccupationalTherapy from '@/components/home/WhatIsOccupationalTherapy';
import WhyJoinUs from '@/components/home/WhyJoinUs';
import ContactSection from '@/components/home/ContactSection';
import HeroGraphic from '@/components/home/HeroGraphic';
import Testimonials from '@/components/home/Testimonials';
import Pricing from '@/components/home/Pricing';
import FAQ from '@/components/home/FAQ';
import { FadeInUp } from '@/components/ui/motion';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('home.meta');
  const siteUrl = process.env.NEXTAUTH_URL ?? 'https://therapio.co.il';
  return {
    title: t('title'),
    description: t('description'),
    openGraph: {
      title: t('title'),
      description: t('description'),
      url: siteUrl,
      siteName: 'Therapio',
      type: 'website',
      images: [
        {
          url: `${siteUrl}/og-image.png`,
          width: 1200,
          height: 630,
          alt: t('title'),
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: t('title'),
      description: t('description'),
      images: [`${siteUrl}/og-image.png`],
    },
  };
}

interface HomePageProps {
  params: Promise<{ locale: string }>;
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  const tHome = await getTranslations('home');

  // Fetch a broad set of profiles for avatars + city stats
  let profiles = [] as Awaited<ReturnType<typeof searchTherapists>>['profiles'];
  let total = 0;

  try {
    ({ profiles, total } = await searchTherapists({ page: 1, limit: 50 }));
  } catch (err) {
    console.warn('[HomePage] DB unavailable, falling back to mock data:', (err as Error).message);
    ({ profiles, total } = searchMockTherapists({ page: 1, limit: 50 }));
  }

  return (
    <div className="min-h-screen bg-bg">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section id="hero" className="relative overflow-hidden border-b border-border bg-surface"
        style={{ backgroundImage: 'radial-gradient(ellipse 70% 60% at 100% 0%, color-mix(in srgb, var(--color-primary) 4%, transparent), transparent)' }}
      >
        <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6 sm:pb-20 sm:pt-12 lg:px-8 lg:pb-24 lg:pt-14">
          <div className="flex flex-col items-center gap-10 lg:flex-row lg:items-center lg:gap-16">

            {/* Text column */}
            <div className="w-full flex-1 text-center lg:text-start">

              {/* Section badge */}
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2">
                <span
                  className="h-2 w-2 rounded-full bg-accent"
                  style={{ animation: 'pulse-dot 2s ease-in-out infinite' }}
                  aria-hidden="true"
                />
                <span className="text-sm font-normal tracking-wide text-primary">
                  {tHome('heroEyebrow')}
                </span>
              </div>

              {/* Headline — flows as one natural line, no forced breaks */}
              <h1 className="font-display text-3xl font-normal leading-[1.2] tracking-tight text-text-primary sm:text-4xl lg:text-[2.85rem] xl:text-[3.2rem]">
                <span className="inline-block opacity-0 [animation:word-up_0.55s_cubic-bezier(0.22,1,0.36,1)_0.1s_forwards]">
                  {tHome('heroTitlePre')}
                </span>
                {' '}
                <span className="inline-block opacity-0 [animation:word-up_0.55s_cubic-bezier(0.22,1,0.36,1)_0.3s_forwards]">
                  <span className="hero-text-accent">{tHome('heroTitleAccent')}</span>
                </span>
              </h1>

              {/* Sub-headline */}
              <p className="mx-auto mt-6 max-w-xl text-2xl leading-snug text-text-secondary opacity-0 [animation:word-up_0.55s_cubic-bezier(0.22,1,0.36,1)_0.5s_forwards] lg:mx-0 lg:max-w-lg">
                {tHome('heroSubtitle')}
              </p>

              {/* Body text */}
              <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-text-secondary opacity-0 [animation:word-up_0.55s_cubic-bezier(0.22,1,0.36,1)_0.65s_forwards] lg:mx-0">
                {tHome('heroBody')}
              </p>

              {/* Trust signals */}
              <div className="mt-10 flex flex-wrap justify-center gap-8 lg:justify-start">
                <div className="flex flex-col items-center lg:items-start">
                  <span className="text-4xl font-extrabold text-primary">{tHome('stats.therapists')}</span>
                  <span className="mt-0.5 text-sm text-text-secondary">{tHome('stats.therapistsLabel')}</span>
                </div>
                <div className="w-px self-stretch bg-border" aria-hidden="true" />
                <div className="flex flex-col items-center lg:items-start">
                  <span className="text-4xl font-extrabold text-primary">{tHome('stats.cities')}</span>
                  <span className="mt-0.5 text-sm text-text-secondary">{tHome('stats.citiesLabel')}</span>
                </div>
                <div className="w-px self-stretch bg-border" aria-hidden="true" />
                <div className="flex flex-col items-center lg:items-start">
                  <span className="text-4xl font-extrabold text-primary">{tHome('stats.funds')}</span>
                  <span className="mt-0.5 text-sm text-text-secondary">{tHome('stats.fundsLabel')}</span>
                </div>
              </div>

              {/* CTAs */}
              <div className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start">
                <a
                  href={`/${locale}/search`}
                  className="group inline-flex items-center gap-2.5 rounded-full px-8 py-3.5 text-base font-normal text-white shadow-[0_4px_20px_rgba(27,15,147,0.45)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_6px_28px_rgba(27,15,147,0.6)]"
                  style={{ background: 'linear-gradient(135deg, #1b0f93 0%, #1b007c 30%, #0a013d 58%, #02001a 80%, #02000e 100%)' }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                  </svg>
                  {tHome('searchButton')}
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="transition-transform duration-200 group-hover:-translate-x-0.5 rtl:rotate-180 rtl:group-hover:translate-x-0.5">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </a>
                <a
                  href="#for-therapists"
                  className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-7 py-3.5 text-base font-normal text-text-primary transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:text-primary"
                >
                  {tHome('heroTherapistCta')}
                </a>
              </div>
            </div>

            {/* Graphic column — hidden on small screens */}
            <div className="hidden w-full shrink-0 justify-center lg:flex lg:w-[46%]">
              <HeroGraphic />
            </div>

          </div>
        </div>
      </section>

      {/* ── Network stats + map ──────────────────────────────────────────── */}
      <StatsMapSection profiles={profiles} total={total} locale={locale} />

      {/* ── Why join us ───────────────────────────────────────────────────── */}
      <WhyJoinUs />

      {/* ── How it works ──────────────────────────────────────────────────── */}
      <HowItWorks />

      {/* ── Testimonials ──────────────────────────────────────────────────── */}
      <Testimonials />

      {/* ── Pricing ───────────────────────────────────────────────────────── */}
      <Pricing />

      {/* ── What is OT ────────────────────────────────────────────────────── */}
      <WhatIsOccupationalTherapy />

      {/* ── For therapists CTA (inverted dark section) ────────────────────── */}
      <section id="for-therapists" className="relative overflow-hidden py-20" style={{ background: 'radial-gradient(ellipse at 20% 60%, #1b0f93 0%, #0d0b50 45%, #06041e 100%)' }}>
        {/* Dot texture */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />
        {/* Ambient accent glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -inset-e-16 top-1/2 h-[280px] w-[280px] -translate-y-1/2 rounded-full bg-accent opacity-[0.06] blur-[80px]"
        />

        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <FadeInUp>
            <div className="flex flex-col items-center gap-8 text-center sm:flex-row sm:justify-between sm:text-start">
              <div>
                <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-3.5 py-1">
                  <span
                    className="h-1.5 w-1.5 rounded-full bg-accent"
                    style={{ animation: 'pulse-dot 2s ease-in-out infinite' }}
                    aria-hidden="true"
                  />
                  <span className="section-eyebrow text-white">
                    {tHome('therapistBanner.free')}
                  </span>
                </div>
                <h2 className="font-display text-2xl font-normal text-white sm:text-3xl">
                  {tHome('therapistBanner.title')}
                </h2>
                <p className="mt-2 max-w-lg text-base text-white/85">
                  {tHome('therapistBanner.subtitle')}
                </p>
              </div>
              <Link
                href="/auth/register"
                className="shrink-0 rounded-xl bg-white px-8 py-3.5 text-sm font-normal text-primary transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/90"
              >
                {tHome('therapistBanner.cta')}
              </Link>
            </div>
          </FadeInUp>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────────────────── */}
      <FAQ />

      {/* ── Contact section ───────────────────────────────────────────────── */}
      <ContactSection />
    </div>
  );
}
