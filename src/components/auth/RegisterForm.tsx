'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import SocialAuthButtons from './SocialAuthButtons';
import { Button } from '@/components/ui/Button';

export default function RegisterForm() {
  const t = useTranslations('auth');
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;
  const passwordMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError(t('errors.required'));
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError(t('errors.invalidEmail'));
      return;
    }
    if (password.length < 8 || !/[0-9]/.test(password) || !/[a-zA-Z]/.test(password)) {
      setError(t('errors.passwordWeak'));
      return;
    }
    if (password !== confirmPassword) {
      setError(t('errors.passwordMismatch'));
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });

      const data = await res.json() as { error?: string };

      if (!res.ok) {
        const key = data.error as string;
        const msg = key in { emailExists: 1, passwordWeak: 1, invalidEmail: 1, required: 1 }
          ? t(`errors.${key as 'emailExists' | 'passwordWeak' | 'invalidEmail' | 'required'}`)
          : t('errors.required');
        setError(msg);
        setLoading(false);
        return;
      }

      // Auto-login, then go to onboarding
      const result = await signIn('credentials', {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });
      setLoading(false);
      if (result?.error) {
        router.push('/auth/login');
        return;
      }
      router.push('/onboarding/therapist');
      router.refresh();
    } catch {
      setError(t('errors.required'));
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Social signup — primary CTAs */}
      <SocialAuthButtons callbackUrl="/onboarding/therapist" />

      {/* OR divider */}
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-text-muted">{t('social.orContinueWith')}</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      {/* Email / password form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-3" noValidate>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="reg-email" className="text-sm font-normal text-text-primary">
            {t('register.email')}
          </label>
          <input
            id="reg-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="rounded-lg border border-border bg-bg px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="reg-password" className="text-sm font-normal text-text-primary">
            {t('register.password')}
          </label>
          <input
            id="reg-password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="rounded-lg border border-border bg-bg px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
          />
          {password.length > 0 && (
            <ul className="mt-1 flex flex-col gap-0.5">
              {[
                { met: password.length >= 8, key: 'min8' as const },
                { met: /[a-zA-Z]/.test(password), key: 'letter' as const },
                { met: /[0-9]/.test(password), key: 'number' as const },
              ].map(({ met, key }) => (
                <li key={key} className={`flex items-center gap-1.5 text-xs ${met ? 'text-green-600' : 'text-text-muted'}`}>
                  <span aria-hidden="true">{met ? '✓' : '○'}</span>
                  {t(`errors.passwordRule_${key}`)}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="confirm-password" className="text-sm font-normal text-text-primary">
            {t('register.confirmPassword')}
          </label>
          <div className="relative">
            <input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className={`w-full rounded-lg border px-3.5 py-2.5 pe-10 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 ${
                passwordMismatch
                  ? 'border-red-400 bg-red-50/40'
                  : passwordsMatch
                  ? 'border-green-500 bg-green-50/40'
                  : 'border-border bg-bg'
              }`}
            />
            {passwordsMatch && (
              <span className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-green-600">
                ✓
              </span>
            )}
            {passwordMismatch && (
              <span className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-red-500">
                ✗
              </span>
            )}
          </div>
        </div>

        {error && (
          <p role="alert" className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
            {error}
          </p>
        )}

        <Button
          type="submit"
          disabled={loading}
          size="lg"
          className="mt-1 w-full"
        >
          {loading ? '...' : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
              {t('register.submit')}
            </>
          )}
        </Button>

        <p className="text-center text-sm text-text-secondary">
          {t('register.hasAccount')}{' '}
          <Link href="/auth/login" className="font-normal text-primary hover:underline">
            {t('register.login')}
          </Link>
        </p>
      </form>
    </div>
  );
}
