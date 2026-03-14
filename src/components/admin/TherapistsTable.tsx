'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';

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
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead className="bg-bg-alt">
          <tr>
            <th className="px-4 py-3 text-start font-normal text-text-secondary">{t('therapists.table.name')}</th>
            <th className="px-4 py-3 text-start font-normal text-text-secondary">{t('therapists.table.city')}</th>
            <th className="px-4 py-3 text-start font-normal text-text-secondary">{t('therapists.table.tier')}</th>
            <th className="px-4 py-3 text-start font-normal text-text-secondary">{t('therapists.table.featured')}</th>
            <th className="px-4 py-3 text-start font-normal text-text-secondary">{t('therapists.table.active')}</th>
            <th className="px-4 py-3 text-start font-normal text-text-secondary">{t('therapists.table.views')}</th>
            <th className="px-4 py-3 text-start font-normal text-text-secondary">{t('therapists.table.actions')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border bg-surface">
          {therapists.map((therapist) => (
            <tr key={therapist.id}>
              <td className="px-4 py-3 font-normal text-text-primary">
                {therapist.displayName.he || therapist.displayName.en}
              </td>
              <td className="px-4 py-3 text-text-secondary">{therapist.city || '—'}</td>
              <td className="px-4 py-3">
                <span
                  className={`rounded px-2 py-0.5 text-xs font-normal ${
                    therapist.subscriptionTier === 'premium'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-bg-alt text-text-secondary'
                  }`}
                >
                  {therapist.subscriptionTier === 'premium' ? t('therapists.filterTiers.premium') : t('therapists.filterTiers.free')}
                </span>
              </td>
              <td className="px-4 py-3">
                <span className={`text-xs font-normal ${therapist.isFeatured ? 'text-green-600' : 'text-text-secondary'}`}>
                  {therapist.isFeatured ? t('therapists.status.yes') : t('therapists.status.no')}
                </span>
              </td>
              <td className="px-4 py-3">
                <span className={`text-xs font-normal ${therapist.isActive ? 'text-green-600' : 'text-red-600'}`}>
                  {therapist.isActive ? t('therapists.status.active') : t('therapists.status.inactive')}
                </span>
              </td>
              <td className="px-4 py-3 text-text-secondary">{therapist.profileViews}</td>
              <td className="px-4 py-3">
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      startTransition(() => { void updateTherapist(therapist.id, { isFeatured: !therapist.isFeatured }); })
                    }
                    disabled={pending}
                  >
                    {therapist.isFeatured ? t('therapists.actions.unfeature') : t('therapists.actions.feature')}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      startTransition(() => { void updateTherapist(therapist.id, { isActive: !therapist.isActive }); })
                    }
                    disabled={pending}
                  >
                    {therapist.isActive ? t('therapists.actions.deactivate') : t('therapists.actions.activate')}
                  </Button>
                  {showTierActions && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        startTransition(() => {
                          void updateTherapist(therapist.id, {
                            subscriptionTier: therapist.subscriptionTier === 'premium' ? 'free' : 'premium',
                          });
                        })
                      }
                      disabled={pending}
                    >
                      {therapist.subscriptionTier === 'premium' ? t('therapists.actions.downgrade') : t('therapists.actions.upgrade')}
                    </Button>
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
