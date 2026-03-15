'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

interface Patient {
  _id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  type: 'direct' | 'child';
  insurance?: string;
  status: 'active' | 'inactive' | 'archived';
}

interface PatientListProps {
  initialPatients: Patient[];
  initialTotal: number;
}

function calcAge(dob: string): number {
  return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

export default function PatientList({ initialPatients, initialTotal }: PatientListProps) {
  const t = useTranslations('dashboard.patients');

  const [patients, setPatients] = useState<Patient[]>(initialPatients);
  const [total, setTotal] = useState(initialTotal);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const debouncedSearch = useDebounce(search, 300);

  const fetchPatients = useCallback(async (searchVal: string, statusVal: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchVal) params.set('search', searchVal);
      if (statusVal) params.set('status', statusVal);
      const res = await fetch(`/api/patients?${params.toString()}`);
      if (res.ok) {
        const data = await res.json() as { patients: Patient[]; total: number };
        setPatients(data.patients);
        setTotal(data.total);
      }
    } catch {
      // silently fail — keep last results
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debouncedSearch !== '' || status !== '') {
      void fetchPatients(debouncedSearch, status);
    } else {
      setPatients(initialPatients);
      setTotal(initialTotal);
    }
  }, [debouncedSearch, status, fetchPatients, initialPatients, initialTotal]);

  const statusBadge = (s: Patient['status']) => {
    const map: Record<Patient['status'], string> = {
      active: 'bg-green-50 text-green-700',
      inactive: 'bg-yellow-50 text-yellow-700',
      archived: 'bg-bg-alt text-text-muted',
    };
    const labels: Record<Patient['status'], string> = {
      active: t('statusActive'),
      inactive: t('statusInactive'),
      archived: t('statusArchived'),
    };
    return (
      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-normal ${map[s]}`}>
        {labels[s]}
      </span>
    );
  };

  const typeBadge = (type: Patient['type']) => (
    <span className="inline-block rounded-full bg-primary-light px-2 py-0.5 text-xs font-normal text-primary">
      {type === 'child' ? t('typeChild') : t('typeDirect')}
    </span>
  );

  return (
    <div className="space-y-4">
      {/* Search + filter */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('searchPlaceholder')}
          className="flex-1 rounded border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:outline-none"
        >
          <option value="">{t('filterAll')}</option>
          <option value="active">{t('filterActive')}</option>
          <option value="inactive">{t('filterInactive')}</option>
          <option value="archived">{t('filterArchived')}</option>
        </select>
      </div>

      {/* Results count */}
      {!loading && (
        <p className="text-sm text-text-muted">{total} {t('title').toLowerCase()}</p>
      )}
      {loading && (
        <p className="text-sm text-text-muted">{t('searchPlaceholder').replace('...', '')}…</p>
      )}

      {/* Empty state */}
      {!loading && patients.length === 0 && (
        <div className="card p-10 text-center">
          <p className="text-text-muted">{t('noPatients')}</p>
        </div>
      )}

      {/* Patient cards */}
      <div className="space-y-2">
        {patients.map((p) => (
          <Link
            key={p._id}
            href={`/dashboard/patients/${p._id}`}
            className="card flex items-center justify-between gap-4 p-4 transition-colors hover:border-primary/30 hover:bg-primary-light/30"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-light text-sm font-normal text-primary">
                {p.firstName.charAt(0)}{p.lastName.charAt(0)}
              </div>
              <div>
                <p className="font-normal text-text-primary">
                  {p.firstName} {p.lastName}
                </p>
                <p className="text-xs text-text-muted">
                  {t('age')}: {calcAge(p.dateOfBirth)} {t('years')}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {typeBadge(p.type)}
              {p.insurance && p.insurance !== 'none' && (
                <span className="rounded-full bg-bg-alt px-2 py-0.5 text-xs text-text-muted">
                  {t(`insurance${p.insurance.charAt(0).toUpperCase() + p.insurance.slice(1)}` as 'insuranceClalit')}
                </span>
              )}
              {statusBadge(p.status)}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
