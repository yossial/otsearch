import { getTranslations } from 'next-intl/server';
import ContactSectionForm from './ContactSectionForm';

export default async function ContactSection() {
  const t = await getTranslations('home');

  return (
    <section className="bg-primary-light py-16">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold text-text-primary">{t('contact.title')}</h2>
          <p className="mt-2 text-base text-text-secondary">{t('contact.subtitle')}</p>
        </div>
        <div className="rounded-2xl bg-surface p-6 shadow-card">
          <ContactSectionForm />
        </div>
      </div>
    </section>
  );
}
