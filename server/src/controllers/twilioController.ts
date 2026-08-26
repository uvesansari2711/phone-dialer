import type { Request, Response } from 'express';
import { generateVoiceToken } from '../services/twilioService.js';
import { getOutgoingPhoneNumbers } from '../services/phoneNumberService.js';
import { asyncHandler } from '../middleware/errorHandler.js';

export const getToken = asyncHandler(async (_req: Request, res: Response) => {
  const token = generateVoiceToken();
  res.json({ token });
});

export const getPhoneNumbers = asyncHandler(async (_req: Request, res: Response) => {
  const numbers = await getOutgoingPhoneNumbers();
  res.json({
    numbers,
    default: numbers[0]?.phoneNumber ?? '',
  });
});
