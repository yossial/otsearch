import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';

// NextAuth appends ?error=<code> to this URL on failures
const ERROR_MESSAGES: Record<string, { he: string; en: string }> = {
  OAuthSignin:       { he: 'שגיאה בתחילת תהליך ההתחברות עם Google', en: 'Failed to start Google sign-in' },
  OAuthCallback:     { he: 'שגיאה בקבלת תגובה מ-Google. ייתכן שהאפליקציה אינה מוגדרת בצד Google Cloud Console.', en: 'Error receiving response from Google. The app may not be configured in Google Cloud Console.' },
  OAuthCreateAccount:{ he: 'לא הצלחנו ליצור חשבון עבורך. נסה שוב.', en: 'Could not create your account. Please try again.' },
  EmailCreateAccount:{ he: 'לא הצלחנו ליצור חשבון. נסה שנית.', en: 'Could not create account. Please try again.' },
  Callback:          { he: 'שגיאה בתהליך ההתחברות', en: 'Authentication callback error' },
  OAuthAccountNotLinked: { he: 'הכתובת כבר רשומה עם שיטת התחברות אחרת. נסה להתחבר עם הסיסמה שלך.', en: 'This email is registered with a different sign-in method. Try signing in with your password.' },
  SessionRequired:   { he: 'יש להתחבר כדי לגשת לדף זה', en: 'Sign in required to access this page' },
  Default:           { he: 'שגיאת התחברות. נסה שוב.', en: 'Authentication error. Please try again.' },
};

interface Props {
  searchParams: Promise<{ error?: string }>;
  params: Promise<{ locale: string }>;
}

export async function generateMetadata() {
  const t = await getTranslations('auth');
  return { title: t('errors.authError') };
}

export default async function AuthErrorPage({ searchParams, params }: Props) {
  const { error = 'Default' } = await searchParams;
  const { locale } = await params;
  const t = await getTranslations('auth');

  const msg = ERROR_MESSAGES[error] ?? ERROR_MESSAGES.Default;
  const message = (locale === 'en' || locale === 'ru') ? msg.en : msg.he;

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm text-center">
        <div className="mb-6 flex justify-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-500">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </span>
        </div>

        <h1 className="mb-3 text-xl font-bold text-text-primary">
          {t('errors.authError')}
        </h1>

        <p className="mb-8 text-sm leading-relaxed text-text-secondary">
          {message}
        </p>

        <div className="flex flex-col gap-3">
          <Link
            href="/auth/login"
            className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
          >
            {t('errors.backToLogin')}
          </Link>
        </div>

        {process.env.NODE_ENV === 'development' && (
          <p className="mt-6 rounded-lg bg-bg-alt px-3 py-2 text-xs text-text-muted">
            Error code: <code>{error}</code>
          </p>
        )}
      </div>
    </div>
  );
}
