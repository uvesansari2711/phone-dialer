import { parsePhoneNumberFromString, type CountryCode } from 'libphonenumber-js';

export class PhoneValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PhoneValidationError';
  }
}

export function sanitizePhoneInput(input: string): string {
  return input.replace(/[^\d+*#]/g, '');
}

export function normalizeToE164(input: string, defaultCountry: CountryCode = 'US'): string {
  const cleaned = input.trim();
  if (!cleaned) {
    throw new PhoneValidationError('Please enter a valid phone number.');
  }

  const parsed = parsePhoneNumberFromString(cleaned, defaultCountry);
  if (!parsed || !parsed.isValid()) {
    throw new PhoneValidationError('Please enter a valid phone number.');
  }

  return parsed.format('E.164');
}

export function isValidPhoneNumber(input: string, defaultCountry: CountryCode = 'US'): boolean {
  try {
    normalizeToE164(input, defaultCountry);
    return true;
  } catch {
    return false;
  }
}

export function formatForDisplay(e164: string): string {
  try {
    const parsed = parsePhoneNumberFromString(e164);
    if (parsed) {
      return parsed.formatInternational();
    }
  } catch {
    // fall through
  }
  return e164;
}
