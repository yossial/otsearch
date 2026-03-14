'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { TherapistProfilePublic } from '@/types';
import ProfileEditForm from '@/components/dashboard/ProfileEditForm';

interface Props {
  profile: TherapistProfilePublic;
  canEdit: boolean;
}

export default function EditableProfile({ profile, canEdit }: Props) {
  const t = useTranslations('dashboard');
  const [isEditing, setIsEditing] = useState(false);

  if (!canEdit) return null;

  return (
    <div className="mb-4">
      {!isEditing ? (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-normal text-text-secondary transition-colors hover:border-primary hover:text-primary"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            {t('editProfile')}
          </button>
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-surface p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-normal text-text-primary">{t('edit.title')}</h2>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="text-sm text-text-muted hover:text-text-primary"
            >
              ✕
            </button>
          </div>
          <ProfileEditForm
            profile={profile}
            onSaved={() => setIsEditing(false)}
          />
        </div>
      )}
    </div>
  );
}
