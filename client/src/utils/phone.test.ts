import { describe, it, expect } from 'vitest';
import {
  sanitizePhoneInput,
  normalizeToE164,
  isValidPhoneNumber,
  formatDuration,
} from '../utils/phone';

describe('phone utils', () => {
  it('sanitizes pasted numbers with formatting', () => {
    expect(sanitizePhoneInput('+91-95121-68389')).toBe('+919512168389');
    expect(sanitizePhoneInput('(+91) 95121 68389')).toBe('+919512168389');
  });

  it('normalizes to E.164', () => {
    expect(normalizeToE164('+91 95121 68389')).toBe('+919512168389');
  });

  it('validates phone numbers', () => {
    expect(isValidPhoneNumber('+919512168389')).toBe(true);
    expect(isValidPhoneNumber('123')).toBe(false);
  });

  it('formats duration', () => {
    expect(formatDuration(0)).toBe('00:00');
    expect(formatDuration(92)).toBe('01:32');
  });
});
