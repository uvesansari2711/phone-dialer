import { config } from '../config/env.js';
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

let cachedNumbers: { numbers: OutgoingPhoneNumber[]; fetchedAt: number } | null = null;

function testPhoneNumbers(): OutgoingPhoneNumber[] {
  return [
    {
      phoneNumber: config.twilio.phoneNumber,
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

  if (
    config.twilio.phoneNumber &&
    !numbers.some((n) => n.phoneNumber === config.twilio.phoneNumber)
  ) {
    numbers.unshift({
      phoneNumber: config.twilio.phoneNumber,
      friendlyName: config.twilio.phoneNumber,
      sid: 'env-default',
    });
  }

  cachedNumbers = { numbers, fetchedAt: Date.now() };
  logger.info({ count: numbers.length }, 'Fetched outgoing phone numbers from Twilio');
  return numbers;
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

  if (allowed.has(config.twilio.phoneNumber)) {
    return config.twilio.phoneNumber;
  }

  if (numbers.length > 0) {
    return numbers[0].phoneNumber;
  }

  return config.twilio.phoneNumber;
}
