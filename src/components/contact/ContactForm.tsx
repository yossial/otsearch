'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

interface Props {
  otSlug: string;
  otName: string;
  otEmail: string;
}

export default function ContactForm({ otSlug, otName, otEmail }: Props) {
  const t = useTranslations('contact');

  const [form, setForm] = useState({
    fromName: '',
    fromEmail: '',
    fromPhone: '',
    subject: 'newPatient',
    message: '',
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, otSlug, otName, otEmail }),
      });
      setStatus(res.ok ? 'success' : 'error');
    } catch {
      setStatus('error');
    }
  }

  if (status === 'success') {
    return (
      <div className="flex flex-col items-center gap-3 py-10 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600" aria-hidden="true">
            <path d="M20 6 9 17l-5-5"/>
          </svg>
        </div>
        <p className="text-base font-semibold text-text-primary">{t('success')}</p>
        <p className="text-sm text-text-secondary">{t('successDetail', { name: otName })}</p>
      </div>
    );
  }

  const inputClass = 'w-full rounded-lg border border-border bg-bg px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors';
  const labelClass = 'mb-1.5 block text-sm font-medium text-text-primary';

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="fromName" className={labelClass}>
            {t('nameLabel')} <span className="text-red-500">*</span>
          </label>
          <input
            id="fromName"
            type="text"
            required
            value={form.fromName}
            onChange={(e) => set('fromName', e.target.value)}
            placeholder={t('namePlaceholder')}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="fromEmail" className={labelClass}>
            {t('emailLabel')} <span className="text-red-500">*</span>
          </label>
          <input
            id="fromEmail"
            type="email"
            required
            value={form.fromEmail}
            onChange={(e) => set('fromEmail', e.target.value)}
            placeholder={t('emailPlaceholder')}
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="fromPhone" className={labelClass}>
            {t('phoneLabel')}
          </label>
          <input
            id="fromPhone"
            type="tel"
            value={form.fromPhone}
            onChange={(e) => set('fromPhone', e.target.value)}
            placeholder={t('phonePlaceholder')}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="subject" className={labelClass}>
            {t('subjectLabel')} <span className="text-red-500">*</span>
          </label>
          <select
            id="subject"
            required
            value={form.subject}
            onChange={(e) => set('subject', e.target.value)}
            className={cn(inputClass, 'cursor-pointer')}
          >
            <option value="newPatient">{t('subjects.newPatient')}</option>
            <option value="appointment">{t('subjects.appointment')}</option>
            <option value="insurance">{t('subjects.insurance')}</option>
            <option value="general">{t('subjects.general')}</option>
            <option value="other">{t('subjects.other')}</option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="message" className={labelClass}>
          {t('messageLabel')} <span className="text-red-500">*</span>
        </label>
        <textarea
          id="message"
          required
          rows={5}
          value={form.message}
          onChange={(e) => set('message', e.target.value)}
          placeholder={t('messagePlaceholder')}
          className={cn(inputClass, 'resize-none')}
        />
      </div>

      {status === 'error' && (
        <p className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-600">{t('error')}</p>
      )}

      <button
        type="submit"
        disabled={status === 'loading'}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:opacity-60"
      >
        {status === 'loading' ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin" aria-hidden="true">
            <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
          </svg>
        )}
        {status === 'loading' ? t('sending') : t('submit')}
      </button>
    </form>
  );
}
