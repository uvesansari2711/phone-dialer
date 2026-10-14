import { Message, type MessageDocument } from '../models/Message.js';
import { logger } from '../config/logger.js';
import { ValidationError } from '../utils/errors.js';
import {
  listRecentSms,
  mapTwilioMessageStatus,
  mapTwilioSmsError,
  sendSms,
  type TwilioSmsRecord,
} from './twilioService.js';
import { getOutgoingPhoneNumbers } from './phoneNumberService.js';
import { normalizeToE164 } from '../utils/phone.js';
import { MESSAGE_STATUSES, type ConversationSummary, type MessageStatus } from '../types/index.js';

function asMessageStatus(status: string): MessageStatus {
  return (MESSAGE_STATUSES as readonly string[]).includes(status)
    ? (status as MessageStatus)
    : 'queued';
}

export const MAX_SMS_BODY_LENGTH = 1600;
const THREAD_LIMIT = 200;
const CONVERSATION_LIMIT = 50;
const SYNC_MIN_INTERVAL_MS = 5000;

let lastSyncAt = 0;

function tryNormalizePhone(value: string | undefined): string | undefined {
  if (!value) return undefined;
  try {
    return normalizeToE164(value);
  } catch {
    return value.trim() || undefined;
  }
}

export function serializeMessage(message: MessageDocument) {
  return {
    _id: message._id.toString(),
    contactNumber: message.contactNumber,
    ourNumber: message.ourNumber,
    body: message.body,
    direction: message.direction,
    status: message.status,
    twilioMessageSid: message.twilioMessageSid,
    errorCode: message.errorCode,
    errorMessage: message.errorMessage,
    numSegments: message.numSegments,
    readAt: message.readAt?.toISOString(),
    createdAt: message.createdAt.toISOString(),
    updatedAt: message.updatedAt.toISOString(),
  };
}

export function validateSmsBody(body: unknown): string {
  if (typeof body !== 'string') {
    throw new ValidationError('Please enter a message.');
  }

  const trimmed = body.trim();
  if (!trimmed) {
    throw new ValidationError('Please enter a message.');
  }
  if (trimmed.length > MAX_SMS_BODY_LENGTH) {
    throw new ValidationError(`Message cannot exceed ${MAX_SMS_BODY_LENGTH} characters.`);
  }
  return trimmed;
}

export async function sendOutboundMessage(
  contactNumber: string,
  ourNumber: string,
  body: string,
): Promise<MessageDocument> {
  const message = await Message.create({
    contactNumber,
    ourNumber,
    body,
    direction: 'outbound',
    status: 'sending',
  });

  try {
    const result = await sendSms(contactNumber, ourNumber, body);
    message.twilioMessageSid = result.sid;
    message.status = asMessageStatus(mapTwilioMessageStatus(result.status));
    if (result.numSegments) {
      message.numSegments = result.numSegments;
    }
    await message.save();
    logger.info(
      { messageId: message._id.toString(), sid: result.sid, contactNumber },
      'Sent outbound SMS',
    );
    return message;
  } catch (err) {
    message.status = 'failed';
    message.errorMessage = mapTwilioSmsError(err);
    if (err && typeof err === 'object' && 'code' in err) {
      message.errorCode = String((err as { code: number }).code);
    }
    await message.save();
    logger.error({ err, contactNumber }, 'Failed to send outbound SMS');
    throw new ValidationError(mapTwilioSmsError(err));
  }
}

export async function syncMessagesFromTwilio(force = false): Promise<number> {
  if (process.env.NODE_ENV === 'test' && !force) {
    return 0;
  }

  const now = Date.now();
  if (!force && now - lastSyncAt < SYNC_MIN_INTERVAL_MS) {
    return 0;
  }
  lastSyncAt = now;

  const owned = await getOutgoingPhoneNumbers();
  const ourNumbers = new Set(owned.map((number) => number.phoneNumber));
  if (ourNumbers.size === 0) {
    return 0;
  }

  let imported = 0;
  try {
    const recent = await listRecentSms(100);
    for (const record of recent) {
      const created = await importTwilioSmsRecord(record, ourNumbers);
      if (created) imported += 1;
    }
    if (imported > 0) {
      logger.info({ imported }, 'Synced SMS records from Twilio');
    }
  } catch (err) {
    logger.error({ err }, 'Failed to sync SMS from Twilio');
  }
  return imported;
}

