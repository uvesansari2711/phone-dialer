import { describe, it, expect, beforeEach } from 'vitest';
import {
  clearPhoneNumberCache,
  getDefaultCallerId,
  getOutgoingPhoneNumbers,
  resolveCallerId,
} from '../services/phoneNumberService.js';
import { ValidationError } from '../utils/errors.js';

const TEST_PHONE_NUMBER = '+14155552671';

describe('phoneNumberService', () => {
  beforeEach(() => {
    clearPhoneNumberCache();
  });

  it('returns test phone numbers in test env', async () => {
    const numbers = await getOutgoingPhoneNumbers();
    expect(numbers.length).toBeGreaterThan(0);
    expect(numbers[0].phoneNumber).toBe(TEST_PHONE_NUMBER);
  });

  it('resolves default caller ID when from is omitted', async () => {
    const callerId = await resolveCallerId();
    expect(callerId).toBe(TEST_PHONE_NUMBER);
  });

  it('resolves valid caller ID from request', async () => {
    const callerId = await resolveCallerId(TEST_PHONE_NUMBER);
    expect(callerId).toBe(TEST_PHONE_NUMBER);
  });

  it('returns default caller ID from owned numbers', async () => {
    const callerId = await getDefaultCallerId();
    expect(callerId).toBe(TEST_PHONE_NUMBER);
  });

  it('rejects caller ID not on account', async () => {
    await expect(resolveCallerId('+19998887777')).rejects.toBeInstanceOf(ValidationError);
  });
});
