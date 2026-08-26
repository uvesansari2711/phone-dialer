import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import '../test/dbSetup.js';
import { createApp } from '../app.js';

const app = createApp();

describe('POST /api/calls', () => {
  it('creates a call with valid number', async () => {
    const res = await request(app)
      .post('/api/calls')
      .send({ to: '+919512168389' })
      .expect(201);

    expect(res.body.to).toBe('+919512168389');
    expect(res.body.callId).toBeDefined();
  });

  it('rejects invalid number', async () => {
    const res = await request(app).post('/api/calls').send({ to: '123' }).expect(400);

    expect(res.body.error).toContain('valid phone number');
  });

  it('rejects missing number', async () => {
    const res = await request(app).post('/api/calls').send({}).expect(400);

    expect(res.body.error).toBeDefined();
  });

  it('rejects invalid caller ID', async () => {
    const res = await request(app)
      .post('/api/calls')
      .send({ to: '+919512168389', from: '+19998887777' })
      .expect(400);

    expect(res.body.error).toContain('caller ID');
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
    await request(app).post('/api/calls').send({ to: '+14155552671' });
  });

  it('returns call history', async () => {
    const res = await request(app).get('/api/calls').expect(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });
});
