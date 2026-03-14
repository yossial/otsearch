import { getTranslations } from 'next-intl/server';
import { FadeInUp, StaggerList, StaggerItem } from '@/components/ui/motion';

const KEYS = ['t1', 't2', 't3'] as const;

export default async function Testimonials() {
  const t = await getTranslations('home.testimonials');

  return (
    <section id="testimonials" className="bg-bg-alt py-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">

        {/* Section header */}
        <FadeInUp>
          <div className="mb-14 text-center">
            <div className="mb-4 inline-flex items-center gap-2.5 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5">
              <span
                className="h-1.5 w-1.5 rounded-full bg-accent"
                style={{ animation: 'pulse-dot 2s ease-in-out infinite' }}
                aria-hidden="true"
              />
              <span className="section-eyebrow text-primary">
                {t('eyebrow')}
              </span>
            </div>
            <h2 className="font-display text-2xl font-normal text-text-primary sm:text-3xl">
              {t('title')}
            </h2>
          </div>
        </FadeInUp>

        {/* Cards */}
        <StaggerList className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {KEYS.map((key) => (
            <StaggerItem key={key}>
              {/* Middle card offset down for visual rhythm */}
              <blockquote
                className="card flex h-full flex-col p-7 transition-all duration-200 hover:border-primary/20 hover:shadow-card-hover"
              >
                {/* Decorative quote mark */}
                <div
                  className="mb-3 select-none text-5xl font-black leading-none text-primary/12"
                  aria-hidden="true"
                >
                  &ldquo;
                </div>

                <p className="flex-1 text-sm leading-relaxed text-text-secondary">
                  {t(`${key}Quote`)}
                </p>

                <footer className="mt-6 flex items-center gap-3 border-t border-border pt-5">
                  {/* Avatar placeholder */}
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-light">
                    <div className="h-4 w-4 rounded-full bg-primary/30" />
                  </div>
                  <div>
                    <p className="text-sm font-normal text-text-primary">{t(`${key}Name`)}</p>
                    <p className="text-xs text-text-muted">{t(`${key}Role`)}</p>
                  </div>
                </footer>
              </blockquote>
            </StaggerItem>
          ))}
        </StaggerList>

      </div>
    </section>
  );
}
