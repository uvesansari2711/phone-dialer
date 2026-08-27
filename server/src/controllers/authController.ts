import type { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { createAuthToken, validateCredentials } from '../services/authService.js';
import { ValidationError, AppError } from '../utils/errors.js';

export const login = asyncHandler(async (req: Request, res: Response) => {
  const email = req.body.email as string | undefined;
  const password = req.body.password as string | undefined;

  if (!email?.trim() || !password) {
    throw new ValidationError('Email and password are required');
  }

  if (!validateCredentials(email, password)) {
    throw new AppError('Invalid email or password', 401);
  }

  const normalizedEmail = email.trim().toLowerCase();
  const token = createAuthToken(normalizedEmail);

  res.json({ token, email: normalizedEmail });
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  res.json({ email: req.auth?.email });
});
