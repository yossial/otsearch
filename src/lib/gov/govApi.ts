const BASE_URL = 'https://data.gov.il/api/3/action/datastore_search';

const IDS = {
  CITIES: '5c78e9fa-c2e2-4771-93ff-7f400a12f7ba',
  STREETS: '9ad3862c-8391-4b2f-84a4-2d4c68625f4b',
  THERAPISTS: '5bb15386-db63-4d4c-8f44-68c4f811571d'
};

export interface IsraelCity {
  name: string;
  code: number;
  district?: string;       // English district ID: 'jerusalem' | 'north' | 'haifa' | 'center' | 'tel-aviv' | 'south'
  isIndependent?: boolean; // true = city/local council (not a small settlement in a regional council)
}

export interface Street { name: string; cityCode: number; }

// ── District mapping ────────────────────────────────────────────────────────
// Maps sub-district (נפה) names → district ID
// Excludes West Bank/PA sub-districts

const NAFAH_TO_DISTRICT: Record<string, string> = {
  'ירושלים':       'jerusalem',
  'עכו':           'north',
  'כנרת':          'north',
  'צפת':           'north',
  'עפולה':         'north',
  'גולן':          'north',
  'נצרת':          'north',
  'חיפה':          'haifa',
  'חדרה':          'haifa',
  'פתח תקווה':     'center',
  'רמלה':          'center',
  'רחובות':        'center',
  'השרון':         'center',
  'תל אביב':       'tel-aviv',
  'רמת גן':        'tel-aviv',
  'חולון':         'tel-aviv',
  'באר שבע':       'south',
  'אשקלון':        'south',
};

/** Ordered list of the 6 Israeli districts for UI display */
export const ISRAEL_DISTRICTS = [
  { id: 'jerusalem', nameHe: 'ירושלים', nameEn: 'Jerusalem',  nameAr: 'القدس',    nameRu: 'Иерусалим'   },
  { id: 'north',     nameHe: 'צפון',     nameEn: 'North',      nameAr: 'الشمال',   nameRu: 'Север'       },
  { id: 'haifa',     nameHe: 'חיפה',     nameEn: 'Haifa',      nameAr: 'حيفا',     nameRu: 'Хайфа'       },
  { id: 'center',    nameHe: 'מרכז',     nameEn: 'Center',     nameAr: 'الوسط',    nameRu: 'Центр'       },
  { id: 'tel-aviv',  nameHe: 'תל אביב',  nameEn: 'Tel Aviv',   nameAr: 'تل أبيب',  nameRu: 'Тель-Авив'   },
  { id: 'south',     nameHe: 'דרום',     nameEn: 'South',      nameAr: 'الجنوب',   nameRu: 'Юг'          },
] as const;

export type DistrictId = typeof ISRAEL_DISTRICTS[number]['id'];

// ── Cache ────────────────────────────────────────────────────────────────────
let cachedCities: IsraelCity[] | null = null;
let cityCacheExpiry = 0;
const ONE_DAY_MS = 86400 * 1000;

/**
 * 1. Get Cities — includes district and independence status
 */
export async function getIsraelCities(): Promise<IsraelCity[]> {
  const now = Date.now();
  if (cachedCities && now < cityCacheExpiry) return cachedCities;

  try {
    const res = await fetch(
      `${BASE_URL}?resource_id=${IDS.CITIES}&limit=1500&fields=סמל_ישוב,שם_ישוב,שם_נפה,סמל_מועצה_איזורית`,
      { next: { revalidate: 86400 } }
    );

    if (!res.ok) throw new Error(`Status ${res.status}`);
    const json = await res.json();

    type CKANCityRecord = Record<string, string>;
    const cities = (json.result.records as CKANCityRecord[])
      .map((r) => {
        const nafah = r['שם_נפה']?.trim() ?? '';
        const district = NAFAH_TO_DISTRICT[nafah];
        const councilCode = parseInt(r['סמל_מועצה_איזורית'], 10);
        return {
          name: r['שם_ישוב']?.trim() ?? '',
          code: parseInt(r['סמל_ישוב'], 10),
          district,
          isIndependent: councilCode === 0, // 0 = city/local council (not inside a regional council)
        };
      })
      .filter((c) => c.name && c.code > 0) // include all cities (West Bank too)
      .sort((a, b) => a.name.localeCompare(b.name, 'he'));

    cachedCities = cities;
    cityCacheExpiry = now + ONE_DAY_MS;
    return cities;
  } catch (err) {
    console.warn('[getIsraelCities] Using fallback:', err);
    return FALLBACK_CITIES;
  }
}

/**
 * Returns city names (as stored in DB) belonging to a district.
 * Used by the search layer for district-based filtering.
 */
export async function getCityNamesByDistrict(districtId: string): Promise<string[]> {
  const all = await getIsraelCities();
  return all.filter((c) => c.district === districtId).map((c) => c.name);
}

/**
 * 2. Get Streets based on City CODE
 */
