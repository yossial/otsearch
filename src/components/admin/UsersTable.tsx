'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string | null;
  status: string;
  therapistProfileId: string | null;
  subscriptionTier: string | null;
  createdAt: string;
}

export default function UsersTable({ users: initialUsers }: { users: AdminUser[] }) {
  const t = useTranslations('admin');
  const [users, setUsers] = useState(initialUsers);
  const [pending, startTransition] = useTransition();

  async function updateUser(id: string, patch: Record<string, unknown>) {
    const res = await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    if (!res.ok) {
      toast.error(t('toast.error'));
      return;
    }
    const updated = await res.json() as { status?: string; role?: string | null };
    setUsers((prev) =>
      prev.map((u) =>
        u.id === id
          ? { ...u, status: updated.status ?? u.status, role: updated.role ?? u.role }
          : u
      )
    );
    toast.success(t('toast.saved'));
  }

  function handleToggleStatus(user: AdminUser) {
    const newStatus = user.status === 'active' ? 'suspended' : 'active';
    startTransition(() => { void updateUser(user.id, { status: newStatus }); });
  }

  if (users.length === 0) {
    return <p className="text-sm text-text-secondary">{t('users.noResults')}</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead className="bg-bg-alt">
          <tr>
            <th className="px-4 py-3 text-start font-semibold text-text-secondary">{t('users.table.name')}</th>
            <th className="px-4 py-3 text-start font-semibold text-text-secondary">{t('users.table.email')}</th>
            <th className="px-4 py-3 text-start font-semibold text-text-secondary">{t('users.table.role')}</th>
            <th className="px-4 py-3 text-start font-semibold text-text-secondary">{t('users.table.status')}</th>
            <th className="px-4 py-3 text-start font-semibold text-text-secondary">{t('users.table.joined')}</th>
            <th className="px-4 py-3 text-start font-semibold text-text-secondary">{t('users.table.actions')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border bg-surface">
          {users.map((user) => (
            <tr key={user.id}>
              <td className="px-4 py-3 font-medium text-text-primary">{user.name}</td>
              <td className="px-4 py-3 text-text-secondary">{user.email}</td>
              <td className="px-4 py-3">
                <span className="rounded px-2 py-0.5 text-xs font-semibold bg-bg-alt text-text-secondary">
                  {user.role ?? t('users.filterRoles.unregistered')}
                </span>
              </td>
              <td className="px-4 py-3">
                <span
                  className={`rounded px-2 py-0.5 text-xs font-semibold ${
                    user.status === 'suspended'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-green-100 text-green-700'
                  }`}
                >
                  {user.status === 'suspended' ? t('users.filterStatuses.suspended') : t('users.filterStatuses.active')}
                </span>
              </td>
              <td className="px-4 py-3 text-text-secondary">
                {new Date(user.createdAt).toLocaleDateString()}
              </td>
              <td className="px-4 py-3">
                <button
                  onClick={() => handleToggleStatus(user)}
                  disabled={pending}
                  className={`rounded px-3 py-1 text-xs font-semibold transition-colors disabled:opacity-50 ${user.status === 'active' ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-700 hover:bg-green-100'}`}
                >
                  {user.status === 'active' ? t('users.actions.suspend') : t('users.actions.reactivate')}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
