import { logger } from '../config/logger.js';
import { normalizeToE164 } from '../utils/phone.js';
import { ValidationError } from '../utils/errors.js';
import { twilioClient } from './twilioService.js';

export interface PhoneNumberCapabilities {
  voice: boolean;
  sms: boolean;
}

export interface OutgoingPhoneNumber {
  phoneNumber: string;
  friendlyName: string;
  sid: string;
  capabilities: PhoneNumberCapabilities;
}

const CACHE_TTL_MS = 10 * 60 * 1000;
const TEST_PHONE_NUMBER = '+14155552671';

let cachedNumbers: { numbers: OutgoingPhoneNumber[]; fetchedAt: number } | null = null;

const TEST_VOICE_ONLY_NUMBER = '+14155552672';

function testPhoneNumbers(): OutgoingPhoneNumber[] {
  return [
    {
      phoneNumber: TEST_PHONE_NUMBER,
      friendlyName: 'Test Number',
      sid: 'PNtest',
      capabilities: { voice: true, sms: true },
    },
    {
      phoneNumber: TEST_VOICE_ONLY_NUMBER,
      friendlyName: 'Voice Only',
      sid: 'PNtestvoice',
      capabilities: { voice: true, sms: false },
    },
  ];
}

function withCapability(
  numbers: OutgoingPhoneNumber[],
  capability: keyof PhoneNumberCapabilities,
): OutgoingPhoneNumber[] {
  return numbers.filter((number) => number.capabilities[capability]);
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
    .filter((entry) => entry.capabilities?.voice || entry.capabilities?.sms)
    .map((entry) => ({
      phoneNumber: entry.phoneNumber,
      friendlyName: entry.friendlyName?.trim() || entry.phoneNumber,
      sid: entry.sid,
      capabilities: {
        voice: Boolean(entry.capabilities?.voice),
        sms: Boolean(entry.capabilities?.sms),
      },
    }));

  cachedNumbers = { numbers, fetchedAt: Date.now() };
  logger.info({ count: numbers.length }, 'Fetched outgoing phone numbers from Twilio');
  return numbers;
}

export async function getDefaultCallerId(): Promise<string> {
  const numbers = withCapability(await getOutgoingPhoneNumbers(), 'voice');
  if (numbers.length === 0) {
    throw new ValidationError('No outbound phone numbers available on this account.');
  }
  return numbers[0].phoneNumber;
}

export async function getDefaultSmsFrom(): Promise<string> {
  const numbers = withCapability(await getOutgoingPhoneNumbers(), 'sms');
  if (numbers.length === 0) {
    throw new ValidationError('No SMS-capable phone numbers available on this account.');
  }
  return numbers[0].phoneNumber;
}

async function resolveOwnedNumber(
  from: string | undefined,
  capability: keyof PhoneNumberCapabilities,
  missingFromMessage: string,
  invalidFromMessage: string,
  unavailableMessage: string,
  getDefault: () => Promise<string>,
): Promise<string> {
  const numbers = withCapability(await getOutgoingPhoneNumbers(), capability);
  const allowed = new Set(numbers.map((n) => n.phoneNumber));

  if (from) {
    let normalized: string;
    try {
      normalized = normalizeToE164(from);
    } catch {
      throw new ValidationError(invalidFromMessage);
    }

    if (!allowed.has(normalized)) {
      throw new ValidationError(unavailableMessage);
    }

    return normalized;
  }

  if (numbers.length === 0) {
    throw new ValidationError(missingFromMessage);
  }

  return getDefault();
}

export async function resolveCallerId(from?: string): Promise<string> {
  return resolveOwnedNumber(
    from,
    'voice',
    'No outbound phone numbers available on this account.',
    'Please select a valid caller ID.',
    'Selected caller ID is not available on this account.',
    getDefaultCallerId,
  );
}

export async function resolveSmsFrom(from?: string): Promise<string> {
  return resolveOwnedNumber(
    from,
    'sms',
    'No SMS-capable phone numbers available on this account.',
    'Please select a valid sending number.',
    'Selected number cannot send SMS.',
    getDefaultSmsFrom,
  );
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
