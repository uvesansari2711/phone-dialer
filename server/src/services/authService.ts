import crypto from 'crypto';
import { config } from '../config/env.js';

interface TokenPayload {
  email: string;
  exp: number;
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

export function validateCredentials(email: string, password: string): boolean {
  const normalizedEmail = email.trim().toLowerCase();
  const expectedEmail = config.auth.adminEmail.toLowerCase();

  return (
    safeEqual(normalizedEmail, expectedEmail) &&
    safeEqual(password, config.auth.adminPassword)
  );
}

export function createAuthToken(email: string): string {
  const payload: TokenPayload = {
    email: email.trim().toLowerCase(),
    exp: Date.now() + config.auth.tokenTtlMs,
  };
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', config.auth.secret)
    .update(data)
    .digest('base64url');

  return `${data}.${signature}`;
}

export function verifyAuthToken(token: string): TokenPayload | null {
  const [data, signature] = token.split('.');
  if (!data || !signature) {
    return null;
  }

  const expectedSignature = crypto
    .createHmac('sha256', config.auth.secret)
    .update(data)
    .digest('base64url');

  if (signature !== expectedSignature) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString()) as TokenPayload;
    if (payload.exp < Date.now()) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}
