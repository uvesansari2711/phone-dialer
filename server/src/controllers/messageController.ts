import type { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { ValidationError } from '../utils/errors.js';
import { getParam } from '../utils/params.js';
import { normalizeToE164 } from '../utils/phone.js';
import { resolveSmsFrom } from '../services/phoneNumberService.js';
import {
  listConversations,
  listMessagesForContact,
  markConversationRead,
  sendOutboundMessage,
  serializeMessage,
  syncMessagesFromTwilio,
  validateSmsBody,
} from '../services/messageService.js';

function parseContactNumber(value: string | undefined, label = 'phone number'): string {
  if (!value || typeof value !== 'string') {
    throw new ValidationError(`Please enter a valid ${label}.`);
  }

  try {
    return normalizeToE164(decodeURIComponent(value));
  } catch (err) {
    if (err instanceof Error) {
      throw new ValidationError(err.message);
    }
    throw new ValidationError(`Please enter a valid ${label}.`);
  }
}

export const sendMessage = asyncHandler(async (req: Request, res: Response) => {
  const { to, from, body } = req.body as { to?: string; from?: string; body?: unknown };

  const contactNumber = parseContactNumber(to);
  const messageBody = validateSmsBody(body);

  if (from !== undefined && typeof from !== 'string') {
    throw new ValidationError('Please select a valid sending number.');
  }

  const ourNumber = await resolveSmsFrom(from);
  const message = await sendOutboundMessage(contactNumber, ourNumber, messageBody);
  res.status(201).json(serializeMessage(message));
});

export const getMessages = asyncHandler(async (req: Request, res: Response) => {
  const withNumber = typeof req.query.with === 'string' ? req.query.with : undefined;
  const contactNumber = parseContactNumber(withNumber, 'conversation');
  const shouldSync = req.query.sync === '1' || req.query.sync === 'true';
  if (shouldSync) {
    await syncMessagesFromTwilio();
  }
  const messages = await listMessagesForContact(contactNumber);
  res.json(messages.map(serializeMessage));
});

export const getConversations = asyncHandler(async (_req: Request, res: Response) => {
  const conversations = await listConversations();
  res.json(conversations);
});

export const markRead = asyncHandler(async (req: Request, res: Response) => {
  const contactNumber = parseContactNumber(getParam(req.params.number, 'number'), 'conversation');
  await markConversationRead(contactNumber);
  res.json({ ok: true });
});
