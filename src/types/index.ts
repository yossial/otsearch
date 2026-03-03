export type Locale = 'he' | 'ar' | 'en';

export type UserRole = 'therapist' | 'admin';

export type SubscriptionTier = 'free' | 'premium';

export type SubscriptionStatus = 'active' | 'cancelled' | 'past_due';

export type SubscriptionPlan = 'monthly' | 'annual';

export type InsuranceType = 'clalit' | 'maccabi' | 'meuhedet' | 'leumit' | 'private';

export type SessionType = 'in-person' | 'telehealth' | 'home-visit';

export type Specialisation =
  | 'paediatrics'
  | 'neurological'
  | 'mental-health'
  | 'hand-therapy'
  | 'geriatrics'
  | 'sensory-processing'
  | 'vocational'
  | 'ergonomic';

export type LeadActionType = 'view_contact' | 'click_phone' | 'click_email';

export interface MultilingualText {
  he: string;
  ar: string;
  en: string;
}

export interface GeoLocation {
  type: 'Point';
  coordinates: [number, number]; // [lng, lat]
  city: string;
  address: string;
}

export interface FeeRange {
  min: number;
  max: number;
  currency: 'ILS';
}

export interface TherapistProfilePublic {
  id: string;
  slug: string;
  displayName: MultilingualText;
  bio: MultilingualText;
  photo: string | null;
  mohRegistrationNumber: string;
  specialisations: Specialisation[];
  languages: string[];
  location: GeoLocation;
  sessionTypes: SessionType[];
  insuranceAccepted: InsuranceType[];
  feeRange: FeeRange | null;
  contactEmail: string;
  contactPhone: string;
  subscriptionTier: SubscriptionTier;
  isFeatured: boolean;
  isAcceptingPatients: boolean;
  profileViews: number;
  ratingAvg: number;
  ratingCount: number;
  createdAt: string;
  gender: 'male' | 'female' | null;
}

export interface ReviewPublic {
  id: string;
  reviewerName: string;
  rating: number;
  text: string;
  createdAt: string;
}

export interface ReviewsResult {
  reviews: ReviewPublic[];
  total: number;
  page: number;
  totalPages: number;
  ratingAvg: number;
  ratingCount: number;
}

export interface SearchParams {
  q?: string;
  specialisation?: Specialisation | Specialisation[];
  insurance?: InsuranceType | InsuranceType[];
  sessionType?: SessionType | SessionType[];
  language?: string | string[];
  city?: string;
  lat?: number;
  lng?: number;
  radius?: number;
  acceptingOnly?: boolean;
  sort?: 'relevance' | 'distance' | 'rating';
  page?: number;
  limit?: number;
}

export interface SearchResult {
  profiles: TherapistProfilePublic[];
  total: number;
  page: number;
  totalPages: number;
}
