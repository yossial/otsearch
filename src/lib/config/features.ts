/**
 * Feature flags — read from SiteSettings DB (server-side) with env var fallback for dev.
 * Server Components: call `getSettings()` directly.
 * This module provides the env-var-based fallback for compatibility.
 */
export const FEATURES = {
  /** Show fee/price range on therapist cards and profile pages */
  showTherapistFee: process.env.NEXT_PUBLIC_SHOW_THERAPIST_FEE === 'true',
  /** Show star rating on therapist cards and profile pages */
  showTherapistRating: process.env.NEXT_PUBLIC_SHOW_THERAPIST_RATING === 'true',
} as const;
