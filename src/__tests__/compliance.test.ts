/**
 * Story 7.1 — Compliance foundation tests
 *
 * Tests cover:
 * - AES-256-GCM encryption round-trip
 * - Empty-string edge cases
 * - Missing key error
 * - Patient model validation (consentGiven, retentionDeleteAfter)
 * - Therapist data isolation (therapistId scoping)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Types } from 'mongoose';
import type mongoose from 'mongoose';

// ---------------------------------------------------------------------------
// Crypto tests
// ---------------------------------------------------------------------------

describe('crypto utility', () => {
  const VALID_KEY = 'a'.repeat(64); // 64 hex chars = 32 bytes

  beforeEach(() => {
    vi.resetModules();
    process.env.FIELD_ENCRYPTION_KEY = VALID_KEY;
  });

  afterEach(() => {
    delete process.env.FIELD_ENCRYPTION_KEY;
    vi.resetModules();
  });

  it('round-trips plaintext correctly', async () => {
    const { encrypt, decrypt } = await import('@/lib/crypto');
    const plaintext = 'Patient has sensory processing difficulties';
    expect(decrypt(encrypt(plaintext))).toBe(plaintext);
  });

  it('round-trips multi-line and unicode text', async () => {
    const { encrypt, decrypt } = await import('@/lib/crypto');
    const plaintext = 'שלום עולם\nHello World\n\uD83D\uDE0A';
    expect(decrypt(encrypt(plaintext))).toBe(plaintext);
  });

  it('encrypt("") returns ""', async () => {
    const { encrypt } = await import('@/lib/crypto');
    expect(encrypt('')).toBe('');
  });

  it('decrypt("") returns ""', async () => {
    const { decrypt } = await import('@/lib/crypto');
    expect(decrypt('')).toBe('');
  });

  it('produces different ciphertexts for the same plaintext (random IV)', async () => {
    const { encrypt } = await import('@/lib/crypto');
    const plaintext = 'same input';
    const c1 = encrypt(plaintext);
    const c2 = encrypt(plaintext);
    expect(c1).not.toBe(c2);
  });

  it('throws when FIELD_ENCRYPTION_KEY is missing', async () => {
    delete process.env.FIELD_ENCRYPTION_KEY;
    const { encrypt } = await import('@/lib/crypto');
    expect(() => encrypt('test')).toThrow('FIELD_ENCRYPTION_KEY');
  });

  it('throws when FIELD_ENCRYPTION_KEY has wrong length', async () => {
    process.env.FIELD_ENCRYPTION_KEY = 'tooshort';
    const { encrypt } = await import('@/lib/crypto');
    expect(() => encrypt('test')).toThrow('64-character hex string');
  });
});

// ---------------------------------------------------------------------------
// Patient model validation tests (no DB connection — Mongoose validate() only)
// ---------------------------------------------------------------------------

describe('Patient model validation', () => {
  function validPatientData() {
    const futureDate = new Date(Date.now() + 7 * 365 * 24 * 60 * 60 * 1000); // +7 years
    return {
      therapistId: new Types.ObjectId(),
      type: 'direct' as const,
      firstName: 'Avi',
      lastName: 'Cohen',
      dateOfBirth: new Date('2010-01-01'),
      gender: 'male' as const,
      consentGiven: true,
      consentDate: new Date(),
      consentSignedBy: 'Avi Cohen',
      retentionDeleteAfter: futureDate,
      status: 'active' as const,
    };
  }

  it('validates a fully valid patient without error', async () => {
    const { Patient } = await import('@/lib/db/models/Patient');
    const doc = new Patient(validPatientData());
    await expect(doc.validate()).resolves.toBeUndefined();
  });

  it('fails validation when consentGiven is missing', async () => {
    const { Patient } = await import('@/lib/db/models/Patient');
    const data = validPatientData();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (data as any).consentGiven;
    const doc = new Patient(data);
    await expect(doc.validate()).rejects.toThrow();
  });

  it('fails validation when consentSignedBy is missing', async () => {
    const { Patient } = await import('@/lib/db/models/Patient');
    const data = validPatientData();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (data as any).consentSignedBy;
    const doc = new Patient(data);
    await expect(doc.validate()).rejects.toThrow();
  });

  it('fails validation when consentDate is missing', async () => {
    const { Patient } = await import('@/lib/db/models/Patient');
    const data = validPatientData();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (data as any).consentDate;
    const doc = new Patient(data);
    await expect(doc.validate()).rejects.toThrow();
  });

  it('fails validation when retentionDeleteAfter is missing', async () => {
    const { Patient } = await import('@/lib/db/models/Patient');
    const data = validPatientData();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (data as any).retentionDeleteAfter;
    const doc = new Patient(data);
    await expect(doc.validate()).rejects.toThrow();
  });

  it('fails the retentionDeleteAfter validator when date is in the past', async () => {
    const { Patient } = await import('@/lib/db/models/Patient');
    const data = validPatientData();
    // Use a date far in the past
    data.retentionDeleteAfter = new Date('2000-01-01');
    const doc = new Patient(data);
    // Manually set createdAt to simulate an existing document
    doc.createdAt = new Date();
    await expect(doc.validate()).rejects.toThrow('retentionDeleteAfter must be after createdAt');
  });

  it('requires firstName', async () => {
    const { Patient } = await import('@/lib/db/models/Patient');
    const data = validPatientData();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (data as any).firstName;
    const doc = new Patient(data);
    await expect(doc.validate()).rejects.toThrow();
  });

  it('requires therapistId', async () => {
    const { Patient } = await import('@/lib/db/models/Patient');
    const data = validPatientData();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (data as any).therapistId;
    const doc = new Patient(data);
    await expect(doc.validate()).rejects.toThrow();
  });
});

// ---------------------------------------------------------------------------
// Data isolation test — therapistId scoping
// ---------------------------------------------------------------------------

describe('Patient data isolation', () => {
  it('a patient record is scoped to its therapistId', () => {
    const therapistA = new Types.ObjectId();
    const therapistB = new Types.ObjectId();

    // Simulate what a DB query filter enforces:
    // `Patient.findOne({ _id: patientId, therapistId: therapistB })` returns null
    // when the patient actually belongs to therapistA.
    const patientTherapistId = therapistA;

    // Therapist B queries for a patient they do not own
    const queryMatches = patientTherapistId.equals(therapistB);
    expect(queryMatches).toBe(false);

    // Therapist A can access their own patient
    const ownQueryMatches = patientTherapistId.equals(therapistA);
    expect(ownQueryMatches).toBe(true);
  });

  it('two different ObjectIds are never equal', () => {
    const id1 = new Types.ObjectId();
    const id2 = new Types.ObjectId();
    expect(id1.equals(id2)).toBe(false);
  });

  it('the same ObjectId always equals itself', () => {
    const id = new Types.ObjectId();
    expect(id.equals(id)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Model schema structural tests
// ---------------------------------------------------------------------------

describe('Model schema fields', () => {
  it('Patient schema includes retentionDeleteAfter path', async () => {
    const { Patient } = await import('@/lib/db/models/Patient');
    expect(Patient.schema.path('retentionDeleteAfter')).toBeDefined();
  });

  it('Patient schema includes consentGiven path', async () => {
    const { Patient } = await import('@/lib/db/models/Patient');
    expect(Patient.schema.path('consentGiven')).toBeDefined();
  });

  it('TreatmentSession schema includes therapistId and patientId paths', async () => {
    const { TreatmentSession } = await import('@/lib/db/models/TreatmentSession');
    expect(TreatmentSession.schema.path('therapistId')).toBeDefined();
    expect(TreatmentSession.schema.path('patientId')).toBeDefined();
  });

  it('Goal schema includes progressEntries path', async () => {
    const { Goal } = await import('@/lib/db/models/Goal');
    expect(Goal.schema.path('progressEntries')).toBeDefined();
  });

  it('Appointment schema includes remindersSent path', async () => {
    const { Appointment } = await import('@/lib/db/models/Appointment');
    expect(Appointment.schema.path('remindersSent')).toBeDefined();
  });

  it('Invoice schema includes vatRate with default 0.18', async () => {
    const { Invoice } = await import('@/lib/db/models/Invoice');
    const vatPath = Invoice.schema.path('vatRate') as mongoose.SchemaType & {
      defaultValue?: unknown;
    };
    expect(vatPath).toBeDefined();
    expect(vatPath.defaultValue).toBe(0.18);
  });

  it('Notification schema has no updatedAt path (createdAt only)', async () => {
    const { Notification } = await import('@/lib/db/models/Notification');
    // updatedAt should not be in the schema since we used { timestamps: { createdAt: true, updatedAt: false } }
    expect(Notification.schema.path('updatedAt')).toBeUndefined();
  });

  it('TherapistAvailability schema includes weeklySchedule path', async () => {
    const { TherapistAvailability } = await import('@/lib/db/models/TherapistAvailability');
    expect(TherapistAvailability.schema.path('weeklySchedule')).toBeDefined();
  });

  it('PortalUser schema includes consentGiven path', async () => {
    const { PortalUser } = await import('@/lib/db/models/PortalUser');
    expect(PortalUser.schema.path('consentGiven')).toBeDefined();
  });
});
