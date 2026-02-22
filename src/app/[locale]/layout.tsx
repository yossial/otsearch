import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import '@/app/globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    template: '%s | OT Connect',
    default: 'OT Connect — Find Occupational Therapists in Israel',
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
    <html lang={locale} dir={dir} className={inter.variable}>
      <body className="bg-bg font-sans text-text-primary antialiased">
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