async function importTwilioSmsRecord(
  record: TwilioSmsRecord,
  ourNumbers: Set<string>,
): Promise<boolean> {
  if (!record.sid) return false;

  const existing = await Message.findOne({ twilioMessageSid: record.sid });
  if (existing) return false;

  const from = tryNormalizePhone(record.from);
  const to = tryNormalizePhone(record.to);
  if (!from || !to) return false;

  const fromUs = ourNumbers.has(from);
  const toUs = ourNumbers.has(to);
  if (fromUs === toUs) return false;

  const sentAt = record.dateSent ?? new Date();
  const status = asMessageStatus(mapTwilioMessageStatus(record.status));

  await Message.create({
    contactNumber: fromUs ? to : from,
    ourNumber: fromUs ? from : to,
    body: record.body ?? '',
    direction: fromUs ? 'outbound' : 'inbound',
    status: toUs && status === 'queued' ? 'received' : status,
    twilioMessageSid: record.sid,
    errorCode: record.errorCode,
    errorMessage: record.errorMessage,
    numSegments: record.numSegments,
    createdAt: sentAt,
    updatedAt: sentAt,
  });

  return true;
}

export async function listMessagesForContact(contactNumber: string): Promise<MessageDocument[]> {
  return Message.find({ contactNumber }).sort({ createdAt: 1 }).limit(THREAD_LIMIT);
}

export async function listConversations(): Promise<ConversationSummary[]> {
  const rows = await Message.aggregate<{
    _id: string;
    lastBody: string;
    lastDirection: 'inbound' | 'outbound';
    lastStatus: MessageStatus;
    lastAt: Date;
    ourNumber: string;
    unreadCount: number;
  }>([
    { $sort: { contactNumber: 1, createdAt: -1 } },
    {
      $group: {
        _id: '$contactNumber',
        lastBody: { $first: '$body' },
        lastDirection: { $first: '$direction' },
        lastStatus: { $first: '$status' },
        lastAt: { $first: '$createdAt' },
        ourNumber: { $first: '$ourNumber' },
        unreadCount: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ['$direction', 'inbound'] },
                  { $eq: [{ $ifNull: ['$readAt', null] }, null] },
                ],
              },
              1,
              0,
            ],
          },
        },
      },
    },
    { $sort: { lastAt: -1 } },
    { $limit: CONVERSATION_LIMIT },
  ]);

  return rows.map((row) => ({
    contactNumber: row._id,
    lastBody: row.lastBody,
    lastDirection: row.lastDirection,
    lastStatus: row.lastStatus,
    lastAt: row.lastAt.toISOString(),
    ourNumber: row.ourNumber,
    unreadCount: row.unreadCount,
  }));
}

export async function markConversationRead(contactNumber: string): Promise<void> {
  await Message.updateMany(
    {
      contactNumber,
      direction: 'inbound',
      $or: [{ readAt: { $exists: false } }, { readAt: null }],
    },
    { $set: { readAt: new Date() } },
  );
}

export async function upsertInboundMessage(payload: {
  MessageSid?: string;
  From?: string;
  To?: string;
  Body?: string;
  NumSegments?: string;
}): Promise<MessageDocument | null> {
  const { MessageSid, From, To, Body, NumSegments } = payload;
  if (!MessageSid || !From || !To) {
    logger.warn({ payload }, 'Ignoring inbound SMS webhook with missing fields');
    return null;
  }

  const existing = await Message.findOne({ twilioMessageSid: MessageSid });
  if (existing) {
    return existing;
  }

  const numSegments = NumSegments ? Number.parseInt(NumSegments, 10) : undefined;

  const message = await Message.create({
    contactNumber: From,
    ourNumber: To,
    body: Body ?? '',
    direction: 'inbound',
    status: 'received',
    twilioMessageSid: MessageSid,
    numSegments: Number.isFinite(numSegments) ? numSegments : undefined,
  });

  logger.info(
    { messageId: message._id.toString(), sid: MessageSid, from: From },
    'Stored inbound SMS',
  );
  return message;
}

export async function updateMessageFromStatusWebhook(payload: {
  MessageSid?: string;
  MessageStatus?: string;
  ErrorCode?: string;
  ErrorMessage?: string;
  NumSegments?: string;
}): Promise<MessageDocument | null> {
  const { MessageSid, MessageStatus, ErrorCode, ErrorMessage, NumSegments } = payload;
  if (!MessageSid || !MessageStatus) {
    return null;
  }

  const message = await Message.findOne({ twilioMessageSid: MessageSid });
  if (!message) {
    logger.warn({ MessageSid, MessageStatus }, 'SMS status webhook for unknown SID');
    return null;
  }

  message.status = asMessageStatus(mapTwilioMessageStatus(MessageStatus));
  if (ErrorCode) message.errorCode = ErrorCode;
  if (ErrorMessage) message.errorMessage = ErrorMessage;
  if (NumSegments) {
    const parsed = Number.parseInt(NumSegments, 10);
    if (Number.isFinite(parsed)) message.numSegments = parsed;
  }
  await message.save();

  logger.info({ MessageSid, status: message.status }, 'Updated SMS from status webhook');
  return message;
}
