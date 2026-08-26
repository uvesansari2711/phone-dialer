import type { Request, Response } from 'express';
import {
  createPendingCall,
  endCall,
  getCallBySid,
  listCalls,
  serializeCall,
  updateCallSidForRecord,
} from '../services/callService.js';
import { normalizeToE164 } from '../utils/phone.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { ValidationError } from '../utils/errors.js';
import { mapTwilioError } from '../services/twilioService.js';
import { getParam } from '../utils/params.js';
import { logger } from '../config/logger.js';

export const createCall = asyncHandler(async (req: Request, res: Response) => {
  const { to } = req.body as { to?: string };

  if (!to || typeof to !== 'string') {
    throw new ValidationError('Please enter a valid phone number.');
  }

  let normalized: string;
  try {
    normalized = normalizeToE164(to);
  } catch (err) {
    if (err instanceof Error) {
      throw new ValidationError(err.message);
    }
    throw new ValidationError('Please enter a valid phone number.');
  }

  try {
    const call = await createPendingCall(normalized);
    res.status(201).json({
      callId: call._id.toString(),
      to: normalized,
    });
  } catch (err) {
    logger.error({ err }, 'Failed to create call record');
    throw new ValidationError(mapTwilioError(err));
  }
});

export const linkCallSid = asyncHandler(async (req: Request, res: Response) => {
  const { callId } = req.params;
  const { callSid } = req.body as { callSid?: string };

  if (!callSid) {
    throw new ValidationError('Missing call SID');
  }

  const call = await updateCallSidForRecord(getParam(callId, 'callId'), callSid);
  res.json(serializeCall(call));
});

export const getCalls = asyncHandler(async (_req: Request, res: Response) => {
  const calls = await listCalls();
  res.json(calls.map(serializeCall));
});

export const getCall = asyncHandler(async (req: Request, res: Response) => {
  const call = await getCallBySid(getParam(req.params.callSid, 'callSid'));
  res.json(serializeCall(call));
});

export const endCallHandler = asyncHandler(async (req: Request, res: Response) => {
  const callSid = getParam(req.params.callSid, 'callSid');

  try {
    const call = await endCall(callSid);
    res.json(serializeCall(call));
  } catch (err) {
    logger.error({ err, callSid }, 'Failed to end call');
    throw new ValidationError(mapTwilioError(err));
  }
});

export const healthCheck = asyncHandler(async (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
