import { describe, it, expect } from 'vitest';
import {
  normalizeToE164,
  sanitizePhoneInput,
  isValidPhoneNumber,
  PhoneValidationError,
} from '../utils/phone.js';

describe('phone utils', () => {
  it('sanitizes formatted input', () => {
    expect(sanitizePhoneInput('(+91) 95121-68389')).toBe('+919512168389');
  });

  it('normalizes international numbers to E.164', () => {
    expect(normalizeToE164('+91 95121 68389')).toBe('+919512168389');
    expect(normalizeToE164('+1 (415) 555-2671')).toBe('+14155552671');
  });

  it('rejects invalid numbers', () => {
    expect(() => normalizeToE164('123')).toThrow(PhoneValidationError);
    expect(isValidPhoneNumber('abc')).toBe(false);
  });

  it('accepts valid numbers', () => {
    expect(isValidPhoneNumber('+443330384558')).toBe(true);
  });
});
