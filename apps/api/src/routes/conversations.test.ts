import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';

const mocks = vi.hoisted(() => ({
  findUnique: vi.fn(),
}));

vi.mock('../lib/prisma.js', () => ({
  prisma: {
    conversation: {
      findUnique: mocks.findUnique,
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    message: { create: vi.fn() },
  },
}));

const { createApp } = await import('../app.js');
const { signAccessToken } = await import('../lib/jwt.js');

function authHeader(sub = 'usr_1'): string {
  return `Bearer ${signAccessToken({ sub, role: 'HEARING_USER' })}`;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('conversations auth guard', () => {
  it('rejects an unauthenticated request with 401', async () => {
    const res = await request(createApp()).get('/api/conversations');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });
});

describe('conversation ownership', () => {
  it("returns 404 when accessing another user's conversation", async () => {
    // Conversation exists but belongs to a different user.
    mocks.findUnique.mockResolvedValue({ id: 'conv_1', userId: 'someone_else' });

    const res = await request(createApp())
      .get('/api/conversations/conv_1')
      .set('Authorization', authHeader('usr_1'));

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});

describe('POST /api/conversations/:id/messages validation', () => {
  it('rejects an invalid modality with 400 VALIDATION_ERROR', async () => {
    const res = await request(createApp())
      .post('/api/conversations/conv_1/messages')
      .set('Authorization', authHeader('usr_1'))
      .send({ modality: 'HOLOGRAM', language: 'en', content: 'hi' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details).toHaveProperty('modality');
  });
});
