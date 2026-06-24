import { z } from 'zod';

export const translateSchema = z.object({
  text: z.string().min(1, 'Text is required.').max(5000),
  from: z.enum(['en', 'hi', 'gu']),
  to: z.enum(['en', 'hi', 'gu']),
});

export type TranslateInput = z.infer<typeof translateSchema>;
