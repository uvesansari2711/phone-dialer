import { describe, it, expect, beforeEach } from 'vitest';
import { config } from '../config/env.js';
import {
  clearPhoneNumberCache,
  getOutgoingPhoneNumbers,
  resolveCallerId,
} from '../services/phoneNumberService.js';
import { ValidationError } from '../utils/errors.js';

describe('phoneNumberService', () => {
  beforeEach(() => {
    clearPhoneNumberCache();
  });

  it('returns test phone numbers in test env', async () => {
    const numbers = await getOutgoingPhoneNumbers();
    expect(numbers.length).toBeGreaterThan(0);
    expect(numbers[0].phoneNumber).toBe(config.twilio.phoneNumber);
  });

  it('resolves default caller ID when from is omitted', async () => {
    const callerId = await resolveCallerId();
    expect(callerId).toBe(config.twilio.phoneNumber);
  });

  it('resolves valid caller ID from request', async () => {
    const callerId = await resolveCallerId(config.twilio.phoneNumber);
    expect(callerId).toBe(config.twilio.phoneNumber);
  });

  it('rejects caller ID not on account', async () => {
    await expect(resolveCallerId('+19998887777')).rejects.toBeInstanceOf(ValidationError);
  });
});
