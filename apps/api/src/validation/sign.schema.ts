import { z } from 'zod';
import { ISL_VOCABULARY, SIGN_FEATURE_LENGTH } from '@signbridge/shared-types';

export const signSampleSchema = z.object({
  label: z.enum(ISL_VOCABULARY as unknown as [string, ...string[]]),
  features: z
    .array(z.number())
    .length(SIGN_FEATURE_LENGTH, `features must contain exactly ${SIGN_FEATURE_LENGTH} numbers.`),
  handCount: z.union([z.literal(1), z.literal(2)]),
});

export type SignSampleInputValidated = z.infer<typeof signSampleSchema>;
