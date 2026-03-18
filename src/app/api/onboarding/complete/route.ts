import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { connectDB } from '@/lib/db';
import { User } from '@/lib/db/models/User';
import { TherapistProfile } from '@/lib/db/models/TherapistProfile';
import { nextSeq } from '@/lib/db/models/Counter';
import { verifyTherapist } from '@/lib/gov/govApi';
import { sendEmail } from '@/lib/email/send';
import { welcomeTherapistHtml } from '@/lib/email/templates/welcomeTherapist';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json() as Record<string, unknown>;

    const PHONE_RE = /^05[0-9]\d{7}$/;
    if (body.contactPhone && !PHONE_RE.test(String(body.contactPhone).replace(/\D/g, ''))) {
      return NextResponse.json({ error: 'invalidPhone' }, { status: 400 });
    }

    // 1. Extract and Validate MOH License
    const mohNumber = (body.mohRegistrationNumber as string | undefined)?.trim() ?? '';
    if (!mohNumber) {
      return NextResponse.json({ error: 'MOH licence number is required' }, { status: 400 });
    }

    // AWAIT the verification result
    const verification = await verifyTherapist(mohNumber);

    // If verification fails or returns null, block the onboarding
    if (!verification) {
      return NextResponse.json({ 
        error: 'Invalid MOH licence number or practitioner not found in occupational therapy registry' 
      }, { status: 400 });
    }

    // Optional: You could even enforce that the status must be "בתוקף" (Active)
    if (!verification.status.includes('בתוקף') || !verification.statusDetail.includes('מורשה לעסוק במקצוע')) {
      return NextResponse.json({ 
        error: `Your licence status is listed as: ${verification.status}. Please contact the Ministry of Health.` 
      }, { status: 400 });
    }

    await connectDB();

    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const existingProfileId = (session.user as { therapistProfileId?: string | null }).therapistProfileId;
    let profileId: string;

    if (existingProfileId) {
      profileId = existingProfileId;
    } else {
      // Build full name from first + last name submitted during onboarding
      const firstName = (body.firstName as string | undefined)?.trim() ?? '';
      const lastName = (body.lastName as string | undefined)?.trim() ?? '';
      const fullName = [firstName, lastName].filter(Boolean).join(' ') || verification.fullName || user.name || 'profile';

      // Use atomic incremental ID as slug — avoids encoding issues with Hebrew names
      const profileNum = await nextSeq('therapistProfile');
      const slug = String(profileNum);

      const bioData = (body.bio as { he?: string; ar?: string; en?: string } | undefined) ?? {};
      const locationData = (body.location as { city?: string; address?: string, coordinates?: [number, number] } | undefined) ?? {};
      const phone = (body.contactPhone as string | undefined)?.trim() ?? '';

      const photo = (body.photo as string | undefined)?.trim() || null;

      const profileDoc = new TherapistProfile({
        slug,
        displayName: {
          he: fullName,
          ar: fullName,
          en: fullName,
        },
        bio: {
          he: bioData.he?.trim() ?? '',
          ar: bioData.ar?.trim() ?? '',
          en: bioData.en?.trim() ?? '',
        },
        mohRegistrationNumber: mohNumber,
        mohStatus: verification.status, // Good idea to store the verified status
        specialisations: (body.specialisations as string[] | undefined) ?? [],
        specialisationsOther: (body.specialisationsOther as string[] | undefined) ?? [],
        sessionTypesOther: (body.sessionTypesOther as string[] | undefined) ?? [],
        languages: (body.languages as string[] | undefined) ?? ['he'],
        location: {
          type: 'Point',
          coordinates: locationData.coordinates ?? [34.7818, 32.0853],
          city: locationData.city?.trim() ?? '',
          address: locationData.address?.trim() ?? '',
        },
        sessionTypes: (body.sessionTypes as string[] | undefined) ?? [],
        insuranceAccepted: (body.insuranceAccepted as string[] | undefined) ?? [],
        contactEmail: (body.contactEmail as string | undefined)?.trim() ?? (user.email as string),
        contactPhone: phone,
        isAcceptingPatients: (body.isAcceptingPatients as boolean | undefined) ?? false,
        feeRange: (body.feeRange as { min: number; max: number; currency: string } | null | undefined) ?? null,
        gender: (body.gender as 'male' | 'female' | null | undefined) ?? null,
        photo,
        userId: user._id,
        subscriptionTier: 'free',
        isActive: !!(locationData.city?.trim()),
      });

      await profileDoc.save({ validateBeforeSave: false });

      profileId = String(profileDoc._id);
      user.role = 'therapist';
      user.name = fullName;
      user.therapistProfileId = profileDoc._id;
      if (photo) user.image = photo;
      await user.save();

      // Send welcome email (fire-and-forget — don't block the response)
      const baseUrl = process.env.NEXTAUTH_URL ?? 'https://ot-connect.co.il';
      const therapistDisplayName = fullName;
      void sendEmail({
        to: user.email as string,
        subject: `ברוך הבא ל-Therapio, ${therapistDisplayName}! 🎉`,
        html: welcomeTherapistHtml({
          name: therapistDisplayName,
          dashboardUrl: `${baseUrl}/he/dashboard`,
          profileUrl: `${baseUrl}/he/profile/${slug}`,
        }),
      });
    }

    // Update existing profile logic
    if (existingProfileId) {
      const allowed = [
        'bio', 'displayName', 'specialisations', 'specialisationsOther', 'sessionTypesOther',
        'languages', 'sessionTypes', 'insuranceAccepted', 'feeRange', 'contactPhone',
        'contactEmail', 'isAcceptingPatients', 'location', 'mohRegistrationNumber', 'gender', 'photo',
      ];

      const update: Record<string, unknown> = {};
      for (const key of allowed) {
        if (key in body) update[key] = body[key];
      }

      // If license changed, re-verify inside the loop or block update if needed
      const locationCity = (update.location as { city?: string } | undefined)?.city?.trim();
      if (locationCity) update.isActive = true;

      if (Object.keys(update).length > 0) {
        await TherapistProfile.findByIdAndUpdate(
          profileId,
          { $set: update },
          { new: true, runValidators: true }
        );
      }
    }

    const photo = (body.photo as string | undefined)?.trim() || null;
    return NextResponse.json({
      ok: true,
      role: 'therapist',
      therapistProfileId: profileId,
      photo,
      verifiedName: verification.fullName
    });
  } catch (err) {
    console.error('[POST /api/onboarding/complete]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}