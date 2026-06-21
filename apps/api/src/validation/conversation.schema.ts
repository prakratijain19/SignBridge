import { z } from 'zod';

export const createConversationSchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  mode: z.enum(['SPEECH', 'LIVE', 'VIDEO']).default('SPEECH'),
});

export const addMessageSchema = z.object({
  sender: z.enum(['USER', 'PARTNER']).default('USER'),
  modality: z.enum(['SPEECH', 'TEXT', 'SIGN', 'AVATAR']),
  language: z.enum(['en', 'hi', 'gu']),
  content: z.string().min(1, 'Message content is required.').max(5000),
});

export const updateConversationSchema = z.object({
  title: z.string().trim().min(1).max(120),
});

export type CreateConversationInput = z.infer<typeof createConversationSchema>;
export type AddMessageInput = z.infer<typeof addMessageSchema>;
export type UpdateConversationInput = z.infer<typeof updateConversationSchema>;
