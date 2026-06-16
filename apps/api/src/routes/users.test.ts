import { describe, expect, it, vi } from 'vitest';
import request from 'supertest';

// Mock Prisma so these tests never touch a live database. The validation and
// auth-guard paths under test short-circuit before any query runs.
vi.mock('../lib/prisma.js', () => ({
  prisma: {
    user: { findUnique: vi.fn(), update: vi.fn() },
    userSettings: { upsert: vi.fn(), update: vi.fn() },
    refreshToken: { updateMany: vi.fn() },
  },
}));

const { createApp } = await import('../app.js');
const { signAccessToken } = await import('../lib/jwt.js');

function authHeader(): string {
  return `Bearer ${signAccessToken({ sub: 'usr_1', role: 'HEARING_USER' })}`;
}

describe('users router auth guard', () => {
  it('rejects an unauthenticated request with 401', async () => {
    const res = await request(createApp()).get('/api/users/me');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });
});

describe('PATCH /api/users/me/settings validation', () => {
  it('rejects an invalid enum value with 400 VALIDATION_ERROR', async () => {
    const res = await request(createApp())
      .patch('/api/users/me/settings')
      .set('Authorization', authHeader())
      .send({ interfaceLanguage: 'xx' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details).toHaveProperty('interfaceLanguage');
  });

  it('rejects an invalid textScale value with 400', async () => {
    const res = await request(createApp())
      .patch('/api/users/me/settings')
      .set('Authorization', authHeader())
      .send({ textScale: 'HUGE' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});
