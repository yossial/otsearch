import type { Metadata } from 'next';
import { Inter, Calistoga, Rubik } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { SessionProvider } from 'next-auth/react';
import { routing } from '@/i18n/routing';
import { auth } from '@/lib/auth/auth';
import { connectDB } from '@/lib/db';
import { User } from '@/lib/db/models/User';
import { TherapistProfile } from '@/lib/db/models/TherapistProfile';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Toaster } from 'sonner';
import '@/app/globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const calistoga = Calistoga({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-calistoga',
  display: 'swap',
});

const rubik = Rubik({
  subsets: ['hebrew', 'latin'],
  variable: '--font-rubik',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700', '800', '900'],
});

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

  if (!routing.locales.includes(locale as 'he' | 'ar' | 'en' | 'ru')) {
    notFound();
  }

  const messages = await getMessages();
  const dir = locale === 'he' || locale === 'ar' ? 'rtl' : 'ltr';

  // Fetch profile photo server-side so it works even with large data: URLs
  // that can't fit in a JWT cookie.
  let avatarUrl: string | null = null;
  try {
    const session = await auth();
    if (session?.user?.id) {
      await connectDB();
      let therapistProfileId = (session.user as { therapistProfileId?: string | null }).therapistProfileId;
      // JWT may be stale — fall back to DB
      if (!therapistProfileId) {
        const dbUser = await User.findById(session.user.id).select('therapistProfileId').lean();
        therapistProfileId = dbUser?.therapistProfileId ? String(dbUser.therapistProfileId) : null;
      }
      if (therapistProfileId) {
        const profile = await TherapistProfile.findById(therapistProfileId).select('photo').lean();
        avatarUrl = (profile as { photo?: string | null } | null)?.photo ?? null;
      }
    }
  } catch {
    // non-critical — layout renders without avatar
  }

  return (
    <html lang={locale} dir={dir} className={`${inter.variable} ${calistoga.variable} ${rubik.variable}`}>
      <body className="bg-bg font-sans text-text-primary antialiased">
        <NextIntlClientProvider messages={messages}>
          <SessionProvider>
            <Navbar avatarUrl={avatarUrl} />
            <main className="pt-16">{children}</main>
            <Footer />
            <Toaster dir={dir} richColors position="bottom-center" />
          </SessionProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
