import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import '../test/dbSetup.js';
import { createApp } from '../app.js';

const app = createApp();
let authToken = '';

beforeAll(async () => {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin@dialer.com', password: 'Admin@456' })
    .expect(200);

  authToken = res.body.token;
});

function authed() {
  return {
    get: (url: string) => request(app).get(url).set('Authorization', `Bearer ${authToken}`),
    post: (url: string) => request(app).post(url).set('Authorization', `Bearer ${authToken}`),
    patch: (url: string) => request(app).patch(url).set('Authorization', `Bearer ${authToken}`),
  };
}

describe('POST /api/auth/login', () => {
  it('returns a token for valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@dialer.com', password: 'Admin@456' })
      .expect(200);

    expect(res.body.token).toBeDefined();
    expect(res.body.email).toBe('admin@dialer.com');
  });

  it('rejects invalid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@dialer.com', password: 'wrong' })
      .expect(401);

    expect(res.body.error).toContain('Invalid email or password');
  });
});

describe('GET /api/auth/me', () => {
  it('returns the authenticated user', async () => {
    const res = await authed().get('/api/auth/me').expect(200);
    expect(res.body.email).toBe('admin@dialer.com');
  });

  it('requires authentication', async () => {
    await request(app).get('/api/auth/me').expect(401);
  });
});

describe('POST /api/calls', () => {
  it('creates a call with valid number', async () => {
    const res = await authed()
      .post('/api/calls')
      .send({ to: '+919512168389' })
      .expect(201);

    expect(res.body.to).toBe('+919512168389');
    expect(res.body.callId).toBeDefined();
  });

  it('rejects invalid number', async () => {
    const res = await authed().post('/api/calls').send({ to: '123' }).expect(400);

    expect(res.body.error).toContain('valid phone number');
  });

  it('rejects missing number', async () => {
    const res = await authed().post('/api/calls').send({}).expect(400);

    expect(res.body.error).toBeDefined();
  });

  it('rejects invalid caller ID', async () => {
    const res = await authed()
      .post('/api/calls')
      .send({ to: '+919512168389', from: '+19998887777' })
      .expect(400);

    expect(res.body.error).toContain('caller ID');
  });

  it('requires authentication', async () => {
    await request(app).post('/api/calls').send({ to: '+919512168389' }).expect(401);
  });
});

describe('GET /api/health', () => {
  it('returns ok status', async () => {
    const res = await request(app).get('/api/health').expect(200);
    expect(res.body.status).toBe('ok');
  });
});

describe('GET /api/calls', () => {
  beforeAll(async () => {
    await authed().post('/api/calls').send({ to: '+14155552671' });
  });

  it('returns call history', async () => {
    const res = await authed().get('/api/calls').expect(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });
});
