'use client';

import { useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import FormSelect from '@/components/ui/FormSelect';
import RadioGroup from '@/components/ui/RadioGroup';

type PatientType = 'direct' | 'child';
type PatientGender = 'male' | 'female' | 'other' | 'unspecified';
type InsuranceFund = 'clalit' | 'maccabi' | 'meuhedet' | 'leumit' | 'none';
type ParentRelationship = 'mother' | 'father' | 'guardian';

interface PatientFormData {
  type: PatientType;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: PatientGender;
  phone: string;
  email: string;
  insurance: InsuranceFund | '';
  referralSource: string;
  diagnosisNotes: string;
  consentGiven: boolean;
  consentDate: string;
  consentSignedBy: string;
  parentFirstName: string;
  parentLastName: string;
  parentPhone: string;
  parentEmail: string;
  parentRelationship: ParentRelationship | '';
}

interface PatientFormProps {
  /** If provided, form is in edit mode */
  patientId?: string;
  initialData?: Partial<PatientFormData>;
  /** True when this therapist has no patients yet — triggers confetti on creation */
  isFirstPatient?: boolean;
}

const TODAY = new Date().toISOString().split('T')[0]!;

export default function PatientForm({ patientId, initialData, isFirstPatient }: PatientFormProps) {
  const t = useTranslations('dashboard.patients');
  const router = useRouter();

  const [data, setData] = useState<PatientFormData>({
    type: initialData?.type ?? 'direct',
    firstName: initialData?.firstName ?? '',
    lastName: initialData?.lastName ?? '',
    dateOfBirth: initialData?.dateOfBirth ?? '',
    gender: initialData?.gender ?? 'unspecified',
    phone: initialData?.phone ?? '',
    email: initialData?.email ?? '',
    insurance: initialData?.insurance ?? '',
    referralSource: initialData?.referralSource ?? '',
    diagnosisNotes: initialData?.diagnosisNotes ?? '',
    consentGiven: initialData?.consentGiven ?? false,
    consentDate: initialData?.consentDate ?? TODAY,
    consentSignedBy: initialData?.consentSignedBy ?? '',
    parentFirstName: initialData?.parentFirstName ?? '',
    parentLastName: initialData?.parentLastName ?? '',
    parentPhone: initialData?.parentPhone ?? '',
    parentEmail: initialData?.parentEmail ?? '',
    parentRelationship: initialData?.parentRelationship ?? '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof PatientFormData, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  function set<K extends keyof PatientFormData>(key: K, value: PatientFormData[K]) {
    setData((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function validate(): boolean {
    const errs: Partial<Record<keyof PatientFormData, string>> = {};
    if (!data.firstName.trim()) errs.firstName = t('firstName') + ' required';
    if (!data.lastName.trim()) errs.lastName = t('lastName') + ' required';
    if (!data.dateOfBirth) errs.dateOfBirth = t('dateOfBirth') + ' required';
    if (!data.consentGiven) errs.consentGiven = t('consentRequired');
    if (!data.consentSignedBy.trim()) errs.consentSignedBy = t('consentSignedBy') + ' required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setServerError('');

    const payload: Record<string, unknown> = {
      type: data.type,
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      dateOfBirth: data.dateOfBirth,
      gender: data.gender,
      insurance: data.insurance || undefined,
      referralSource: data.referralSource.trim() || undefined,
      diagnosisNotes: data.diagnosisNotes.trim() || undefined,
      consentGiven: data.consentGiven,
      consentDate: data.consentDate,
      consentSignedBy: data.consentSignedBy.trim(),
    };

    if (data.type === 'child') {
      payload.parentInfo = {
        firstName: data.parentFirstName.trim() || undefined,
        lastName: data.parentLastName.trim() || undefined,
        phone: data.parentPhone.trim() || undefined,
        email: data.parentEmail.trim() || undefined,
        relationship: data.parentRelationship || undefined,
      };
    } else {
      payload.contactInfo = {
        phone: data.phone.trim() || undefined,
        email: data.email.trim() || undefined,
      };
    }

    try {
      const url = patientId ? `/api/patients/${patientId}` : '/api/patients';
      const method = patientId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json() as { error?: string };
        setServerError(body.error ?? 'Error saving patient');
        return;
      }

      const milestone = !patientId && isFirstPatient ? '?milestone=first_patient' : '';
      router.push(`/dashboard/patients${milestone}`);
    } catch {
      setServerError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} noValidate className="space-y-6">
      {/* Patient type */}
      <div className="card p-6">
        <h2 className="mb-4 text-base font-normal text-text-primary">{t('patientType')}</h2>
        <RadioGroup
          value={data.type}
          onChange={(v) => set('type', v as PatientType)}
          options={[
            { value: 'direct', label: t('typeDirect') },
            { value: 'child', label: t('typeChild') },
          ]}
        />
      </div>

      {/* Basic info */}
      <div className="card p-6">
        <h2 className="mb-4 text-base font-normal text-text-primary">{t('patientInfo')}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="form-label">{t('firstName')} *</label>
            <input
              type="text"
              value={data.firstName}
              onChange={(e) => set('firstName', e.target.value)}
              className="form-field w-full"
            />
            {errors.firstName && <p className="mt-1 text-xs text-red-600">{errors.firstName}</p>}
          </div>
          <div>
            <label className="form-label">{t('lastName')} *</label>
            <input
              type="text"
              value={data.lastName}
              onChange={(e) => set('lastName', e.target.value)}
              className="form-field w-full"
            />
            {errors.lastName && <p className="mt-1 text-xs text-red-600">{errors.lastName}</p>}
          </div>
          <div>
            <label className="form-label">{t('dateOfBirth')} *</label>
            <input
              type="date"
              value={data.dateOfBirth}
              onChange={(e) => set('dateOfBirth', e.target.value)}
              className="form-field w-full"
            />
            {errors.dateOfBirth && <p className="mt-1 text-xs text-red-600">{errors.dateOfBirth}</p>}
          </div>
          <div>
            <label className="form-label">{t('gender')}</label>
            <FormSelect
              value={data.gender}
              onChange={(v) => set('gender', v as PatientGender)}
              options={[
                { value: 'male', label: t('genderMale') },
                { value: 'female', label: t('genderFemale') },
                { value: 'other', label: t('genderOther') },
                { value: 'unspecified', label: t('genderUnspecified') },
              ]}
            />
          </div>
          <div>
            <label className="form-label">{t('insuranceLabel')}</label>
            <FormSelect
              value={data.insurance}
              onChange={(v) => set('insurance', v as InsuranceFund | '')}
              placeholder="—"
              options={[
                { value: 'clalit', label: t('insuranceClalit') },
                { value: 'maccabi', label: t('insuranceMaccabi') },
                { value: 'meuhedet', label: t('insuranceMeuhedet') },
                { value: 'leumit', label: t('insuranceLeumit') },
                { value: 'none', label: t('insuranceNone') },
              ]}
            />
          </div>
          <div>
            <label className="form-label">{t('referralSource')}</label>
            <input
              type="text"
              value={data.referralSource}
              onChange={(e) => set('referralSource', e.target.value)}
              className="form-field w-full"
            />
          </div>
        </div>
      </div>

      {/* Contact / parent info */}
      {data.type === 'direct' ? (
        <div className="card p-6">
          <h2 className="mb-4 text-base font-normal text-text-primary">{t('contactInfo')}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="form-label">{t('phone')}</label>
              <input
                type="tel"
                value={data.phone}
                onChange={(e) => set('phone', e.target.value)}
                className="form-field w-full"
              />
            </div>
            <div>
              <label className="form-label">{t('email')}</label>
              <input
                type="email"
                value={data.email}
                onChange={(e) => set('email', e.target.value)}
                className="form-field w-full"
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="card p-6">
          <h2 className="mb-4 text-base font-normal text-text-primary">{t('parentInfo')}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="form-label">{t('firstName')}</label>
              <input
                type="text"
                value={data.parentFirstName}
                onChange={(e) => set('parentFirstName', e.target.value)}
                className="form-field w-full"
              />
            </div>
            <div>
              <label className="form-label">{t('lastName')}</label>
              <input
                type="text"
                value={data.parentLastName}
                onChange={(e) => set('parentLastName', e.target.value)}
                className="form-field w-full"
              />
            </div>
            <div>
              <label className="form-label">{t('phone')}</label>
              <input
                type="tel"
                value={data.parentPhone}
                onChange={(e) => set('parentPhone', e.target.value)}
                className="form-field w-full"
              />
            </div>
            <div>
              <label className="form-label">{t('email')}</label>
              <input
                type="email"
                value={data.parentEmail}
                onChange={(e) => set('parentEmail', e.target.value)}
                className="form-field w-full"
              />
            </div>
            <div>
              <label className="form-label">{t('relationship')}</label>
              <FormSelect
                value={data.parentRelationship}
                onChange={(v) => set('parentRelationship', v as ParentRelationship | '')}
                placeholder="—"
                options={[
                  { value: 'mother', label: t('relationshipMother') },
                  { value: 'father', label: t('relationshipFather') },
                  { value: 'guardian', label: t('relationshipGuardian') },
                ]}
              />
            </div>
          </div>
        </div>
      )}

      {/* Diagnosis notes */}
      <div className="card p-6">
        <label className="form-label">{t('diagnosisNotes')}</label>
        <textarea
          value={data.diagnosisNotes}
          onChange={(e) => set('diagnosisNotes', e.target.value)}
          rows={4}
          className="form-field w-full"
        />
      </div>

      {/* Consent section */}
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6">
        <h2 className="mb-1 text-base font-normal text-amber-900">{t('consentSection')}</h2>
        <p className="mb-4 text-sm text-amber-700">{t('consentRequired')}</p>

        <div className="space-y-4">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={data.consentGiven}
              onChange={(e) => set('consentGiven', e.target.checked)}
              className="form-checkbox mt-0.5"
              data-testid="consent-checkbox"
            />
            <span className="text-sm font-normal text-amber-900">{t('consentGiven')} *</span>
          </label>
          {errors.consentGiven && <p className="text-xs text-red-600">{errors.consentGiven}</p>}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm text-amber-800">{t('consentDate')}</label>
              <input
                type="date"
                value={data.consentDate}
                onChange={(e) => set('consentDate', e.target.value)}
                className="w-full rounded border border-amber-200 bg-white px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-amber-400"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-amber-800">{t('consentSignedBy')} *</label>
              <input
                type="text"
                value={data.consentSignedBy}
                onChange={(e) => set('consentSignedBy', e.target.value)}
                className="w-full rounded border border-amber-200 bg-white px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-amber-400"
              />
              {errors.consentSignedBy && (
                <p className="mt-1 text-xs text-red-600">{errors.consentSignedBy}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {serverError && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{serverError}</div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-normal tracking-wide text-white transition-all hover:-translate-y-0.5 hover:bg-primary-dark disabled:opacity-60"
      >
        {submitting ? '...' : t('savePatient')}
      </button>
    </form>
  );
}
