import { Router, type Request, type Response } from 'express';
import {
  ISL_VOCABULARY,
  type ApiResponse,
  type IslLabel,
  type SignSampleStats,
} from '@signbridge/shared-types';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { signSampleSchema } from '../validation/sign.schema.js';

interface ExportPayload {
  labels: string[];
  samples: { label: string; features: number[] }[];
}

export const signSamplesRouter: Router = Router();

signSamplesRouter.use(requireAuth);

signSamplesRouter.post(
  '/',
  validateBody(signSampleSchema),
  asyncHandler(async (req: Request, res: Response<ApiResponse<{ id: string }>>) => {
    const sample = await prisma.signSample.create({
      data: {
        userId: req.user!.id,
        label: req.body.label,
        features: req.body.features,
        handCount: req.body.handCount,
      },
      select: { id: true },
    });
    res.status(201).json({ success: true, data: { id: sample.id } });
  }),
);

signSamplesRouter.get(
  '/stats',
  asyncHandler(async (req: Request, res: Response<ApiResponse<{ stats: SignSampleStats[] }>>) => {
    const grouped = await prisma.signSample.groupBy({
      by: ['label'],
      where: { userId: req.user!.id },
      _count: { _all: true },
    });

    const counts = new Map(grouped.map((g) => [g.label, g._count._all]));
    // Return every vocabulary label so the collection UI can show zero counts too.
    const stats: SignSampleStats[] = ISL_VOCABULARY.map((label) => ({
      label,
      count: counts.get(label) ?? 0,
    }));

    res.json({ success: true, data: { stats } });
  }),
);

signSamplesRouter.get(
  '/export',
  asyncHandler(async (req: Request, res: Response<ApiResponse<ExportPayload>>) => {
    const rows = await prisma.signSample.findMany({
      where: { userId: req.user!.id },
      select: { label: true, features: true },
      orderBy: { createdAt: 'asc' },
    });

    const labels = [...new Set(rows.map((r) => r.label))].sort();
    const samples = rows.map((r) => ({
      label: r.label,
      features: r.features as number[],
    }));

    res.json({ success: true, data: { labels, samples } });
  }),
);

signSamplesRouter.delete(
  '/label/:label',
  asyncHandler(
    async (req: Request<{ label: string }>, res: Response<ApiResponse<{ deleted: number }>>) => {
      const result = await prisma.signSample.deleteMany({
        where: { userId: req.user!.id, label: req.params.label as IslLabel },
      });
      res.json({ success: true, data: { deleted: result.count } });
    },
  ),
);