export async function getStreetsByCityCode(cityCode: number): Promise<Street[]> {
  try {
    const filters = JSON.stringify({ "סמל_ישוב": cityCode });
    const limit = 5000;
    let allRecords: Record<string, string>[] = [];

    for (let page = 0; page < 3; page++) {
      const offset = page * limit;
      const url = `${BASE_URL}?resource_id=${IDS.STREETS}&filters=${encodeURIComponent(filters)}&limit=${limit}&offset=${offset}`;

      const res = await fetch(url, { next: { revalidate: 86400 } });
      if (!res.ok) throw new Error(`API error: ${res.status}`);

      const json = await res.json();
      const records = json.result.records as Record<string, string>[];
      allRecords = allRecords.concat(records);

      if (json.result.total <= (page + 1) * limit) break;
    }

    return allRecords
      .map((r) => ({
        name: r['שם_רחוב']?.trim() ?? '',
        cityCode: parseInt(r['סמל_ישוב'], 10)
      }))
      .filter((s: Street) => s.name !== '')
      .sort((a: Street, b: Street) => a.name.localeCompare(b.name, 'he'));
  } catch (err) {
    console.error('[getStreetsByCityCode] failed:', err);
    return [];
  }
}

/**
 * 3. Verify Occupational Therapist (Direct Ministry of Health API)
 */
export async function verifyTherapist(licenseNo: string | number) {
  try {
    const formattedLicense = licenseNo.toString().trim();

    const url = new URL('https://practitionersapi.health.gov.il/Practitioners/api/Practitioners/GetProfessionsLicense');
    url.searchParams.set('professionId', '14');
    url.searchParams.set('licenseNum', formattedLicense);
    url.searchParams.set('practitionerName', '');
    url.searchParams.set('certificate', '');
    url.searchParams.set('approval', '');
    url.searchParams.set('maxResults', '10');
    url.searchParams.set('pageNumber', '1');

    const res = await fetch(url.toString(), {
      cache: 'no-store',
      headers: { 'Accept': 'application/json' },
    });

    if (!res.ok) throw new Error(`Health API Status: ${res.status}`);

    const records = await res.json();
    if (!Array.isArray(records) || records.length === 0) return null;

    const record = records[0];
    const { licenseDetails, practitionerDetails } = record;

    return {
      fullName: `${practitionerDetails.firstName} ${practitionerDetails.lastName}`.trim(),
      licenseNumber: licenseDetails.licenseId,
      status: licenseDetails.status?.description ?? 'Unknown',
      statusDetail: licenseDetails.status?.definition ?? '',
      profession: "ריפוי בעיסוק",
      city: practitionerDetails.city?.description ?? '',
      issueDate: licenseDetails.issueDate,
    };
  } catch (err) {
    console.error('[verifyTherapist] Verification failed:', err);
    return null;
  }
}

const FALLBACK_CITIES: IsraelCity[] = [
  { name: 'אילת', code: 2600, district: 'south', isIndependent: true },
  { name: 'אשדוד', code: 70, district: 'south', isIndependent: true },
  { name: 'אשקלון', code: 7100, district: 'south', isIndependent: true },
  { name: 'באר שבע', code: 9000, district: 'south', isIndependent: true },
  { name: 'בית שמש', code: 3000, district: 'jerusalem', isIndependent: true },
  { name: 'בני ברק', code: 6200, district: 'tel-aviv', isIndependent: true },
  { name: 'בת ים', code: 6300, district: 'tel-aviv', isIndependent: true },
  { name: 'גבעתיים', code: 6400, district: 'tel-aviv', isIndependent: true },
  { name: 'הרצליה', code: 6600, district: 'center', isIndependent: true },
  { name: 'חדרה', code: 4000, district: 'haifa', isIndependent: true },
  { name: 'חולון', code: 6700, district: 'tel-aviv', isIndependent: true },
  { name: 'חיפה', code: 4000, district: 'haifa', isIndependent: true },
  { name: 'טבריה', code: 8700, district: 'north', isIndependent: true },
  { name: 'ירושלים', code: 3000, district: 'jerusalem', isIndependent: true },
  { name: 'כפר סבא', code: 7900, district: 'center', isIndependent: true },
  { name: 'לוד', code: 7000, district: 'center', isIndependent: true },
  { name: 'מודיעין-מכבים-רעות', code: 1224, district: 'center', isIndependent: true },
  { name: 'נהריה', code: 8600, district: 'north', isIndependent: true },
  { name: 'נס ציונה', code: 8400, district: 'center', isIndependent: true },
  { name: 'נצרת', code: 7400, district: 'north', isIndependent: true },
  { name: 'נתניה', code: 7500, district: 'center', isIndependent: true },
  { name: 'עכו', code: 7300, district: 'north', isIndependent: true },
  { name: 'פתח תקווה', code: 7900, district: 'center', isIndependent: true },
  { name: 'צפת', code: 9200, district: 'north', isIndependent: true },
  { name: 'קריית אתא', code: 3100, district: 'haifa', isIndependent: true },
  { name: 'קריית גת', code: 8300, district: 'south', isIndependent: true },
  { name: 'ראש העין', code: 1200, district: 'center', isIndependent: true },
  { name: 'ראשון לציון', code: 8600, district: 'center', isIndependent: true },
  { name: 'רחובות', code: 8400, district: 'center', isIndependent: true },
  { name: 'רמת גן', code: 8700, district: 'tel-aviv', isIndependent: true },
  { name: 'רמת השרון', code: 1163, district: 'tel-aviv', isIndependent: true },
  { name: 'תל אביב - יפו', code: 5000, district: 'tel-aviv', isIndependent: true },
];
