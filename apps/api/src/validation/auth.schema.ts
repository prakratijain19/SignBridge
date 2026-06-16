import { z } from 'zod';
import { SELECTABLE_ROLES } from '@signbridge/shared-types';

/**
 * The three roles a user may self-select at registration. ADMIN is intentionally
 * excluded — it is never assignable through the public API.
 */
const selectableRole = z.enum(SELECTABLE_ROLES as unknown as [string, ...string[]]);

export const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
  name: z.string().trim().min(1).optional(),
  role: selectableRole,
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1, 'Password is required.'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
