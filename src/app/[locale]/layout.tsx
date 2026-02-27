import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { SessionProvider } from 'next-auth/react';
import { routing } from '@/i18n/routing';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import '@/app/globals.css';

export const metadata: Metadata = {
  title: {
    template: '%s | Therapio',
    default: 'Therapio — Find Occupational Therapists in Israel',
  },
  description:
    'Find private occupational therapists in Israel. Search by specialisation, Kupat Holim, and location.',
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as 'he' | 'ar' | 'en')) {
    notFound();
  }

  const messages = await getMessages();
  const dir = locale === 'en' ? 'ltr' : 'rtl';

  return (
    <html lang={locale} dir={dir}>
      <body className="bg-bg font-sans text-text-primary antialiased">
        <NextIntlClientProvider messages={messages}>
          <SessionProvider>
            <Navbar />
            <main>{children}</main>
            <Footer />
          </SessionProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
