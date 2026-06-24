import { z } from 'zod';

export const updateLessonSchema = z.object({
  status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED']),
  score: z.number().int().min(0).max(100).optional(),
});

export const practiceAttemptSchema = z.object({
  label: z.string().trim().min(1).max(40),
  correct: z.boolean(),
});

export type UpdateLessonInput = z.infer<typeof updateLessonSchema>;
export type PracticeAttemptInput = z.infer<typeof practiceAttemptSchema>;
