import { describe, expect, it, vi } from 'vitest';
import request from 'supertest';

// Mock Prisma so importing the app doesn't require a database. The translate
// route itself uses no DB; the test env has no Bhashini creds, so the provider
// resolves to identity (passthrough).
vi.mock('../lib/prisma.js', () => ({ prisma: {} }));

const { createApp } = await import('../app.js');
const { signAccessToken } = await import('../lib/jwt.js');

function authHeader(): string {
  return `Bearer ${signAccessToken({ sub: 'usr_1', role: 'HEARING_USER' })}`;
}

describe('translate auth guard', () => {
  it('rejects an unauthenticated request with 401', async () => {
    const res = await request(createApp())
      .post('/api/translate')
      .send({ text: 'hello', from: 'en', to: 'hi' });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });
});

describe('POST /api/translate', () => {
  it('rejects an invalid language with 400 VALIDATION_ERROR', async () => {
    const res = await request(createApp())
      .post('/api/translate')
      .set('Authorization', authHeader())
      .send({ text: 'hello', from: 'en', to: 'xx' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details).toHaveProperty('to');
  });

  it('returns translated:false for same-language requests', async () => {
    const res = await request(createApp())
      .post('/api/translate')
      .set('Authorization', authHeader())
      .send({ text: 'hello', from: 'en', to: 'en' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.text).toBe('hello');
    expect(res.body.data.translated).toBe(false);
  });

  it('passes through (translated:false) with the identity provider', async () => {
    const res = await request(createApp())
      .post('/api/translate')
      .set('Authorization', authHeader())
      .send({ text: 'hello', from: 'en', to: 'hi' });
    expect(res.status).toBe(200);
    expect(res.body.data.text).toBe('hello');
    expect(res.body.data.translated).toBe(false);
  });
});
