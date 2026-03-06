const BASE_URL = 'https://data.gov.il/api/3/action/datastore_search';

const IDS = {
  CITIES: '5c78e9fa-c2e2-4771-93ff-7f400a12f7ba',
  STREETS: '9ad3862c-8391-4b2f-84a4-2d4c68625f4b',
  THERAPISTS: '5bb15386-db63-4d4c-8f44-68c4f811571d' 
};

export interface IsraelCity { name: string; code: number; }
export interface Street { name: string; cityCode: number; }

let cachedCities: IsraelCity[] | null = null;
let cityCacheExpiry = 0;
const ONE_DAY_MS = 86400 * 1000;

/**
 * 1. Get Cities with Fallback & Cache
 */
export async function getIsraelCities(): Promise<IsraelCity[]> {
  const now = Date.now();
  if (cachedCities && now < cityCacheExpiry) return cachedCities;

  try {
    const res = await fetch(`${BASE_URL}?resource_id=${IDS.CITIES}&limit=1500`, {
      next: { revalidate: 86400 },
    });
    
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const json = await res.json();
    
    type CKANCityRecord = Record<string, string>;
    const cities = (json.result.records as CKANCityRecord[])
      .map((r) => ({
        name: r['שם_ישוב']?.trim() ?? '',
        code: parseInt(r['סמל_ישוב'], 10),
      }))
      .filter((c) => c.name && c.code > 0)
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
 * 2. Get Streets based on City CODE (Updated)
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

      // If total <= current batch size, no more pages needed
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
 * Schema updated based on live response structure.
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
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!res.ok) throw new Error(`Health API Status: ${res.status}`);

    const records = await res.json();

    if (!Array.isArray(records) || records.length === 0) {
      return null;
    }

    // record is the first element of the array
    const record = records[0];
    const { licenseDetails, practitionerDetails } = record;

    return {
      fullName: `${practitionerDetails.firstName} ${practitionerDetails.lastName}`.trim(),
      licenseNumber: licenseDetails.licenseId,
      // description: "בתוקף", definition: "מורשה לעסוק במקצוע"
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
  { name: 'אילת', code: 2600 },
  { name: 'אשדוד', code: 70 },
  { name: 'אשקלון', code: 7100 },
  { name: 'באר שבע', code: 9000 },
  { name: 'בית שמש', code: 3000 },
  { name: 'בני ברק', code: 6200 },
  { name: 'בת ים', code: 6300 },
  { name: 'גבעתיים', code: 6400 },
  { name: 'הרצליה', code: 6600 },
  { name: 'חדרה', code: 4000 },
  { name: 'חולון', code: 6700 },
  { name: 'חיפה', code: 4000 },
  { name: 'טבריה', code: 8700 },
  { name: 'ירושלים', code: 3000 },
  { name: 'כפר סבא', code: 7900 },
  { name: 'לוד', code: 7000 },
  { name: 'מודיעין-מכבים-רעות', code: 1224 },
  { name: 'נהריה', code: 8600 },
  { name: 'נס ציונה', code: 8400 },
  { name: 'נצרת', code: 7400 },
  { name: 'נתניה', code: 7500 },
  { name: 'עכו', code: 7300 },
  { name: 'פתח תקווה', code: 7900 },
  { name: 'צפת', code: 9200 },
  { name: 'קריית אתא', code: 3100 },
  { name: 'קריית גת', code: 8300 },
  { name: 'ראש העין', code: 1200 },
  { name: 'ראשון לציון', code: 8600 },
  { name: 'רחובות', code: 8400 },
  { name: 'רמת גן', code: 8700 },
  { name: 'רמת השרון', code: 1163 },
  { name: 'תל אביב - יפו', code: 5000 },
];
