import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';

const mocks = vi.hoisted(() => ({
  contactFindUnique: vi.fn(),
}));

vi.mock('../lib/prisma.js', () => ({
  prisma: {
    emergencyContact: {
      findUnique: mocks.contactFindUnique,
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
    },
    quickPhrase: { findUnique: vi.fn(), findMany: vi.fn(), create: vi.fn() },
    emergencyEvent: { findMany: vi.fn(), create: vi.fn(), deleteMany: vi.fn() },
  },
}));

const { createApp } = await import('../app.js');
const { signAccessToken } = await import('../lib/jwt.js');

function authHeader(sub = 'usr_1'): string {
  return `Bearer ${signAccessToken({ sub, role: 'DEAF_USER' })}`;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('emergency auth guard', () => {
  it('rejects an unauthenticated request with 401', async () => {
    const res = await request(createApp()).get('/api/emergency/contacts');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });
});

describe('emergency contact ownership', () => {
  it("returns 404 when editing another user's contact", async () => {
    mocks.contactFindUnique.mockResolvedValue({ id: 'c1', userId: 'someone_else' });
    const res = await request(createApp())
      .patch('/api/emergency/contacts/c1')
      .set('Authorization', authHeader('usr_1'))
      .send({ name: 'New' });
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});

describe('emergency validation', () => {
  it('rejects a contact with too-short phone (400)', async () => {
    const res = await request(createApp())
      .post('/api/emergency/contacts')
      .set('Authorization', authHeader())
      .send({ name: 'Mom', phone: 'x' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details).toHaveProperty('phone');
  });

  it('rejects an empty quick phrase (400)', async () => {
    const res = await request(createApp())
      .post('/api/emergency/phrases')
      .set('Authorization', authHeader())
      .send({ text: '', language: 'en' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});
