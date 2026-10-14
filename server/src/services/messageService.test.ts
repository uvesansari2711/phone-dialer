import { beforeEach, describe, expect, it, vi } from 'vitest';
import '../test/dbSetup.js';

vi.mock('../services/twilioService.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../services/twilioService.js')>();
  return {
    ...actual,
    sendSms: vi.fn(),
    listRecentSms: vi.fn(),
  };
});

import { listRecentSms, sendSms } from '../services/twilioService.js';
import { Message } from '../models/Message.js';
import {
  listConversations,
  listMessagesForContact,
  markConversationRead,
  sendOutboundMessage,
  syncMessagesFromTwilio,
  updateMessageFromStatusWebhook,
  upsertInboundMessage,
  validateSmsBody,
} from './messageService.js';
import { ValidationError } from '../utils/errors.js';

const mockedSendSms = vi.mocked(sendSms);
const mockedListRecentSms = vi.mocked(listRecentSms);

describe('messageService', () => {
  beforeEach(() => {
    mockedSendSms.mockReset();
    mockedSendSms.mockResolvedValue({ sid: 'SMtest123', status: 'queued', numSegments: 1 });
    mockedListRecentSms.mockReset();
    mockedListRecentSms.mockResolvedValue([]);
  });

  it('rejects empty SMS bodies', () => {
    expect(() => validateSmsBody('')).toThrow(ValidationError);
    expect(() => validateSmsBody('   ')).toThrow(ValidationError);
  });

  it('sends an outbound message and stores the Twilio SID', async () => {
    const message = await sendOutboundMessage('+15555550100', '+14155552671', 'Hello');
    expect(message.twilioMessageSid).toBe('SMtest123');
    expect(message.status).toBe('queued');
    expect(message.direction).toBe('outbound');
    expect(message.contactNumber).toBe('+15555550100');
  });

  it('marks the record failed when Twilio send fails', async () => {
    mockedSendSms.mockRejectedValue({ code: 21614, message: 'not sms' });
    await expect(sendOutboundMessage('+15555550100', '+14155552671', 'Hello')).rejects.toBeInstanceOf(
      ValidationError,
    );
    const stored = await Message.findOne({ contactNumber: '+15555550100' });
    expect(stored?.status).toBe('failed');
  });

  it('upserts inbound messages by SID', async () => {
    const first = await upsertInboundMessage({
      MessageSid: 'SMinbound1',
      From: '+15555550100',
      To: '+14155552671',
      Body: 'Hi there',
      NumSegments: '1',
    });
    const second = await upsertInboundMessage({
      MessageSid: 'SMinbound1',
      From: '+15555550100',
      To: '+14155552671',
      Body: 'Hi there',
    });

    expect(first?._id.toString()).toBe(second?._id.toString());
    expect(await Message.countDocuments()).toBe(1);
  });

  it('updates status from the status webhook', async () => {
    await sendOutboundMessage('+15555550100', '+14155552671', 'Hello');
    const updated = await updateMessageFromStatusWebhook({
      MessageSid: 'SMtest123',
      MessageStatus: 'delivered',
    });
    expect(updated?.status).toBe('delivered');
  });

  it('maps failed status from the webhook', async () => {
    await sendOutboundMessage('+15555550100', '+14155552671', 'Hello');
    const updated = await updateMessageFromStatusWebhook({
      MessageSid: 'SMtest123',
      MessageStatus: 'failed',
      ErrorCode: '30006',
      ErrorMessage: 'Landline',
    });
    expect(updated?.status).toBe('failed');
    expect(updated?.errorCode).toBe('30006');
  });

  it('lists a thread oldest-first and aggregates conversations with unread', async () => {
    await sendOutboundMessage('+15555550100', '+14155552671', 'Hello');
    await upsertInboundMessage({
      MessageSid: 'SMin2',
      From: '+15555550100',
      To: '+14155552671',
      Body: 'Reply',
    });

    const thread = await listMessagesForContact('+15555550100');
    expect(thread[0].body).toBe('Hello');
    expect(thread[1].body).toBe('Reply');

    const conversations = await listConversations();
    expect(conversations[0].contactNumber).toBe('+15555550100');
    expect(conversations[0].unreadCount).toBe(1);
    expect(conversations[0].lastBody).toBe('Reply');

    await markConversationRead('+15555550100');
    const afterRead = await listConversations();
    expect(afterRead[0].unreadCount).toBe(0);
  });

  it('imports inbound and outbound SMS from Twilio that the dialer did not send', async () => {
    mockedListRecentSms.mockResolvedValue([
      {
        sid: 'SMhe-inbound',
        from: '+919512168389',
        to: '+14155552671',
        body: 'I do not have that information',
        status: 'received',
        direction: 'inbound',
        dateSent: new Date('2026-10-14T17:05:00.000Z'),
      },
      {
        sid: 'SMhe-outbound',
        from: '+14155552671',
        to: '+919512168389',
        body: 'Hello from Heat Engineer',
        status: 'delivered',
        direction: 'outbound-api',
        dateSent: new Date('2026-10-14T17:06:00.000Z'),
      },
    ]);

    const imported = await syncMessagesFromTwilio(true);
    expect(imported).toBe(2);

    const thread = await listMessagesForContact('+919512168389');
    expect(thread).toHaveLength(2);
    expect(thread[0].direction).toBe('inbound');
    expect(thread[0].body).toBe('I do not have that information');
    expect(thread[1].direction).toBe('outbound');
    expect(thread[1].body).toBe('Hello from Heat Engineer');

    const again = await syncMessagesFromTwilio(true);
    expect(again).toBe(0);
  });
});
