import { Call, type CallDocument } from '../models/Call.js';
import { logger } from '../config/logger.js';
import { config } from '../config/env.js';
import { NotFoundError } from '../utils/errors.js';
import { hangupCall, mapTwilioStatus } from './twilioService.js';
import type { CallStatus } from '../types/index.js';

export function serializeCall(call: CallDocument) {
  return {
    _id: call._id.toString(),
    to: call.to,
    from: call.from,
    twilioCallSid: call.twilioCallSid,
    direction: call.direction,
    status: call.status,
    duration: call.duration,
    startedAt: call.startedAt?.toISOString(),
    endedAt: call.endedAt?.toISOString(),
    createdAt: call.createdAt.toISOString(),
    updatedAt: call.updatedAt.toISOString(),
  };
}

export async function createPendingCall(to: string): Promise<CallDocument> {
  const call = await Call.create({
    to,
    from: config.twilio.phoneNumber,
    direction: 'outbound',
    status: 'pending',
  });

  logger.info({ callId: call._id.toString(), to }, 'Created pending call record');
  return call;
}

export async function getCallBySid(callSid: string): Promise<CallDocument> {
  const call = await Call.findOne({ twilioCallSid: callSid });
  if (!call) {
    throw new NotFoundError('Call not found');
  }
  return call;
}

export async function getCallById(id: string): Promise<CallDocument> {
  const call = await Call.findById(id);
  if (!call) {
    throw new NotFoundError('Call not found');
  }
  return call;
}

export async function listCalls(limit = 50): Promise<CallDocument[]> {
  return Call.find().sort({ createdAt: -1 }).limit(limit);
}

export async function endCall(callSid: string): Promise<CallDocument> {
  const call = await getCallBySid(callSid);
  await hangupCall(callSid);

  call.status = 'canceled';
  call.endedAt = new Date();
  await call.save();

  logger.info({ callSid }, 'Call ended via API');
  return call;
}

export async function linkCallSidToPending(
  callSid: string,
  to: string,
): Promise<CallDocument | null> {
  const pending = await Call.findOneAndUpdate(
    { to, status: 'pending', twilioCallSid: { $exists: false } },
    { twilioCallSid: callSid, status: 'initiated' },
    { sort: { createdAt: -1 }, new: true },
  );

  if (pending) {
    logger.info({ callSid, callId: pending._id.toString() }, 'Linked CallSid to pending record');
    return pending;
  }

  const existing = await Call.findOne({ twilioCallSid: callSid });
  if (existing) return existing;

  const created = await Call.create({
    to,
    from: config.twilio.phoneNumber,
    twilioCallSid: callSid,
    direction: 'outbound',
    status: 'initiated',
  });

  logger.info({ callSid }, 'Created call record from webhook');
  return created;
}

export async function updateCallFromWebhook(params: {
  CallSid: string;
  CallStatus: string;
  CallDuration?: string;
  To?: string;
  From?: string;
}): Promise<CallDocument> {
  const { CallSid, CallStatus, CallDuration, To } = params;
  const status = mapTwilioStatus(CallStatus) as CallStatus;

  let call = await Call.findOne({ twilioCallSid: CallSid });

  if (!call && To) {
    const linked = await linkCallSidToPending(CallSid, To);
    if (linked) call = linked;
  }

  if (!call) {
    call = await Call.create({
      to: To || 'unknown',
      from: config.twilio.phoneNumber,
      twilioCallSid: CallSid,
      direction: 'outbound',
      status,
    });
  }

  call.status = status;

  if (status === 'in-progress' && !call.startedAt) {
    call.startedAt = new Date();
  }

  if (['completed', 'busy', 'failed', 'no-answer', 'canceled'].includes(status)) {
    call.endedAt = new Date();
    if (CallDuration) {
      call.duration = parseInt(CallDuration, 10);
    }
  }

  await call.save();
  logger.info({ callSid: CallSid, status }, 'Updated call from webhook');
  return call;
}

export async function updateCallSidForRecord(
  callId: string,
  callSid: string,
): Promise<CallDocument> {
  const call = await getCallById(callId);
  call.twilioCallSid = callSid;
  call.status = 'initiated';
  await call.save();
  return call;
}
