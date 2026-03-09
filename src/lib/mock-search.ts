/**
 * Adapts the legacy MOCK_THERAPISTS data to TherapistProfilePublic format and provides
 * a filterable search function used as a fallback when the database is unavailable.
 */
import { MOCK_THERAPISTS } from './mock-data';
import type {
  TherapistProfilePublic,
  SearchResult,
  SearchParams,
  Specialisation,
  SessionType,
  InsuranceType,
} from '@/types';

// Mapping from mock data keys → typed enum values
const SPEC_MAP: Record<string, Specialisation> = {
  paediatrics: 'paediatrics',
  sensoryProcessing: 'sensory-processing',
  neuro: 'neurological',
  mentalHealth: 'mental-health',
  handTherapy: 'hand-therapy',
  geriatrics: 'geriatrics',
  vocational: 'vocational',
  ergonomic: 'ergonomic',
};

const SESSION_MAP: Record<string, SessionType> = {
  inPerson: 'in-person',
  telehealth: 'telehealth',
  homeVisit: 'home-visit',
};

function toPublic(m: (typeof MOCK_THERAPISTS)[number]): TherapistProfilePublic {
  const specs = m.specialties
    .map((s) => SPEC_MAP[s])
    .filter((s): s is Specialisation => !!s);

  const sessions = m.sessionTypes
    .map((s) => SESSION_MAP[s])
    .filter((s): s is SessionType => !!s);

  return {
    id: m.id,
    slug: m.slug,
    displayName: { he: m.name, ar: m.name, en: m.name },
    bio: { he: m.bio, ar: m.bio, en: m.bio },
    photo: m.photo,
    mohRegistrationNumber: '',
    specialisations: specs,
    languages: m.languages,
    location: {
      type: 'Point',
      coordinates: [34.7818, 32.0853],
      city: m.city,
      address: '',
    },
    sessionTypes: sessions,
    insuranceAccepted: m.insurance as InsuranceType[],
    feeRange: { min: m.feePerSession, max: m.feePerSession, currency: 'ILS' },
    contactEmail: '',
    contactPhone: m.phone,
    subscriptionTier: m.isPro ? 'premium' : 'free',
    isFeatured: m.isPro,
    isActive: true,
    isAcceptingPatients: m.acceptingNewPatients,
    profileViews: 0,
    ratingAvg: 0,
    ratingCount: 0,
    createdAt: new Date(0).toISOString(),
    gender: null,
  };
}

export function searchMockTherapists(params: SearchParams): SearchResult {
  let results = MOCK_THERAPISTS.map(toPublic);

  const q = params.q?.toLowerCase();
  if (q) {
    results = results.filter(
      (p) =>
        p.displayName.he.toLowerCase().includes(q) ||
        p.displayName.en.toLowerCase().includes(q) ||
        p.bio.he.toLowerCase().includes(q) ||
        p.location.city.toLowerCase().includes(q) ||
        p.specialisations.some((s) => s.toLowerCase().includes(q))
    );
  }

  const specs = params.specialisation
    ? (Array.isArray(params.specialisation) ? params.specialisation : [params.specialisation]) as Specialisation[]
    : [];
  if (specs.length) {
    results = results.filter((p) => specs.some((s) => p.specialisations.includes(s)));
  }

  const insurances = params.insurance
    ? (Array.isArray(params.insurance) ? params.insurance : [params.insurance]) as InsuranceType[]
    : [];
  if (insurances.length) {
    results = results.filter((p) => insurances.some((i) => p.insuranceAccepted.includes(i)));
  }

  const sessionTypes = params.sessionType
    ? (Array.isArray(params.sessionType) ? params.sessionType : [params.sessionType]) as SessionType[]
    : [];
  if (sessionTypes.length) {
    results = results.filter((p) => sessionTypes.some((s) => p.sessionTypes.includes(s)));
  }

  const languages = params.language
    ? Array.isArray(params.language) ? params.language : [params.language]
    : [];
  if (languages.length) {
    results = results.filter((p) => languages.some((l) => p.languages.includes(l)));
  }

  if (params.city) {
    results = results.filter((p) =>
      p.location.city.toLowerCase().includes(params.city!.toLowerCase())
    );
  }

  if (params.acceptingOnly) {
    results = results.filter((p) => p.isAcceptingPatients);
  }

  const page = params.page ?? 1;
  const limit = params.limit ?? 20;
  const total = results.length;
  const paged = results.slice((page - 1) * limit, page * limit);

  return { profiles: paged, total, page, totalPages: Math.ceil(total / limit) };
}

export function getMockTherapistBySlug(slug: string): TherapistProfilePublic | null {
  const m = MOCK_THERAPISTS.find((t) => t.slug === slug);
  return m ? toPublic(m) : null;
}
