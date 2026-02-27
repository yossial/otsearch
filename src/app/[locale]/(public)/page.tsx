import { getTranslations } from 'next-intl/server';
import SearchBar from '@/components/home/SearchBar';

export default async function HomePage() {
  const t = await getTranslations('home');

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-bg px-4">
      <div className="w-full max-w-3xl text-center">
        <h1 className="mb-4 text-4xl font-extrabold tracking-tight text-text-primary lg:text-5xl">
          {t('heroTitle')}
        </h1>
        <p className="mb-8 text-lg text-text-secondary">{t('heroSubtitle')}</p>
        <SearchBar />
      </div>
    </main>
  );
}
