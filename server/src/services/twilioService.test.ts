import { describe, it, expect } from 'vitest';
import { buildVoiceTwiml } from '../services/twilioService.js';

describe('buildVoiceTwiml', () => {
  it('returns valid TwiML with dial instruction', () => {
    const twiml = buildVoiceTwiml('+919512168389', '+15555550100');

    expect(twiml).toContain('<Response>');
    expect(twiml).toContain('<Dial');
    expect(twiml).toContain('+919512168389');
    expect(twiml).toContain('callerId="+15555550100"');
    expect(twiml).toContain('</Response>');
  });
});
