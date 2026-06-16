import { Router, type Request, type Response } from 'express';
import type {
  ApiResponse,
  UserProfile,
  UserSettings,
} from '@signbridge/shared-types';
import type { UserSettings as PrismaUserSettings, User } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { HttpError } from '../middleware/error.js';
import { hashPassword, verifyPassword } from '../lib/password.js';
import {
  changePasswordSchema,
  updateProfileSchema,
  updateSettingsSchema,
} from '../validation/user.schema.js';

function toProfile(user: User): UserProfile {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
  };
}

function toSettings(s: PrismaUserSettings): UserSettings {
  return {
    interfaceLanguage: s.interfaceLanguage as UserSettings['interfaceLanguage'],
    textScale: s.textScale,
    highContrast: s.highContrast,
    reduceMotion: s.reduceMotion,
    captionsEnabled: s.captionsEnabled,
  };
}

/** Loads the authenticated user, throwing 401 if they no longer exist. */
async function requireUser(userId: string): Promise<User> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new HttpError(401, 'UNAUTHORIZED', 'User no longer exists.');
  }
  return user;
}

/** Returns the user's settings row, lazily creating defaults if absent. */
async function getOrCreateSettings(userId: string): Promise<PrismaUserSettings> {
  return prisma.userSettings.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });
}

export const usersRouter: Router = Router();

usersRouter.use(requireAuth);

usersRouter.get(
  '/me',
  asyncHandler(
    async (
      req: Request,
      res: Response<ApiResponse<{ profile: UserProfile; settings: UserSettings }>>,
    ) => {
      const userId = req.user!.id;
      const user = await requireUser(userId);
      const settings = await getOrCreateSettings(userId);
      res.json({
        success: true,
        data: { profile: toProfile(user), settings: toSettings(settings) },
      });
    },
  ),
);

usersRouter.patch(
  '/me',
  validateBody(updateProfileSchema),
  asyncHandler(async (req: Request, res: Response<ApiResponse<{ profile: UserProfile }>>) => {
    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: { name: req.body.name },
    });
    res.json({ success: true, data: { profile: toProfile(user) } });
  }),
);

usersRouter.get(
  '/me/settings',
  asyncHandler(async (req: Request, res: Response<ApiResponse<{ settings: UserSettings }>>) => {
    const settings = await getOrCreateSettings(req.user!.id);
    res.json({ success: true, data: { settings: toSettings(settings) } });
  }),
);

usersRouter.patch(
  '/me/settings',
  validateBody(updateSettingsSchema),
  asyncHandler(async (req: Request, res: Response<ApiResponse<{ settings: UserSettings }>>) => {
    const userId = req.user!.id;
    // Ensure a row exists, then apply the partial update.
    await getOrCreateSettings(userId);
    const settings = await prisma.userSettings.update({
      where: { userId },
      data: req.body,
    });
    res.json({ success: true, data: { settings: toSettings(settings) } });
  }),
);

usersRouter.patch(
  '/me/password',
  validateBody(changePasswordSchema),
  asyncHandler(async (req: Request, res: Response<ApiResponse<{ success: true }>>) => {
    const userId = req.user!.id;
    const user = await requireUser(userId);

    const valid = await verifyPassword(req.body.currentPassword, user.passwordHash);
    if (!valid) {
      throw new HttpError(400, 'INVALID_PASSWORD', 'Your current password is incorrect.');
    }

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: await hashPassword(req.body.newPassword) },
    });

    // Revoke all existing refresh tokens so other sessions must re-authenticate.
    await prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    res.json({ success: true, data: { success: true } });
  }),
);
