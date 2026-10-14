import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import '../test/dbSetup.js';

vi.mock('../services/twilioService.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../services/twilioService.js')>();
  return {
    ...actual,
    sendSms: vi.fn().mockResolvedValue({ sid: 'SMtestapi', status: 'queued', numSegments: 1 }),
  };
});

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
  };
}

describe('POST /api/messages', () => {
  it('sends an SMS with a valid number', async () => {
    const res = await authed()
      .post('/api/messages')
      .send({ to: '+919512168389', from: '+14155552671', body: 'Hello there' })
      .expect(201);

    expect(res.body.contactNumber).toBe('+919512168389');
    expect(res.body.body).toBe('Hello there');
    expect(res.body.direction).toBe('outbound');
    expect(res.body.twilioMessageSid).toBe('SMtestapi');
  });

  it('rejects an invalid number', async () => {
    const res = await authed()
      .post('/api/messages')
      .send({ to: '123', body: 'Hello' })
      .expect(400);

    expect(res.body.error).toContain('valid phone number');
  });

  it('rejects an empty body', async () => {
    const res = await authed()
      .post('/api/messages')
      .send({ to: '+919512168389', body: '   ' })
      .expect(400);

    expect(res.body.error).toContain('message');
  });

  it('rejects a voice-only from number', async () => {
    const res = await authed()
      .post('/api/messages')
      .send({ to: '+919512168389', from: '+14155552672', body: 'Hello' })
      .expect(400);

    expect(res.body.error).toContain('cannot send SMS');
  });

  it('requires authentication', async () => {
    await request(app)
      .post('/api/messages')
      .send({ to: '+919512168389', body: 'Hello' })
      .expect(401);
  });
});

describe('GET /api/messages and conversations', () => {
  beforeEach(async () => {
    await authed()
      .post('/api/messages')
      .send({ to: '+919512168389', from: '+14155552671', body: 'Thread starter' });
  });

  it('returns a thread for a contact', async () => {
    const res = await authed()
      .get(`/api/messages?with=${encodeURIComponent('+919512168389')}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0].contactNumber).toBe('+919512168389');
  });

  it('returns conversation summaries', async () => {
    const res = await authed().get('/api/conversations').expect(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].contactNumber).toBe('+919512168389');
  });

  it('marks a conversation read', async () => {
    const res = await authed()
      .post(`/api/conversations/${encodeURIComponent('+919512168389')}/read`)
      .expect(200);
    expect(res.body.ok).toBe(true);
  });
});
