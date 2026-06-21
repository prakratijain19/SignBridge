import { describe, expect, it, vi } from 'vitest';
import request from 'supertest';

vi.mock('../lib/prisma.js', () => ({
  prisma: {
    signSample: {
      create: vi.fn(),
      groupBy: vi.fn(),
      findMany: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

const { createApp } = await import('../app.js');
const { signAccessToken } = await import('../lib/jwt.js');

function authHeader(): string {
  return `Bearer ${signAccessToken({ sub: 'usr_1', role: 'LEARNER' })}`;
}

const validFeatures = Array.from({ length: 86 }, () => 0);

describe('sign-samples auth guard', () => {
  it('rejects an unauthenticated request with 401', async () => {
    const res = await request(createApp()).get('/api/sign-samples/stats');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });
});

describe('POST /api/sign-samples validation', () => {
  it('rejects a feature vector of the wrong length with 400', async () => {
    const res = await request(createApp())
      .post('/api/sign-samples')
      .set('Authorization', authHeader())
      .send({ label: 'hello', features: [1, 2, 3], handCount: 1 });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details).toHaveProperty('features');
  });

  it('rejects a label outside the vocabulary with 400', async () => {
    const res = await request(createApp())
      .post('/api/sign-samples')
      .set('Authorization', authHeader())
      .send({ label: 'banana', features: validFeatures, handCount: 2 });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details).toHaveProperty('label');
  });
});
