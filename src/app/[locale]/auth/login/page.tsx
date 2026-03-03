import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import LoginForm from '@/components/auth/LoginForm';

export async function generateMetadata() {
  const t = await getTranslations('auth.login');
  return { title: t('title') };
}

export default async function LoginPage() {
  const t = await getTranslations('auth.login');

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-text-primary">{t('title')}</h1>
        </div>
        <div className="rounded-xl bg-surface p-8 shadow-card">
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
