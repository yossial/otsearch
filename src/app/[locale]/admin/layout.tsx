import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/auth';
import { Link } from '@/i18n/navigation';
import { getLocale, getTranslations } from 'next-intl/server';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const role = (session?.user as { role?: string | null } | undefined)?.role;
  const locale = await getLocale();

  if (!session?.user || role !== 'admin') {
    redirect(`/${locale}`);
  }

  const t = await getTranslations('admin');

  const navItems = [
    { href: '/admin' as const, label: t('nav.dashboard') },
    { href: '/admin/users' as const, label: t('nav.users') },
    { href: '/admin/therapists' as const, label: t('nav.therapists') },
    { href: '/admin/billing' as const, label: t('nav.billing') },
    { href: '/admin/settings' as const, label: t('nav.settings') },
  ];

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-bg-alt">
      {/* Sidebar */}
      <aside className="hidden h-full w-56 shrink-0 overflow-y-auto border-e border-border bg-surface lg:flex lg:flex-col">
        <div className="border-b border-border px-5 py-4">
          <span className="text-sm font-normal text-text-primary uppercase tracking-widest">{t('title')}</span>
        </div>
        <nav className="flex flex-col gap-0.5 p-3">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded px-3 py-2 text-sm font-normal text-text-secondary transition-colors hover:bg-bg-alt hover:text-text-primary"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Mobile top nav */}
      <div className="fixed inset-x-0 top-0 z-30 border-b border-border bg-surface lg:hidden">
        <nav className="flex gap-1 overflow-x-auto px-3 py-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="shrink-0 rounded px-3 py-1.5 text-sm font-normal text-text-secondary transition-colors hover:bg-bg-alt hover:text-text-primary"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto pt-12 lg:pt-0">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</div>
      </main>
    </div>
  );
}
