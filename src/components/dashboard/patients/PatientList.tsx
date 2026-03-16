'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import FormSelect from '@/components/ui/FormSelect';

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
      {/* Filter bar */}
      <div className="flex items-center gap-3">
        {/* Search input */}
        <div className="relative flex-1">
          <span className="pointer-events-none absolute inset-y-0 flex items-center ps-3.5 text-text-muted">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="form-field w-full ps-9"
          />
        </div>
        {/* Status filter */}
        <FormSelect
          value={status}
          onChange={setStatus}
          placeholder={t('filterAll')}
          options={[
            { value: 'active', label: t('filterActive') },
            { value: 'inactive', label: t('filterInactive') },
            { value: 'archived', label: t('filterArchived') },
          ]}
          className="w-44"
        />
      </div>

      {/* Result count below filter bar */}
      <p className="mb-1 text-xs text-text-muted">{total} {t('title').toLowerCase()}</p>

      {/* Empty state */}
      {!loading && patients.length === 0 && (
        <div className="card flex flex-col items-center justify-center px-6 py-14 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary-light text-primary">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <p className="font-normal text-text-primary">{t('noPatients')}</p>
          <p className="mt-1 text-sm text-text-muted">{t('noPatientsHint')}</p>
          <Link
            href="/dashboard/patients/new"
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-normal text-white transition-all hover:-translate-y-0.5 hover:bg-primary-dark"
          >
            + {t('addPatient')}
          </Link>
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
                <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                  <span className="text-xs text-text-muted">{t('age')}: {calcAge(p.dateOfBirth)} {t('years')}</span>
                  {typeBadge(p.type)}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
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
