export type Locale = 'he' | 'ar' | 'en';

export type UserRole = 'ot' | 'patient' | 'admin';

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

export interface OTProfilePublic {
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
  createdAt: string;
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
  profiles: OTProfilePublic[];
  total: number;
  page: number;
  totalPages: number;
}
