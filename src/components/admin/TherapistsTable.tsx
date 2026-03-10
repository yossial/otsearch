'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

interface AdminTherapist {
  id: string;
  slug: string;
  displayName: { he: string; en?: string };
  city: string;
  subscriptionTier: string;
  isFeatured: boolean;
  isActive: boolean;
  isAcceptingPatients: boolean;
  profileViews: number;
  createdAt: string;
}

export default function TherapistsTable({
  therapists: initialTherapists,
  showTierActions = false,
}: {
  therapists: AdminTherapist[];
  showTierActions?: boolean;
}) {
  const t = useTranslations('admin');
  const [therapists, setTherapists] = useState(initialTherapists);
  const [pending, startTransition] = useTransition();

  async function updateTherapist(id: string, patch: Record<string, unknown>) {
    const res = await fetch(`/api/admin/therapists/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    if (!res.ok) {
      toast.error(t('toast.error'));
      return;
    }
    const updated = await res.json() as Partial<AdminTherapist>;
    setTherapists((prev) =>
      prev.map((th) => (th.id === id ? { ...th, ...updated } : th))
    );
    toast.success(t('toast.saved'));
  }

  if (therapists.length === 0) {
    return <p className="text-sm text-text-secondary">{t('therapists.noResults')}</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead className="bg-bg-alt">
          <tr>
            <th className="px-4 py-3 text-start font-semibold text-text-secondary">{t('therapists.table.name')}</th>
            <th className="px-4 py-3 text-start font-semibold text-text-secondary">{t('therapists.table.city')}</th>
            <th className="px-4 py-3 text-start font-semibold text-text-secondary">{t('therapists.table.tier')}</th>
            <th className="px-4 py-3 text-start font-semibold text-text-secondary">{t('therapists.table.featured')}</th>
            <th className="px-4 py-3 text-start font-semibold text-text-secondary">{t('therapists.table.active')}</th>
            <th className="px-4 py-3 text-start font-semibold text-text-secondary">{t('therapists.table.views')}</th>
            <th className="px-4 py-3 text-start font-semibold text-text-secondary">{t('therapists.table.actions')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border bg-surface">
          {therapists.map((therapist) => (
            <tr key={therapist.id}>
              <td className="px-4 py-3 font-medium text-text-primary">
                {therapist.displayName.he || therapist.displayName.en}
              </td>
              <td className="px-4 py-3 text-text-secondary">{therapist.city || '—'}</td>
              <td className="px-4 py-3">
                <span
                  className={`rounded px-2 py-0.5 text-xs font-semibold ${
                    therapist.subscriptionTier === 'premium'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-bg-alt text-text-secondary'
                  }`}
                >
                  {therapist.subscriptionTier === 'premium' ? t('therapists.filterTiers.premium') : t('therapists.filterTiers.free')}
                </span>
              </td>
              <td className="px-4 py-3">
                <span className={`text-xs font-semibold ${therapist.isFeatured ? 'text-green-600' : 'text-text-secondary'}`}>
                  {therapist.isFeatured ? t('therapists.status.yes') : t('therapists.status.no')}
                </span>
              </td>
              <td className="px-4 py-3">
                <span className={`text-xs font-semibold ${therapist.isActive ? 'text-green-600' : 'text-red-600'}`}>
                  {therapist.isActive ? t('therapists.status.active') : t('therapists.status.inactive')}
                </span>
              </td>
              <td className="px-4 py-3 text-text-secondary">{therapist.profileViews}</td>
              <td className="px-4 py-3">
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      startTransition(() => { void updateTherapist(therapist.id, { isFeatured: !therapist.isFeatured }); })
                    }
                    disabled={pending}
                    className="rounded bg-bg-alt px-2 py-1 text-xs font-semibold text-text-secondary transition-colors hover:bg-primary-light hover:text-primary disabled:opacity-50"
                  >
                    {therapist.isFeatured ? t('therapists.actions.unfeature') : t('therapists.actions.feature')}
                  </button>
                  <button
                    onClick={() =>
                      startTransition(() => { void updateTherapist(therapist.id, { isActive: !therapist.isActive }); })
                    }
                    disabled={pending}
                    className="rounded bg-bg-alt px-2 py-1 text-xs font-semibold text-text-secondary transition-colors hover:bg-primary-light hover:text-primary disabled:opacity-50"
                  >
                    {therapist.isActive ? t('therapists.actions.deactivate') : t('therapists.actions.activate')}
                  </button>
                  {showTierActions && (
                    <button
                      onClick={() =>
                        startTransition(() => {
                          void updateTherapist(therapist.id, {
                            subscriptionTier: therapist.subscriptionTier === 'premium' ? 'free' : 'premium',
                          });
                        })
                      }
                      disabled={pending}
                      className="rounded bg-bg-alt px-2 py-1 text-xs font-semibold text-text-secondary transition-colors hover:bg-primary-light hover:text-primary disabled:opacity-50"
                    >
                      {therapist.subscriptionTier === 'premium' ? t('therapists.actions.downgrade') : t('therapists.actions.upgrade')}
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
