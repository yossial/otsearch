'use client';

import { useEffect } from 'react';
import { useBreadcrumb } from './BreadcrumbContext';

/**
 * Renders nothing — registers a dynamic segment label in the breadcrumb context.
 * Place this inside any Server Component page that has a dynamic route segment.
 *
 * @example
 * <BreadcrumbLabel segment={patientId} label={`${patient.firstName} ${patient.lastName}`} />
 */
export default function BreadcrumbLabel({
  segment,
  label,
}: {
  segment: string;
  label: string;
}) {
  const { setLabel } = useBreadcrumb();

  useEffect(() => {
    setLabel(segment, label);
  }, [segment, label, setLabel]);

  return null;
}
