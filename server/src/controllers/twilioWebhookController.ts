import type { Request, Response } from 'express';
import { buildEmptyMessagingTwiml, buildVoiceTwiml } from '../services/twilioService.js';
import { resolveCallerId } from '../services/phoneNumberService.js';
import { normalizeToE164 } from '../utils/phone.js';
import { updateCallFromWebhook } from '../services/callService.js';
import {
  updateMessageFromStatusWebhook,
  upsertInboundMessage,
} from '../services/messageService.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { ValidationError } from '../utils/errors.js';
import { logger } from '../config/logger.js';

function tryNormalizePhone(value: string | undefined): string | undefined {
  if (!value) return undefined;
  try {
    return normalizeToE164(value);
  } catch {
    return value.trim();
  }
}

export const handleVoice = asyncHandler(async (req: Request, res: Response) => {
  const to = req.body.To as string | undefined;
  const callerIdParam = req.body.CallerId as string | undefined;

  if (!to) {
    throw new ValidationError('Missing destination number');
  }

  let normalized: string;
  try {
    normalized = normalizeToE164(to);
  } catch {
    throw new ValidationError('Invalid destination number');
  }

  const callerId = await resolveCallerId(callerIdParam);

  logger.info({ to: normalized, callerId }, 'Serving TwiML for outbound call');

  const twiml = buildVoiceTwiml(normalized, callerId);
  res.type('text/xml');
  res.send(twiml);
});

export const handleStatus = asyncHandler(async (req: Request, res: Response) => {
  const { CallSid, CallStatus, CallDuration, To, From } = req.body;

  logger.info({ CallSid, CallStatus }, 'Received Twilio status webhook');

  if (CallSid && CallStatus) {
    await updateCallFromWebhook({
      CallSid,
      CallStatus,
      CallDuration,
      To,
      From,
    });
  }

  res.sendStatus(200);
});

export const handleIncomingSms = asyncHandler(async (req: Request, res: Response) => {
  const { MessageSid, From, To, Body, NumSegments } = req.body as {
    MessageSid?: string;
    From?: string;
    To?: string;
    Body?: string;
    NumSegments?: string;
  };

  logger.info({ MessageSid, From }, 'Received inbound SMS webhook');

  await upsertInboundMessage({
    MessageSid,
    From: tryNormalizePhone(From),
    To: tryNormalizePhone(To),
    Body,
    NumSegments,
  });

  res.type('text/xml');
  res.send(buildEmptyMessagingTwiml());
});

export const handleSmsStatus = asyncHandler(async (req: Request, res: Response) => {
  const { MessageSid, MessageStatus, ErrorCode, ErrorMessage, NumSegments } = req.body as {
    MessageSid?: string;
    MessageStatus?: string;
    ErrorCode?: string;
    ErrorMessage?: string;
    NumSegments?: string;
  };

  logger.info({ MessageSid, MessageStatus }, 'Received SMS status webhook');

  await updateMessageFromStatusWebhook({
    MessageSid,
    MessageStatus,
    ErrorCode,
    ErrorMessage,
    NumSegments,
  });

  res.sendStatus(200);
});
