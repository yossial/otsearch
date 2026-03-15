'use client';

import { useRouter } from '@/i18n/navigation';
import GoalForm from './GoalForm';

export default function GoalFormWrapper({ patientId }: { patientId: string }) {
  const router = useRouter();
  return <GoalForm patientId={patientId} onCreated={() => router.refresh()} />;
}
