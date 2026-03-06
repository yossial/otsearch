import { describe, it, expect, vi, beforeEach } from 'vitest';
import { verifyTherapist } from '../govApi';

const MOCK_VALID_RESPONSE = [
  {
    licenseDetails: {
      licenseId: '12345',
      issueDate: '2020-01-01',
      status: {
        description: 'בתוקף',
        definition: 'מורשה לעסוק במקצוע',
      },
    },
    practitionerDetails: {
      firstName: 'ישראל',
      lastName: 'ישראלי',
      city: { description: 'תל אביב' },
    },
  },
];

describe('verifyTherapist', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns practitioner data for a valid license', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(MOCK_VALID_RESPONSE), { status: 200 })
    );

    const result = await verifyTherapist('12345');
    expect(result).not.toBeNull();
    expect(result?.fullName).toBe('ישראל ישראלי');
    expect(result?.status).toBe('בתוקף');
    expect(result?.statusDetail).toBe('מורשה לעסוק במקצוע');
  });

  it('returns null for empty array response', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify([]), { status: 200 })
    );

    const result = await verifyTherapist('00000');
    expect(result).toBeNull();
  });

  it('returns null on network error', async () => {
    vi.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('Network error'));

    const result = await verifyTherapist('99999');
    expect(result).toBeNull();
  });
});
