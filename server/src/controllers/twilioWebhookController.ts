import type { Request, Response } from 'express';
import { buildVoiceTwiml } from '../services/twilioService.js';
import { resolveCallerId } from '../services/phoneNumberService.js';
import { normalizeToE164 } from '../utils/phone.js';
import { updateCallFromWebhook } from '../services/callService.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { ValidationError } from '../utils/errors.js';
import { logger } from '../config/logger.js';

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
