'use client';

import dynamic from 'next/dynamic';
import type { TherapistProfilePublic } from '@/types';

const TherapistMap = dynamic(() => import('./TherapistMap'), { ssr: false });

interface TherapistMapWrapperProps {
  profiles: TherapistProfilePublic[];
  activeCity?: string;
}

export default function TherapistMapWrapper({ profiles, activeCity }: TherapistMapWrapperProps) {
  return <TherapistMap profiles={profiles} activeCity={activeCity} />;
}
