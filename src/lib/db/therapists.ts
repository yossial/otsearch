/**
 * Data access layer for therapist profiles.
 * Used directly by Server Components and API route handlers.
 */
import type { SortOrder } from 'mongoose';
import { connectDB } from '@/lib/db';
import { TherapistProfile } from '@/lib/db/models/TherapistProfile';
import { Review } from '@/lib/db/models/Review';
import { computeRatingStats } from '@/lib/ratingStats';
import type { TherapistProfilePublic, SearchResult, ReviewsResult, ReviewPublic } from '@/types';

function toPublic(doc: Record<string, unknown>): TherapistProfilePublic {
  return {
    id: String(doc._id),
    slug: doc.slug as string,
    displayName: doc.displayName as TherapistProfilePublic['displayName'],
    bio: doc.bio as TherapistProfilePublic['bio'],
    photo: (doc.photo as string | null) ?? null,
    mohRegistrationNumber: doc.mohRegistrationNumber as string,
    specialisations: doc.specialisations as TherapistProfilePublic['specialisations'],
    languages: doc.languages as string[],
    location: doc.location as TherapistProfilePublic['location'],
    sessionTypes: doc.sessionTypes as TherapistProfilePublic['sessionTypes'],
    insuranceAccepted: doc.insuranceAccepted as TherapistProfilePublic['insuranceAccepted'],
    feeRange: (doc.feeRange as TherapistProfilePublic['feeRange']) ?? null,
    contactEmail: doc.contactEmail as string,
    contactPhone: doc.contactPhone as string,
    subscriptionTier: doc.subscriptionTier as TherapistProfilePublic['subscriptionTier'],
    isFeatured: doc.isFeatured as boolean,
    isAcceptingPatients: doc.isAcceptingPatients as boolean,
    profileViews: doc.profileViews as number,
    ratingAvg: (doc.ratingAvg as number) ?? 0,
    ratingCount: (doc.ratingCount as number) ?? 0,
    createdAt: (doc.createdAt as Date).toISOString(),
    gender: (doc.gender as 'male' | 'female' | null) ?? null,
  };
}

export interface TherapistSearchQuery {
  q?: string;
  specialisation?: string | string[];
  insurance?: string | string[];
  sessionType?: string | string[];
  language?: string | string[];
  city?: string;
  /** Geographic search — not yet implemented */
  lat?: number;
  lng?: number;
  radius?: number;
  acceptingOnly?: boolean;
  sort?: 'relevance' | 'distance' | 'rating';
  page?: number;
  limit?: number;
}

export async function searchTherapists(query: TherapistSearchQuery): Promise<SearchResult> {
  await connectDB();

  const {
    q,
    specialisation,
    insurance,
    sessionType,
    language,
    city,
    acceptingOnly,
    sort: sortBy,
    page = 1,
    limit = 20,
  } = query;

  const filter: Record<string, unknown> = { isActive: true };

  if (q?.trim()) {
    const regex = { $regex: q.trim(), $options: 'i' };
    filter.$or = [
      { 'displayName.he': regex },
      { 'displayName.en': regex },
      { 'displayName.ar': regex },
      { 'bio.he': regex },
      { 'bio.en': regex },
      { 'location.city': regex },
      { specialisations: regex },
      { insuranceAccepted: regex },
      { sessionTypes: regex },
      { languages: regex },
    ];
  }

  if (city?.trim()) {
    filter['location.city'] = { $regex: city.trim(), $options: 'i' };
  }

  const asArray = (v: string | string[] | undefined) =>
    v === undefined ? undefined : Array.isArray(v) ? v : [v];

  const specs = asArray(specialisation);
  const ins = asArray(insurance);
  const sessTypes = asArray(sessionType);
  const langs = asArray(language);

  if (specs?.length) filter.specialisations = { $in: specs };
  if (ins?.length) filter.insuranceAccepted = { $in: ins };
  if (sessTypes?.length) filter.sessionTypes = { $in: sessTypes };
  if (langs?.length) filter.languages = { $in: langs };
  if (acceptingOnly) filter.isAcceptingPatients = true;

  const skip = (page - 1) * limit;

  let sortOrder: Record<string, SortOrder | { $meta: string }>;
  if (q?.trim()) {
    sortOrder = { score: { $meta: 'textScore' }, isFeatured: -1 };
  } else if (sortBy === 'rating') {
    sortOrder = { ratingAvg: -1, ratingCount: -1, isFeatured: -1 };
  } else {
    sortOrder = { isFeatured: -1, subscriptionTier: -1, createdAt: -1 };
  }

  const [docs, total] = await Promise.all([
    TherapistProfile.find(filter).sort(sortOrder).skip(skip).limit(limit).lean(),
    TherapistProfile.countDocuments(filter),
  ]);

  return {
    profiles: docs.map((d) => toPublic(d as unknown as Record<string, unknown>)),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getTherapistBySlug(slug: string): Promise<TherapistProfilePublic | null> {
  await connectDB();
  const doc = await TherapistProfile.findOne({ slug, isActive: true }).lean();
  if (!doc) return null;
  return toPublic(doc as unknown as Record<string, unknown>);
}

/** Get therapist profile by MongoDB ID — used by dashboard (includes inactive profiles) */
export async function getTherapistProfileById(id: string): Promise<TherapistProfilePublic | null> {
  await connectDB();
  const doc = await TherapistProfile.findById(id).lean();
  if (!doc) return null;
  return toPublic(doc as unknown as Record<string, unknown>);
}

/** Fire-and-forget profile view counter increment */
export function incrementProfileViews(slug: string): void {
  connectDB()
    .then(() => TherapistProfile.updateOne({ slug }, { $inc: { profileViews: 1 } }))
    .catch(() => {});
}

/** Get paginated approved reviews for a therapist profile */
export async function getTherapistReviews(
  slug: string,
  { page = 1, limit = 10 }: { page?: number; limit?: number } = {}
): Promise<ReviewsResult | null> {
  await connectDB();
  const profile = await TherapistProfile.findOne({ slug, isActive: true }).lean();
  if (!profile) return null;

  const filter = { therapistProfileId: profile._id, isApproved: true };
  const skip = (page - 1) * limit;

  const [docs, total] = await Promise.all([
    Review.find(filter)
      .populate('userId', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Review.countDocuments(filter),
  ]);

  const reviews: ReviewPublic[] = docs.map((d) => ({
    id: String(d._id),
    reviewerName: (d.userId as { name?: string } | null)?.name ?? 'Anonymous',
    rating: d.rating,
    text: d.text,
    createdAt: (d.createdAt as Date).toISOString(),
  }));

  return {
    reviews,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    ratingAvg: (profile.ratingAvg as number) ?? 0,
    ratingCount: (profile.ratingCount as number) ?? 0,
  };
}

/** Fire-and-forget: recalculate and persist ratingAvg + ratingCount on TherapistProfile */
export function recalculateRatingStats(therapistProfileId: string): void {
  connectDB()
    .then(async () => {
      const result = await Review.aggregate<{ avg: number; count: number }>([
        {
          $match: {
            therapistProfileId: new (await import('mongoose')).default.Types.ObjectId(
              therapistProfileId
            ),
            isApproved: true,
          },
        },
        { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
      ]);
      const { ratingAvg, ratingCount } = computeRatingStats(result);
      await TherapistProfile.updateOne(
        { _id: therapistProfileId },
        { $set: { ratingAvg, ratingCount } }
      );
    })
    .catch(() => {});
}
