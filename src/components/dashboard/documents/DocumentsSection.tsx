'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';

type PatientDocType = 'referral' | 'diagnosis' | 'prescription' | 'insurance' | 'consent' | 'scan' | 'other';

interface PatientDoc {
  _id: string;
  type: PatientDocType;
  title: string;
  fileUrl: string;
  mimeType: string;
  fileSize: number;
  note?: string;
  createdAt: string;
}

interface DocumentsSectionProps {
  patientId: string;
  locale: string;
}

const TYPE_COLORS: Record<PatientDocType, string> = {
  referral:     'bg-blue-50 text-blue-700',
  diagnosis:    'bg-purple-50 text-purple-700',
  prescription: 'bg-green-50 text-green-700',
  insurance:    'bg-amber-50 text-amber-700',
  consent:      'bg-teal-50 text-teal-700',
  scan:         'bg-gray-100 text-gray-700',
  other:        'bg-bg-alt text-text-muted',
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileIcon({ mimeType }: { mimeType: string }) {
  if (mimeType === 'application/pdf') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-red-500" aria-hidden="true">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="15" y2="17"/><line x1="9" y1="9" x2="12" y2="9"/>
      </svg>
    );
  }
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-sky-500" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
    </svg>
  );
}

export default function DocumentsSection({ patientId, locale }: DocumentsSectionProps) {
  const t = useTranslations('dashboard.documents');

  // ── List state ───────────────────────────────────────────────────────────────
  const [docs, setDocs] = useState<PatientDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ── Upload form state ────────────────────────────────────────────────────────
  const [formOpen, setFormOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [docType, setDocType] = useState<PatientDocType>('other');
  const [note, setNote] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [formError, setFormError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Fetch ─────────────────────────────────────────────────────────────────────
  const fetchDocs = useCallback(async () => {
    try {
      const res = await fetch(`/api/patient-docs?patientId=${patientId}`);
      if (!res.ok) throw new Error('Failed to fetch documents');
      const data = (await res.json()) as { docs: PatientDoc[] };
      setDocs(data.docs);
    } catch (err) {
      setListError(err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => { void fetchDocs(); }, [fetchDocs]);

  // ── Auto-fill title from filename ─────────────────────────────────────────────
  function handleFileChange(f: File | null) {
    setFile(f);
    if (f && !title) {
      // Strip extension and clean up filename as suggested title
      const name = f.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
      setTitle(name);
    }
  }

  // ── Upload ────────────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !title.trim()) return;
    setUploading(true);
    setUploadProgress(0);
    setFormError(null);

    // Simulate progress since fetch doesn't support it natively
    const progressInterval = setInterval(() => {
      setUploadProgress((p) => Math.min(p + 15, 85));
    }, 200);

    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('patientId', patientId);
      fd.append('title', title.trim());
      fd.append('type', docType);
      if (note.trim()) fd.append('note', note.trim());

      const res = await fetch('/api/patient-docs', { method: 'POST', body: fd });
      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? 'Upload failed');
      }

      const data = (await res.json()) as { doc: PatientDoc };
      setDocs((prev) => [data.doc, ...prev]);
      setFile(null);
      setTitle('');
      setNote('');
      setDocType('other');
      setFormOpen(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      clearInterval(progressInterval);
      setFormError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }

  // ── Delete ────────────────────────────────────────────────────────────────────
  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/patient-docs/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      setDocs((prev) => prev.filter((d) => d._id !== id));
    } catch {
      // silently fail
    } finally {
      setDeletingId(null);
    }
  }

  const docTypeOptions: PatientDocType[] = [
    'referral', 'diagnosis', 'prescription', 'insurance', 'consent', 'scan', 'other',
  ];

  return (
    <div className="space-y-4">
      {/* ── Upload button / form ──────────────────────────────────────────────── */}
      {!formOpen ? (
        <div className="flex justify-end">
          <button
            onClick={() => setFormOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-normal text-white hover:bg-primary-hover"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            {t('upload')}
          </button>
        </div>
      ) : (
        <form
          onSubmit={(e) => { void handleSubmit(e); }}
          className="rounded-lg border border-primary/20 bg-primary-light p-4"
        >
          <h3 className="mb-3 text-sm font-normal text-text-primary">{t('upload')}</h3>
          {formError && <p className="mb-2 text-xs text-red-600">{formError}</p>}

          <div className="space-y-3">
            {/* File picker */}
            <div>
              <label className="form-label">
                {t('fileLabel')} <span className="text-red-500">*</span>
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/heic,application/pdf"
                required
                onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
                className="form-field w-full text-sm file:me-3 file:rounded file:border-0 file:bg-primary file:px-2.5 file:py-1 file:text-xs file:font-normal file:text-white file:hover:bg-primary-hover"
              />
              <p className="mt-1 text-xs text-text-muted">{t('fileHint')}</p>
            </div>

            {/* Title */}
            <div>
              <label className="form-label">
                {t('titleLabel')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="form-field w-full"
              />
            </div>

            {/* Type */}
            <div>
              <label className="form-label">{t('typeLabel')}</label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value as PatientDocType)}
                className="form-field w-full"
              >
                {docTypeOptions.map((opt) => (
                  <option key={opt} value={opt}>{t(`type_${opt}`)}</option>
                ))}
              </select>
            </div>

            {/* Note */}
            <div>
              <label className="form-label">{t('noteLabel')}</label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="form-field w-full"
              />
            </div>
          </div>

          {/* Progress bar */}
          {uploading && (
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-border">
              <div
                className="h-full rounded-full bg-accent transition-all duration-200"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}

          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => { setFormOpen(false); setFile(null); setTitle(''); setNote(''); setFormError(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
              className="rounded-lg border border-border px-3 py-1.5 text-sm font-normal text-text-secondary hover:text-primary"
            >
              ✕
            </button>
            <button
              type="submit"
              disabled={uploading || !file || !title.trim()}
              className="rounded-lg bg-primary px-4 py-1.5 text-sm font-normal text-white hover:bg-primary-hover disabled:opacity-50"
            >
              {uploading ? `${uploadProgress}%` : t('save')}
            </button>
          </div>
        </form>
      )}

      {/* ── Document list ─────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg bg-bg-alt" />
          ))}
        </div>
      ) : listError ? (
        <p className="py-6 text-center text-sm text-red-600">{listError}</p>
      ) : docs.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-bg-alt">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-text-muted" aria-hidden="true">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
            </svg>
          </div>
          <p className="text-sm text-text-muted">{t('noDocs')}</p>
        </div>
      ) : (
        <div className="divide-y divide-border rounded-lg border border-border">
          {docs.map((doc) => (
            <div key={doc._id} className="flex items-center gap-3 px-4 py-3">
              <FileIcon mimeType={doc.mimeType} />

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-normal ${TYPE_COLORS[doc.type]}`}>
                    {t(`type_${doc.type}`)}
                  </span>
                  <span className="truncate text-sm font-normal text-text-primary">{doc.title}</span>
                </div>
                <p className="mt-0.5 text-xs text-text-muted">
                  {formatBytes(doc.fileSize)} &middot; {new Date(doc.createdAt).toLocaleDateString(locale)}
                  {doc.note && <span> &middot; {doc.note}</span>}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-1.5">
                <a
                  href={`/api/patient-docs/${doc._id}/file`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg border border-border px-2.5 py-1 text-xs text-text-secondary transition-colors hover:border-primary/30 hover:text-primary"
                >
                  {t('view')}
                </a>
                <button
                  onClick={() => { void handleDelete(doc._id); }}
                  disabled={deletingId === doc._id}
                  className="rounded-lg border border-border px-2.5 py-1 text-xs text-text-secondary transition-colors hover:border-red-300 hover:text-red-600 disabled:opacity-50"
                  aria-label={t('delete')}
                >
                  {deletingId === doc._id ? '…' : '✕'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
