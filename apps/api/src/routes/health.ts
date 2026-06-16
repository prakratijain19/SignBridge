import { Router, type Response } from 'express';
import type { ApiResponse, HealthStatus } from '@signbridge/shared-types';
import { prisma } from '../lib/prisma.js';

const VERSION = '0.1.0';
const startedAt = Date.now();

export const healthRouter = Router();

healthRouter.get('/', async (_req, res: Response<ApiResponse<HealthStatus>>) => {
  let database: HealthStatus['dependencies']['database'] = 'connected';
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    database = 'disconnected';
  }

  const status: HealthStatus = {
    status: database === 'connected' ? 'ok' : 'degraded',
    service: 'signbridge-api',
    version: VERSION,
    uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000),
    timestamp: new Date().toISOString(),
    dependencies: { database },
  };

  res.status(status.status === 'ok' ? 200 : 503).json({ success: true, data: status });
});
