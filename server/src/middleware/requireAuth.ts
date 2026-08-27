import type { Request, Response, NextFunction } from 'express';
import { verifyAuthToken } from '../services/authService.js';

declare global {
  namespace Express {
    interface Request {
      auth?: {
        email: string;
      };
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const token = header.slice(7);
  const payload = verifyAuthToken(token);

  if (!payload) {
    res.status(401).json({ error: 'Invalid or expired session' });
    return;
  }

  req.auth = { email: payload.email };
  next();
}
