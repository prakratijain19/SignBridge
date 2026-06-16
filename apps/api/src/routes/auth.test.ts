import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';

// Shared mock handles so each test can tailor Prisma's responses. Declared via
// vi.hoisted so they exist before the module factory below runs.
const mocks = vi.hoisted(() => ({
  findUnique: vi.fn(),
  create: vi.fn(),
  refreshCreate: vi.fn(),
}));

// Mock Prisma so the tests never touch a live database.
vi.mock('../lib/prisma.js', () => ({
  prisma: {
    user: { findUnique: mocks.findUnique, create: mocks.create },
    refreshToken: { create: mocks.refreshCreate },
  },
}));

const { createApp } = await import('../app.js');

const VALID_REGISTER = {
  email: 'new.user@example.com',
  password: 'supersecret',
  name: 'New User',
  role: 'LEARNER' as const,
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.refreshCreate.mockResolvedValue({ id: 'rt_1' });
});

describe('POST /api/auth/register', () => {
  it('creates a user and returns 201 with user + accessToken', async () => {
    mocks.findUnique.mockResolvedValue(null);
    mocks.create.mockResolvedValue({
      id: 'usr_1',
      email: VALID_REGISTER.email,
      name: VALID_REGISTER.name,
      role: VALID_REGISTER.role,
      passwordHash: 'hashed',
    });

    const res = await request(createApp()).post('/api/auth/register').send(VALID_REGISTER);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(VALID_REGISTER.email);
    expect(res.body.data.user.role).toBe('LEARNER');
    expect(typeof res.body.data.accessToken).toBe('string');
    // Secrets must never leak.
    expect(res.body.data.user).not.toHaveProperty('passwordHash');
    // A refresh cookie is set.
    const cookies = res.headers['set-cookie'] as unknown as string[];
    expect(cookies.some((c) => c.startsWith('sb_refresh='))).toBe(true);
  });

  it('rejects a duplicate email with 409', async () => {
    mocks.findUnique.mockResolvedValue({ id: 'existing', email: VALID_REGISTER.email });

    const res = await request(createApp()).post('/api/auth/register').send(VALID_REGISTER);

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('EMAIL_TAKEN');
  });

  it('rejects an invalid body with 400 VALIDATION_ERROR', async () => {
    const res = await request(createApp())
      .post('/api/auth/register')
      .send({ email: 'not-an-email', password: 'short', role: 'ADMIN' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details).toBeTruthy();
    expect(mocks.create).not.toHaveBeenCalled();
  });
});

describe('POST /api/auth/login', () => {
  it('rejects a wrong password with 401 INVALID_CREDENTIALS', async () => {
    mocks.findUnique.mockResolvedValue({
      id: 'usr_1',
      email: 'someone@example.com',
      name: null,
      role: 'HEARING_USER',
      passwordHash: bcrypt.hashSync('the-correct-password', 10),
    });

    const res = await request(createApp())
      .post('/api/auth/login')
      .send({ email: 'someone@example.com', password: 'wrong-password' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });
});
