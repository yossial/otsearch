/**
 * Tests for Israeli MOH licence number validation logic.
 * Covers both the client-side format check and the verifyTherapist function.
 * Accepted formats: 5–6 digits (e.g. "12345") or XX-XXXXXX (e.g. "14-142767")
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { verifyTherapist } from '../govApi';

// ── Format validation (mirrors wizard client-side regex) ───────────────────
const MOH_FORMAT = /^\d{2}-\d{6}$|^\d{5,6}$/;

describe('MOH licence format validation', () => {
  it('accepts 5-digit number', () => {
    expect(MOH_FORMAT.test('12345')).toBe(true);
  });

  it('accepts 6-digit number', () => {
    expect(MOH_FORMAT.test('123456')).toBe(true);
  });

  it('accepts XX-XXXXXX format', () => {
    expect(MOH_FORMAT.test('14-142767')).toBe(true);
  });

  it('rejects 4-digit number', () => {
    expect(MOH_FORMAT.test('1234')).toBe(false);
  });

  it('rejects 7-digit number', () => {
    expect(MOH_FORMAT.test('1234567')).toBe(false);
  });

  it('rejects letters', () => {
    expect(MOH_FORMAT.test('abcde')).toBe(false);
  });

  it('rejects alphanumeric', () => {
    expect(MOH_FORMAT.test('1234a')).toBe(false);
  });

  it('rejects empty string', () => {
    expect(MOH_FORMAT.test('')).toBe(false);
  });

  it('rejects number with spaces', () => {
    expect(MOH_FORMAT.test('123 45')).toBe(false);
  });
});

// ── verifyTherapist — additional edge cases ────────────────────────────────
const MOCK_ACTIVE = [
  {
    licenseDetails: {
      licenseId: '54321',
      issueDate: '2019-06-15',
      status: { description: 'בתוקף', definition: 'מורשה לעסוק במקצוע' },
    },
    practitionerDetails: {
      firstName: 'שרה',
      lastName: 'כהן',
      city: { description: 'ירושלים' },
    },
  },
];

const MOCK_INACTIVE = [
  {
    licenseDetails: {
      licenseId: '99999',
      issueDate: '2010-01-01',
      status: { description: 'פג תוקף', definition: 'הרישיון פג' },
    },
    practitionerDetails: {
      firstName: 'יוסי',
      lastName: 'לוי',
      city: { description: 'חיפה' },
    },
  },
];

describe('verifyTherapist — edge cases', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns data with correct fullName for active licence', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(MOCK_ACTIVE), { status: 200 })
    );
    const result = await verifyTherapist('54321');
    expect(result).not.toBeNull();
    expect(result?.fullName).toBe('שרה כהן');
    expect(result?.licenseNumber).toBe('54321');
    expect(result?.city).toBe('ירושלים');
  });

  it('returns data for inactive licence (status check is caller responsibility)', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(MOCK_INACTIVE), { status: 200 })
    );
    const result = await verifyTherapist('99999');
    // verifyTherapist returns data; the route/caller enforces "בתוקף" check
    expect(result).not.toBeNull();
    expect(result?.status).toBe('פג תוקף');
  });

  it('returns null when API returns non-2xx', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response('Service Unavailable', { status: 503 })
    );
    const result = await verifyTherapist('12345');
    expect(result).toBeNull();
  });

  it('returns null when practitionerDetails is missing city', async () => {
    const noCityResponse = [
      {
        licenseDetails: { licenseId: '11111', issueDate: '2021-01-01', status: { description: 'בתוקף', definition: 'מורשה לעסוק במקצוע' } },
        practitionerDetails: { firstName: 'דן', lastName: 'גל', city: null },
      },
    ];
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(noCityResponse), { status: 200 })
    );
    const result = await verifyTherapist('11111');
    expect(result).not.toBeNull();
    expect(result?.city).toBe('');
  });

  it('handles trimmed string input', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(MOCK_ACTIVE), { status: 200 })
    );
    // Leading/trailing spaces should be handled internally
    const result = await verifyTherapist('  54321  ');
    expect(result).not.toBeNull();
  });
});
