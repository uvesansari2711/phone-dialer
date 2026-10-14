import { describe, it, expect } from 'vitest';
import {
  buildEmptyMessagingTwiml,
  buildVoiceTwiml,
  mapTwilioMessageStatus,
  mapTwilioSmsError,
} from '../services/twilioService.js';

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

describe('SMS helpers', () => {
  it('returns empty Messaging TwiML', () => {
    const twiml = buildEmptyMessagingTwiml();
    expect(twiml).toContain('<Response');
  });

  it('maps Twilio message statuses', () => {
    expect(mapTwilioMessageStatus('accepted')).toBe('queued');
    expect(mapTwilioMessageStatus('delivered')).toBe('delivered');
  });

  it('maps SMS error codes', () => {
    expect(mapTwilioSmsError({ code: 21614 })).toBe('Please enter a valid phone number.');
    expect(mapTwilioSmsError({ code: 21612 })).toBe(
      'This sender cannot text that destination. For the UK, send from a UK SMS number.',
    );
    expect(mapTwilioSmsError({ code: 30006 })).toBe('This number cannot receive SMS.');
  });
});
