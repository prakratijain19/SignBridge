import { Router, type Request, type Response } from 'express';
import type {
  ApiResponse,
  LessonProgress as LessonProgressDTO,
  SignMastery as SignMasteryDTO,
} from '@signbridge/shared-types';
import type { LessonProgress, SignMastery } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { updateLessonSchema, practiceAttemptSchema } from '../validation/learning.schema.js';

function toLessonProgress(p: LessonProgress): LessonProgressDTO {
  return { lessonId: p.lessonId, status: p.status, score: p.score };
}
function toMastery(m: SignMastery): SignMasteryDTO {
  return { label: m.label, attemptCount: m.attemptCount, correctCount: m.correctCount };
}

export const learningRouter: Router = Router();

learningRouter.use(requireAuth);

learningRouter.get(
  '/progress',
  asyncHandler(
    async (
      req: Request,
      res: Response<ApiResponse<{ lessons: LessonProgressDTO[]; mastery: SignMasteryDTO[] }>>,
    ) => {
      const userId = req.user!.id;
      const [lessons, mastery] = await Promise.all([
        prisma.lessonProgress.findMany({ where: { userId } }),
        prisma.signMastery.findMany({ where: { userId } }),
      ]);
      res.json({
        success: true,
        data: { lessons: lessons.map(toLessonProgress), mastery: mastery.map(toMastery) },
      });
    },
  ),
);

learningRouter.patch(
  '/lessons/:lessonId',
  validateBody(updateLessonSchema),
  asyncHandler(
    async (
      req: Request<{ lessonId: string }>,
      res: Response<ApiResponse<{ progress: LessonProgressDTO }>>,
    ) => {
      const userId = req.user!.id;
      const { status, score } = req.body;
      const progress = await prisma.lessonProgress.upsert({
        where: { userId_lessonId: { userId, lessonId: req.params.lessonId } },
        create: { userId, lessonId: req.params.lessonId, status, score: score ?? null },
        update: { status, ...(score === undefined ? {} : { score }) },
      });
      res.json({ success: true, data: { progress: toLessonProgress(progress) } });
    },
  ),
);

learningRouter.post(
  '/practice',
  validateBody(practiceAttemptSchema),
  asyncHandler(async (req: Request, res: Response<ApiResponse<{ mastery: SignMasteryDTO }>>) => {
    const userId = req.user!.id;
    const { label, correct } = req.body;
    const mastery = await prisma.signMastery.upsert({
      where: { userId_label: { userId, label } },
      create: { userId, label, attemptCount: 1, correctCount: correct ? 1 : 0 },
      update: {
        attemptCount: { increment: 1 },
        ...(correct ? { correctCount: { increment: 1 } } : {}),
      },
    });
    res.json({ success: true, data: { mastery: toMastery(mastery) } });
  }),
);
