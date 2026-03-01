'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import SocialAuthButtons from './SocialAuthButtons';

export default function RegisterForm() {
  const t = useTranslations('auth');
  const router = useRouter();

  const [name, setName] = useState('');
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

    if (!name.trim() || !email.trim() || !password) {
      setError(t('errors.required'));
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError(t('errors.invalidEmail'));
      return;
    }
    if (password.length < 8) {
      setError(t('errors.passwordTooShort'));
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
        body: JSON.stringify({ name: name.trim(), email: email.trim().toLowerCase(), password }),
      });

      const data = await res.json() as { error?: string };

      if (!res.ok) {
        const key = data.error as string;
        const msg = key in { emailExists: 1, passwordTooShort: 1, invalidEmail: 1, required: 1 }
          ? t(`errors.${key as 'emailExists' | 'passwordTooShort' | 'invalidEmail' | 'required'}`)
          : t('errors.required');
        setError(msg);
        setLoading(false);
        return;
      }

      // Auto-login, then go to role selection
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
      router.push('/auth/role-select');
      router.refresh();
    } catch {
      setError(t('errors.required'));
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Social signup — primary CTAs */}
      <SocialAuthButtons callbackUrl="/auth/role-select" />

      {/* OR divider */}
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-text-muted">{t('social.orContinueWith')}</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      {/* Email / password form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="name" className="text-sm font-medium text-text-primary">
            {t('register.name')}
          </label>
          <input
            id="name"
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="rounded-lg border border-border bg-bg px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="reg-email" className="text-sm font-medium text-text-primary">
            {t('register.email')}
          </label>
          <input
            id="reg-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="rounded-lg border border-border bg-bg px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="reg-password" className="text-sm font-medium text-text-primary">
            {t('register.password')}
          </label>
          <input
            id="reg-password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="rounded-lg border border-border bg-bg px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          {password.length > 0 && password.length < 8 && (
            <p className="text-xs text-text-muted">{t('errors.passwordTooShort')}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="confirm-password" className="text-sm font-medium text-text-primary">
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
              className={`w-full rounded-lg border px-3.5 py-2.5 pr-10 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 ${
                passwordMismatch
                  ? 'border-red-400 bg-red-50/40 focus:border-red-400 focus:ring-red-200'
                  : passwordsMatch
                  ? 'border-green-500 bg-green-50/40 focus:border-green-500 focus:ring-green-200'
                  : 'border-border bg-bg focus:border-primary focus:ring-primary/20'
              }`}
            />
            {/* Match indicator */}
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

        <button
          type="submit"
          disabled={loading}
          className="mt-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:opacity-60"
        >
          {loading ? '...' : t('register.submit')}
        </button>

        <p className="text-center text-sm text-text-secondary">
          {t('register.hasAccount')}{' '}
          <Link href="/auth/login" className="font-medium text-primary hover:underline">
            {t('register.login')}
          </Link>
        </p>
      </form>
    </div>
  );
}
