'use client';

import { useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';

function TherapistIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <circle cx="20" cy="20" r="20" className="fill-primary/10" />
      <path
        d="M20 10a4 4 0 1 1 0 8 4 4 0 0 1 0-8zM14 28c0-3.31 2.69-6 6-6s6 2.69 6 6"
        stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
        className="stroke-primary"
      />
      <path
        d="M24 22l2 2-1.5 1.5L26 27"
        stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
        className="stroke-primary"
      />
      <circle cx="26" cy="27.5" r="1" className="fill-primary" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <circle cx="20" cy="20" r="20" className="fill-primary/10" />
      <circle cx="18" cy="18" r="6" stroke="currentColor" strokeWidth="1.8" className="stroke-primary" />
      <path d="M22.5 22.5L27 27" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="stroke-primary" />
    </svg>
  );
}

export default function RoleSelectClient() {
  const t = useTranslations('auth');
  const router = useRouter();
  const { update } = useSession();
  const [selecting, setSelecting] = useState<'ot' | 'patient' | null>(null);
  const [error, setError] = useState('');

  async function handleSelect(role: 'ot' | 'patient') {
    setSelecting(role);
    setError('');

    try {
      const res = await fetch('/api/auth/set-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });

      const data = await res.json() as {
        ok?: boolean;
        role?: string;
        otProfileId?: string | null;
        error?: string;
      };

      if (!res.ok && res.status !== 409) {
        setError(t('social.oauthError'));
        setSelecting(null);
        return;
      }

      // Refresh the JWT with the new role so middleware sees it immediately
      await update({ role: data.role ?? role, otProfileId: data.otProfileId ?? null });

      if (role === 'ot') {
        router.push('/onboarding/ot');
      } else {
        router.push('/');
      }
      router.refresh();
    } catch {
      setError(t('social.oauthError'));
      setSelecting(null);
    }
  }

  const cards: Array<{
    role: 'ot' | 'patient';
    icon: React.ReactNode;
    title: string;
    desc: string;
  }> = [
    {
      role: 'ot',
      icon: <TherapistIcon />,
      title: t('roleSelect.therapistCard'),
      desc: t('roleSelect.therapistDesc'),
    },
    {
      role: 'patient',
      icon: <SearchIcon />,
      title: t('roleSelect.patientCard'),
      desc: t('roleSelect.patientDesc'),
    },
  ];

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-text-primary">{t('roleSelect.title')}</h1>
        <p className="mt-2 text-text-secondary">{t('roleSelect.subtitle')}</p>
      </div>

      <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
        {cards.map(({ role, icon, title, desc }) => (
          <button
            key={role}
            type="button"
            onClick={() => void handleSelect(role)}
            disabled={selecting !== null}
            className={`group flex flex-col items-center gap-4 rounded-2xl border-2 bg-surface p-8 text-center shadow-card transition-all hover:border-primary hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 ${
              selecting === role ? 'border-primary bg-primary/5' : 'border-border'
            }`}
          >
            <div className="transition-transform group-hover:scale-110">
              {icon}
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-base font-semibold text-text-primary">{title}</span>
              <span className="text-sm leading-snug text-text-secondary">{desc}</span>
            </div>
            {selecting === role && (
              <span className="text-xs text-primary">...</span>
            )}
          </button>
        ))}
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
