import mongoose, { Schema, Document, Model } from 'mongoose';
import { connectDB } from '@/lib/db';
import { cache } from 'react';

export interface SiteSettingsDocument extends Document {
  key: 'global';
  // Feature flags
  showTherapistFee: boolean;
  showTherapistRating: boolean;
  showTherapistMap: boolean;
  featuredSectionEnabled: boolean;
  // Registration controls
  newRegistrationsEnabled: boolean;
  requireAdminApproval: boolean;
  // Platform info
  contactEmail: string;
  // Search defaults
  defaultSortOrder: 'relevance' | 'rating' | 'newest';
  // Subscription pricing (ILS)
  premiumMonthlyPrice: number;
  premiumAnnualPrice: number;
}

const SiteSettingsSchema = new Schema<SiteSettingsDocument>(
  {
    key: { type: String, default: 'global', unique: true },
    showTherapistFee: { type: Boolean, default: false },
    showTherapistRating: { type: Boolean, default: false },
    showTherapistMap: { type: Boolean, default: true },
    featuredSectionEnabled: { type: Boolean, default: true },
    newRegistrationsEnabled: { type: Boolean, default: true },
    requireAdminApproval: { type: Boolean, default: false },
    contactEmail: { type: String, default: 'support@therapio.co.il' },
    defaultSortOrder: { type: String, enum: ['relevance', 'rating', 'newest'], default: 'relevance' },
    premiumMonthlyPrice: { type: Number, default: 99 },
    premiumAnnualPrice: { type: Number, default: 899 },
  },
  { timestamps: true }
);

export const SiteSettings: Model<SiteSettingsDocument> =
  mongoose.models.SiteSettings ??
  mongoose.model<SiteSettingsDocument>('SiteSettings', SiteSettingsSchema);

/** Returns the singleton settings doc, creating it with defaults if it doesn't exist. */
export const getSettings = cache(async (): Promise<SiteSettingsDocument> => {
  await connectDB();
  const doc = await SiteSettings.findOneAndUpdate(
    { key: 'global' },
    { $setOnInsert: { key: 'global' } },
    { upsert: true, new: true }
  );
  return doc!;
});
