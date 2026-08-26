import { describe, it, expect } from 'vitest';
import { updateCallFromWebhook } from '../services/callService.js';
import { Call } from '../models/Call.js';
import '../test/dbSetup.js';

describe('updateCallFromWebhook', () => {
  it('creates and updates call from webhook', async () => {
    await updateCallFromWebhook({
      CallSid: 'CAtest123',
      CallStatus: 'ringing',
      To: '+919512168389',
    });

    let call = await Call.findOne({ twilioCallSid: 'CAtest123' });
    expect(call?.status).toBe('ringing');

    await updateCallFromWebhook({
      CallSid: 'CAtest123',
      CallStatus: 'completed',
      CallDuration: '45',
      To: '+919512168389',
    });

    call = await Call.findOne({ twilioCallSid: 'CAtest123' });
    expect(call?.status).toBe('completed');
    expect(call?.duration).toBe(45);
  });
});
