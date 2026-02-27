/**
 * Adapts the legacy MOCK_OTS data to OTProfilePublic format and provides
 * a filterable search function used as a fallback when the database is unavailable.
 */
import { MOCK_OTS } from './mock-data';
import type {
  OTProfilePublic,
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

function toPublic(m: (typeof MOCK_OTS)[number]): OTProfilePublic {
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
    isAcceptingPatients: m.acceptingNewPatients,
    profileViews: 0,
    createdAt: new Date(0).toISOString(),
  };
}

export function searchMockOTs(params: SearchParams): SearchResult {
  let results = MOCK_OTS.map(toPublic);

  const q = params.q?.toLowerCase();
  if (q) {
    results = results.filter(
      (ot) =>
        ot.displayName.he.toLowerCase().includes(q) ||
        ot.displayName.en.toLowerCase().includes(q) ||
        ot.bio.he.toLowerCase().includes(q) ||
        ot.location.city.toLowerCase().includes(q) ||
        ot.specialisations.some((s) => s.toLowerCase().includes(q))
    );
  }

  const specs = params.specialisation
    ? (Array.isArray(params.specialisation) ? params.specialisation : [params.specialisation]) as Specialisation[]
    : [];
  if (specs.length) {
    results = results.filter((ot) => specs.some((s) => ot.specialisations.includes(s)));
  }

  const insurances = params.insurance
    ? (Array.isArray(params.insurance) ? params.insurance : [params.insurance]) as InsuranceType[]
    : [];
  if (insurances.length) {
    results = results.filter((ot) => insurances.some((i) => ot.insuranceAccepted.includes(i)));
  }

  const sessionTypes = params.sessionType
    ? (Array.isArray(params.sessionType) ? params.sessionType : [params.sessionType]) as SessionType[]
    : [];
  if (sessionTypes.length) {
    results = results.filter((ot) => sessionTypes.some((s) => ot.sessionTypes.includes(s)));
  }

  const languages = params.language
    ? Array.isArray(params.language) ? params.language : [params.language]
    : [];
  if (languages.length) {
    results = results.filter((ot) => languages.some((l) => ot.languages.includes(l)));
  }

  if (params.city) {
    results = results.filter((ot) =>
      ot.location.city.toLowerCase().includes(params.city!.toLowerCase())
    );
  }

  if (params.acceptingOnly) {
    results = results.filter((ot) => ot.isAcceptingPatients);
  }

  const page = params.page ?? 1;
  const limit = params.limit ?? 20;
  const total = results.length;
  const paged = results.slice((page - 1) * limit, page * limit);

  return { profiles: paged, total, page, totalPages: Math.ceil(total / limit) };
}

export function getMockOTBySlug(slug: string): OTProfilePublic | null {
  const m = MOCK_OTS.find((ot) => ot.slug === slug);
  return m ? toPublic(m) : null;
}
