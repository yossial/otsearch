/**
 * POST /api/admin/reminders
 *
 * Sends profile-completion reminder emails to therapists with incomplete profiles.
 * Auth: admin session OR X-Cron-Secret header matching CRON_SECRET env var.
 *
 * Called weekly by .github/workflows/send-reminders.yml
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { connectDB } from '@/lib/db';
import { TherapistProfile } from '@/lib/db/models/TherapistProfile';
import { User } from '@/lib/db/models/User';
import { sendEmail } from '@/lib/email/send';
import { profileIncompleteReminderHtml } from '@/lib/email/templates/profileIncompleteReminder';

export const dynamic = 'force-dynamic';

interface TherapistProfileLean {
  _id: string;
  displayName: { he: string; en?: string };
  bio: { he: string };
  photo: string | null;
  specialisations: string[];
  contactEmail: string;
  slug: string;
}

interface UserLean {
  email: string;
}

function getMissingItems(profile: TherapistProfileLean): string[] {
  const missing: string[] = [];
  if (!profile.photo) missing.push('תמונת פרופיל');
  if (!profile.bio?.he?.trim()) missing.push('תיאור אישי (אודות)');
  if (!profile.specialisations?.length) missing.push('תחומי התמחות');
  return missing;
}

export async function POST(req: NextRequest) {
  // Auth: admin session or cron secret header
  const cronSecret = process.env.CRON_SECRET;
  const headerSecret = req.headers.get('x-cron-secret');
  const isCron = cronSecret && headerSecret === cronSecret;

  if (!isCron) {
    const session = await auth();
    const role = (session?.user as { role?: string | null } | undefined)?.role;
    if (role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  await connectDB();

  // Find active therapists with incomplete profiles
  const profiles = await TherapistProfile.find({ isActive: true })
    .select('displayName bio photo specialisations contactEmail slug')
    .lean() as unknown as TherapistProfileLean[];

  const incomplete = profiles.filter((p) => getMissingItems(p).length > 0);

  const baseUrl = process.env.NEXTAUTH_URL ?? 'https://ot-connect.co.il';
  const results = { sent: 0, skipped: 0, errors: 0 };

  for (const profile of incomplete) {
    const missingItems = getMissingItems(profile);
    const name = profile.displayName.he || profile.displayName.en || 'מרפא/ה';

    // Prefer contactEmail on profile; fall back to User record
    let to = profile.contactEmail?.trim();
    if (!to) {
      const user = await User.findOne({ therapistProfileId: profile._id })
        .select('email')
        .lean() as UserLean | null;
      to = user?.email ?? '';
    }

    if (!to) {
      results.skipped++;
      continue;
    }

    const ok = await sendEmail({
      to,
      subject: `${name}, הפרופיל שלך ב-Therapio עדיין לא מלא`,
      html: profileIncompleteReminderHtml({
        name,
        dashboardUrl: `${baseUrl}/he/dashboard/edit`,
        missingItems,
      }),
    });

    if (ok) results.sent++;
    else results.errors++;
  }

  return NextResponse.json({
    ok: true,
    total: incomplete.length,
    ...results,
  });
}
