import type { Request, Response, NextFunction } from 'express';
import { config } from '../config/env.js';
import { validateTwilioRequest } from '../services/twilioService.js';
import { logger } from '../config/logger.js';

function getWebhookUrl(req: Request): string {
  const path = req.originalUrl.split('?')[0];
  return `${config.publicBaseUrl}${path}`;
}

export function validateTwilioSignature(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const signature = req.headers['x-twilio-signature'] as string | undefined;
  const url = getWebhookUrl(req);
  const params = req.body as Record<string, string>;

  const isValid = validateTwilioRequest(signature, url, params);

  if (!isValid) {
    logger.warn({ url }, 'Invalid Twilio webhook signature');
    res.status(403).json({ error: 'Invalid signature' });
    return;
  }

  next();
}
