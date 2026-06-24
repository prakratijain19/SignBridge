import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';

const mocks = vi.hoisted(() => ({ create: vi.fn() }));

vi.mock('../lib/prisma.js', () => ({
  prisma: { conversation: { create: mocks.create } },
}));

const { createApp } = await import('../app.js');
const { signAccessToken } = await import('../lib/jwt.js');

function authHeader(): string {
  return `Bearer ${signAccessToken({ sub: 'usr_1', role: 'HEARING_USER' })}`;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('calls auth guard', () => {
  it('rejects an unauthenticated create with 401', async () => {
    const res = await request(createApp()).post('/api/calls');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });
});

describe('POST /api/calls', () => {
  it('creates a VIDEO conversation and returns roomId + iceServers', async () => {
    mocks.create.mockResolvedValue({ id: 'conv_1', mode: 'VIDEO' });

    const res = await request(createApp()).post('/api/calls').set('Authorization', authHeader());

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(typeof res.body.data.roomId).toBe('string');
    expect(res.body.data.conversationId).toBe('conv_1');
    expect(Array.isArray(res.body.data.iceServers)).toBe(true);
    expect(res.body.data.iceServers[0].urls).toContain('stun:');
    // The conversation must be created in VIDEO mode for this user.
    expect(mocks.create).toHaveBeenCalledWith({
      data: { userId: 'usr_1', mode: 'VIDEO' },
    });
  });
});
