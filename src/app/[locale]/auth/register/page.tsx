import { getTranslations } from 'next-intl/server';
import RegisterForm from '@/components/auth/RegisterForm';

export async function generateMetadata() {
  const t = await getTranslations('auth.register');
  return { title: t('title') };
}

export default async function RegisterPage() {
  const t = await getTranslations('auth.register');

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-text-primary">{t('title')}</h1>
        </div>
        <div className="rounded-xl bg-surface p-8 shadow-card">
          <RegisterForm />
        </div>
      </div>
    </div>
  );
}
