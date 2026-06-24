import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';

const mocks = vi.hoisted(() => ({ masteryUpsert: vi.fn() }));

vi.mock('../lib/prisma.js', () => ({
  prisma: {
    lessonProgress: { findMany: vi.fn(), upsert: vi.fn() },
    signMastery: { findMany: vi.fn(), upsert: mocks.masteryUpsert },
  },
}));

const { createApp } = await import('../app.js');
const { signAccessToken } = await import('../lib/jwt.js');

function authHeader(): string {
  return `Bearer ${signAccessToken({ sub: 'usr_1', role: 'LEARNER' })}`;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('learning auth guard', () => {
  it('rejects an unauthenticated request with 401', async () => {
    const res = await request(createApp()).get('/api/learning/progress');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });
});

describe('PATCH /api/learning/lessons/:id validation', () => {
  it('rejects an invalid status with 400', async () => {
    const res = await request(createApp())
      .patch('/api/learning/lessons/letters-a-g')
      .set('Authorization', authHeader())
      .send({ status: 'DONE' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details).toHaveProperty('status');
  });
});

describe('POST /api/learning/practice', () => {
  it('records a correct attempt (increments attempt + correct counts)', async () => {
    mocks.masteryUpsert.mockResolvedValue({ label: 'A', attemptCount: 1, correctCount: 1 });

    const res = await request(createApp())
      .post('/api/learning/practice')
      .set('Authorization', authHeader())
      .send({ label: 'A', correct: true });

    expect(res.status).toBe(200);
    expect(res.body.data.mastery).toEqual({ label: 'A', attemptCount: 1, correctCount: 1 });
    // Correct attempts increment both counters.
    const arg = mocks.masteryUpsert.mock.calls[0][0];
    expect(arg.create).toEqual({ userId: 'usr_1', label: 'A', attemptCount: 1, correctCount: 1 });
    expect(arg.update.attemptCount).toEqual({ increment: 1 });
    expect(arg.update.correctCount).toEqual({ increment: 1 });
  });
});
