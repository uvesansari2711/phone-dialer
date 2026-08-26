import { logger } from '../config/logger.js';
import { normalizeToE164 } from '../utils/phone.js';
import { ValidationError } from '../utils/errors.js';
import { twilioClient } from './twilioService.js';

export interface OutgoingPhoneNumber {
  phoneNumber: string;
  friendlyName: string;
  sid: string;
}

const CACHE_TTL_MS = 10 * 60 * 1000;
const TEST_PHONE_NUMBER = '+14155552671';

let cachedNumbers: { numbers: OutgoingPhoneNumber[]; fetchedAt: number } | null = null;

function testPhoneNumbers(): OutgoingPhoneNumber[] {
  return [
    {
      phoneNumber: TEST_PHONE_NUMBER,
      friendlyName: 'Test Number',
      sid: 'PNtest',
    },
  ];
}

export function clearPhoneNumberCache(): void {
  cachedNumbers = null;
}

export async function getOutgoingPhoneNumbers(
  forceRefresh = false,
): Promise<OutgoingPhoneNumber[]> {
  if (process.env.NODE_ENV === 'test') {
    return testPhoneNumbers();
  }

  if (
    !forceRefresh &&
    cachedNumbers &&
    Date.now() - cachedNumbers.fetchedAt < CACHE_TTL_MS
  ) {
    return cachedNumbers.numbers;
  }

  const incoming = await twilioClient.incomingPhoneNumbers.list({ limit: 100 });
  const numbers: OutgoingPhoneNumber[] = incoming
    .filter((entry) => entry.capabilities?.voice)
    .map((entry) => ({
      phoneNumber: entry.phoneNumber,
      friendlyName: entry.friendlyName?.trim() || entry.phoneNumber,
      sid: entry.sid,
    }));

  cachedNumbers = { numbers, fetchedAt: Date.now() };
  logger.info({ count: numbers.length }, 'Fetched outgoing phone numbers from Twilio');
  return numbers;
}

export async function getDefaultCallerId(): Promise<string> {
  const numbers = await getOutgoingPhoneNumbers();
  if (numbers.length === 0) {
    throw new ValidationError('No outbound phone numbers available on this account.');
  }
  return numbers[0].phoneNumber;
}

export async function resolveCallerId(from?: string): Promise<string> {
  const numbers = await getOutgoingPhoneNumbers();
  const allowed = new Set(numbers.map((n) => n.phoneNumber));

  if (from) {
    let normalized: string;
    try {
      normalized = normalizeToE164(from);
    } catch {
      throw new ValidationError('Please select a valid caller ID.');
    }

    if (!allowed.has(normalized)) {
      throw new ValidationError('Selected caller ID is not available on this account.');
    }

    return normalized;
  }

  return getDefaultCallerId();
}

export async function resolveCallerIdFromWebhook(from?: string): Promise<string> {
  if (from && !from.startsWith('client:')) {
    try {
      return await resolveCallerId(from);
    } catch {
      // Fall back to default when webhook From is not an owned number.
    }
  }

  return getDefaultCallerId();
}
