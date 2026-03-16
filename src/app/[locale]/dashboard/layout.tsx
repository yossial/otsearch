import { redirect } from 'next/navigation';
import { getLocale } from 'next-intl/server';
import { auth } from '@/lib/auth/auth';
import { connectDB } from '@/lib/db';
import { User } from '@/lib/db/models/User';
import { getTherapistProfileById } from '@/lib/db/therapists';
import DashboardShell from '@/components/dashboard/DashboardShell';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const locale = await getLocale();

  if (!session?.user) redirect(`/${locale}/auth/login`);

  let therapistProfileId = (session.user as { therapistProfileId?: string | null })
    .therapistProfileId;

  if (!therapistProfileId) {
    await connectDB();
    const dbUser = await User.findById(session.user.id).select('therapistProfileId').lean();
    if (!dbUser?.therapistProfileId) redirect(`/${locale}/onboarding/therapist`);
    therapistProfileId = String(dbUser.therapistProfileId);
  }

  const profile = await getTherapistProfileById(therapistProfileId);
  const isPremium = profile?.subscriptionTier === 'premium';

  const name = session.user.name ?? session.user.email ?? '';
  const profileName = profile
    ? (profile.displayName[locale as keyof typeof profile.displayName] ?? profile.displayName.he)
    : null;

  const heroData = profile
    ? {
        name: profileName ?? name,
        photo: profile.photo ?? null,
        isActive: profile.isActive,
        isAcceptingPatients: profile.isAcceptingPatients,
        isPremium,
        slug: profile.slug ?? null,
        profileViews: profile.profileViews,
        specialisationsCount: profile.specialisations.length,
        sessionTypesCount: profile.sessionTypes.length,
        insuranceCount: profile.insuranceAccepted.length,
        ratingAvg: profile.ratingAvg,
        ratingCount: profile.ratingCount,
      }
    : null;

  return (
    <DashboardShell heroData={heroData} isPremium={isPremium}>
      {children}
    </DashboardShell>
  );
}
