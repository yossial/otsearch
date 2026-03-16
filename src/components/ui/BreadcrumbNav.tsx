'use client';

import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useBreadcrumb } from './BreadcrumbContext';

// MongoDB ObjectId: 24 hex chars
const OBJECT_ID_RE = /^[0-9a-f]{24}$/i;
const isObjectId = (s: string) => OBJECT_ID_RE.test(s);

// Path components that are pure namespaces with no standalone page
const SKIP_SEGMENTS = new Set(['sessions']);

// Segment → breadcrumb translation key
const SEGMENT_KEY: Record<string, string> = {
  dashboard: 'dashboard',
  patients: 'patients',
  schedule: 'schedule',
  billing: 'billing',
  goals: 'goals',
  invoices: 'invoices',
  edit: 'edit',
  admin: 'admin',
  users: 'users',
  therapists: 'therapists',
  settings: 'settings',
};

export default function BreadcrumbNav() {
  const t = useTranslations('breadcrumb');
  const pathname = usePathname();
  const { dynamicLabels } = useBreadcrumb();

  // Strip locale prefix and split into segments
  const allParts = pathname.split('/').filter(Boolean);
  const segments = allParts.slice(1); // drop locale

  // No crumb needed at root of a section (e.g. /dashboard, /admin)
  if (segments.length <= 1) return null;

  type Crumb = { label: string; href: string };
  const crumbs: Crumb[] = [];
  let path = '';

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i]!;
    const prevSeg = i > 0 ? segments[i - 1] : null;
    path += `/${seg}`;

    if (SKIP_SEGMENTS.has(seg)) continue;

    let label: string;

    if (isObjectId(seg)) {
      // Dynamic segment: wait for context registration
      const resolved = dynamicLabels[seg];
      if (!resolved) continue; // skip until label is registered
      label = resolved;
    } else if (seg === 'new') {
      if (prevSeg === 'patients') label = t('newPatient');
      else if (prevSeg === 'billing') label = t('newInvoice');
      else label = t('newSession');
    } else {
      const key = SEGMENT_KEY[seg];
      label = key ? t(key) : seg;
    }

    crumbs.push({ label, href: path });
  }

  if (crumbs.length <= 1) return null;

  return (
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1">
      {crumbs.map((crumb, i) => {
        const isCurrent = i === crumbs.length - 1;
        return (
          <span key={crumb.href} className="flex items-center gap-1">
            {i > 0 && (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                className="shrink-0 text-border rtl:rotate-180"
              >
                <path d="m9 18 6-6-6-6" />
              </svg>
            )}
            {isCurrent ? (
              <span className="text-xs font-normal text-text-secondary">{crumb.label}</span>
            ) : (
              <Link
                href={crumb.href}
                className="text-xs text-text-muted transition-colors hover:text-primary"
              >
                {crumb.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
