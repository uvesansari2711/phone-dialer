import type { Request, Response } from 'express';
import { generateVoiceToken } from '../services/twilioService.js';
import { asyncHandler } from '../middleware/errorHandler.js';

export const getToken = asyncHandler(async (_req: Request, res: Response) => {
  const token = generateVoiceToken();
  res.json({ token });
});
