import { describe, it, expect } from 'vitest';
import {
  createAuthToken,
  validateCredentials,
  verifyAuthToken,
} from '../services/authService.js';

describe('authService', () => {
  it('validates admin credentials', () => {
    expect(validateCredentials('admin@dialer.com', 'Admin@456')).toBe(true);
    expect(validateCredentials('ADMIN@dialer.com', 'Admin@456')).toBe(true);
  });

  it('rejects invalid credentials', () => {
    expect(validateCredentials('admin@dialer.com', 'wrong')).toBe(false);
    expect(validateCredentials('wrong@dialer.com', 'Admin@456')).toBe(false);
  });

  it('creates and verifies auth tokens', () => {
    const token = createAuthToken('admin@dialer.com');
    const payload = verifyAuthToken(token);

    expect(payload?.email).toBe('admin@dialer.com');
  });

  it('rejects tampered tokens', () => {
    const token = createAuthToken('admin@dialer.com');
    const payload = verifyAuthToken(`${token}x`);

    expect(payload).toBeNull();
  });
});
