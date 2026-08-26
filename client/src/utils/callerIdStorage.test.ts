import { describe, it, expect } from 'vitest';
import { pickDefaultCallerId } from '../utils/callerIdStorage';

describe('pickDefaultCallerId', () => {
  const numbers = [
    { phoneNumber: '+15555550100' },
    { phoneNumber: '+447307223886' },
  ];

  it('prefers server default when available', () => {
    expect(pickDefaultCallerId(numbers, '+447307223886')).toBe('+447307223886');
  });

  it('falls back to first number when default is unavailable', () => {
    expect(pickDefaultCallerId(numbers, '+19998887777')).toBe('+15555550100');
  });

  it('returns null when no numbers exist', () => {
    expect(pickDefaultCallerId([], '+15555550100')).toBeNull();
  });
});
