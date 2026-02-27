'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';

export default function RegisterForm() {
  const t = useTranslations('auth');
  const router = useRouter();

  const [role, setRole] = useState<'ot' | 'patient'>('ot');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
        body: JSON.stringify({ name: name.trim(), email: email.trim().toLowerCase(), password, role }),
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

      // Auto-login after registration
      const result = await signIn('credentials', { email: email.trim().toLowerCase(), password, redirect: false });
      setLoading(false);
      if (result?.error) {
        // Registration succeeded but auto-login failed — send to login
        router.push('/auth/login');
        return;
      }
      // OTs go to their dashboard; patients can start searching
      router.push(role === 'patient' ? '/search' : '/dashboard');
      router.refresh();
    } catch {
      setError(t('errors.required'));
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      {/* Role selector */}
      <div className="grid grid-cols-2 gap-2">
        {(['ot', 'patient'] as const).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRole(r)}
            className={`rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
              role === r
                ? 'border-primary bg-primary-light text-primary'
                : 'border-border bg-bg text-text-secondary hover:border-primary/50'
            }`}
          >
            {t(`register.${r === 'ot' ? 'asOT' : 'asPatient'}`)}
          </button>
        ))}
      </div>

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
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="confirm-password" className="text-sm font-medium text-text-primary">
          {t('register.confirmPassword')}
        </label>
        <input
          id="confirm-password"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          className="rounded-lg border border-border bg-bg px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
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
  );
}
