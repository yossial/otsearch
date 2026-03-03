/**
 * Unit tests for auth input validation rules.
 * These mirror the validation logic in register/route.ts and RegisterForm.tsx.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateRegistration(input: {
  email?: string;
  password?: string;
  name?: string;
}): string | null {
  const { email, password, name } = input;
  if (!email || !password || !name) return 'required';
  if (!EMAIL_RE.test(email)) return 'invalidEmail';
  if (password.length < 8) return 'passwordTooShort';
  return null;
}

describe('validateRegistration', () => {
  it('returns required when any field is missing', () => {
    expect(validateRegistration({})).toBe('required');
    expect(validateRegistration({ email: 'a@b.com', password: 'pass1234' })).toBe('required');
  });

  it('returns invalidEmail for malformed emails', () => {
    expect(validateRegistration({ email: 'notanemail', password: 'pass1234', name: 'Test' })).toBe('invalidEmail');
    expect(validateRegistration({ email: '@nodomain', password: 'pass1234', name: 'Test' })).toBe('invalidEmail');
  });

  it('returns passwordTooShort when password has fewer than 8 chars', () => {
    expect(validateRegistration({ email: 'a@b.com', password: 'short', name: 'Test' })).toBe('passwordTooShort');
  });

  it('returns null for valid registration', () => {
    expect(validateRegistration({ email: 'therapist@example.com', password: 'securepass', name: 'Dr. Test' })).toBeNull();
  });
});

describe('email regex', () => {
  it('accepts standard emails', () => {
    expect(EMAIL_RE.test('user@example.com')).toBe(true);
    expect(EMAIL_RE.test('user+tag@sub.domain.org')).toBe(true);
  });

  it('rejects invalid emails', () => {
    expect(EMAIL_RE.test('nodomain')).toBe(false);
    expect(EMAIL_RE.test('@nolocal.com')).toBe(false);
    expect(EMAIL_RE.test('missing@')).toBe(false);
    expect(EMAIL_RE.test('')).toBe(false);
  });
});
