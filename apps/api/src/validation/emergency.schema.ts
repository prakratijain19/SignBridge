import { z } from 'zod';

const language = z.enum(['en', 'hi', 'gu']);

export const createContactSchema = z.object({
  name: z.string().trim().min(1, 'Name is required.').max(80),
  phone: z.string().trim().min(3, 'Phone is required.').max(20),
  relation: z.string().trim().max(40).optional(),
  isPrimary: z.boolean().optional().default(false),
});

export const updateContactSchema = createContactSchema.partial();

export const createPhraseSchema = z.object({
  text: z.string().trim().min(1, 'Phrase text is required.').max(200),
  language: language.default('en'),
  sortOrder: z.number().int().optional().default(0),
});

export const updatePhraseSchema = createPhraseSchema.partial();

export const createEventSchema = z.object({
  text: z.string().trim().min(1, 'Text is required.').max(500),
  language: language.default('en'),
  channel: z.enum(['spoken', 'displayed', 'contact']).default('spoken'),
});

export type CreateContactInput = z.infer<typeof createContactSchema>;
export type UpdateContactInput = z.infer<typeof updateContactSchema>;
export type CreatePhraseInput = z.infer<typeof createPhraseSchema>;
export type CreateEventInput = z.infer<typeof createEventSchema>;
