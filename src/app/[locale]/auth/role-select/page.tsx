import { getTranslations } from 'next-intl/server';
import RoleSelectClient from '@/components/auth/RoleSelectClient';

export async function generateMetadata() {
  const t = await getTranslations('auth.roleSelect');
  return { title: t('title') };
}

export default async function RoleSelectPage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <RoleSelectClient />
      </div>
    </div>
  );
}
