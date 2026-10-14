import { describe, expect, it } from 'vitest';
import { getSmsSegmentInfo } from './smsSegments';

describe('getSmsSegmentInfo', () => {
  it('counts GSM-7 as a single segment up to 160 characters', () => {
    const info = getSmsSegmentInfo('Hello there');
    expect(info.encoding).toBe('GSM-7');
    expect(info.segments).toBe(1);
    expect(info.characters).toBe(11);
  });

  it('uses concatenated GSM limits after 160 characters', () => {
    const info = getSmsSegmentInfo('a'.repeat(161));
    expect(info.encoding).toBe('GSM-7');
    expect(info.segments).toBe(2);
  });

  it('uses UCS-2 for unicode text', () => {
    const info = getSmsSegmentInfo('你好');
    expect(info.encoding).toBe('UCS-2');
    expect(info.characters).toBe(2);
    expect(info.segments).toBe(1);
  });

  it('splits UCS-2 after 70 characters', () => {
    const info = getSmsSegmentInfo('你'.repeat(71));
    expect(info.encoding).toBe('UCS-2');
    expect(info.segments).toBe(2);
  });
});
