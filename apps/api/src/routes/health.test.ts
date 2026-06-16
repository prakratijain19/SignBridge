import { describe, expect, it, vi } from 'vitest';
import request from 'supertest';

// Mock Prisma so the test does not require a live database connection.
vi.mock('../lib/prisma.js', () => ({
  prisma: { $queryRaw: vi.fn().mockResolvedValue([{ '?column?': 1 }]) },
}));

const { createApp } = await import('../app.js');

describe('GET /api/health', () => {
  it('returns ok status with the expected envelope', async () => {
    const res = await request(createApp()).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.service).toBe('signbridge-api');
    expect(res.body.data.dependencies.database).toBe('connected');
  });
});
