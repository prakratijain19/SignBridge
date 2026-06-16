import { Router, type CookieOptions, type Request, type Response } from 'express';
import type { ApiResponse, AuthResult, AuthUser } from '@signbridge/shared-types';
import { env } from '../config/env.js';
import { prisma } from '../lib/prisma.js';
import { validateBody } from '../middleware/validate.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { requireAuth } from '../middleware/auth.js';
import { HttpError } from '../middleware/error.js';
import { loginSchema, registerSchema } from '../validation/auth.schema.js';
import {
  login,
  register,
  revokeRefreshToken,
  rotateRefreshToken,
} from '../services/auth.service.js';

const REFRESH_COOKIE = 'sb_refresh';

/** Cookie options shared by set and clear so they always match. */
function refreshCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.isProduction,
    path: '/api/auth',
    maxAge: env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
  };
}

function setRefreshCookie(res: Response, token: string): void {
  res.cookie(REFRESH_COOKIE, token, refreshCookieOptions());
}

function clearRefreshCookie(res: Response): void {
  // Reuse the same path/flags (minus maxAge) so the browser clears the cookie.
  const { maxAge: _maxAge, ...options } = refreshCookieOptions();
  res.clearCookie(REFRESH_COOKIE, options);
}

export const authRouter: Router = Router();

authRouter.post(
  '/register',
  validateBody(registerSchema),
  asyncHandler(async (req: Request, res: Response<ApiResponse<AuthResult>>) => {
    const { user, accessToken, refreshToken } = await register(req.body);
    setRefreshCookie(res, refreshToken);
    res.status(201).json({ success: true, data: { user, accessToken } });
  }),
);

authRouter.post(
  '/login',
  validateBody(loginSchema),
  asyncHandler(async (req: Request, res: Response<ApiResponse<AuthResult>>) => {
    const { user, accessToken, refreshToken } = await login(req.body);
    setRefreshCookie(res, refreshToken);
    res.json({ success: true, data: { user, accessToken } });
  }),
);

authRouter.post(
  '/refresh',
  asyncHandler(async (req: Request, res: Response<ApiResponse<{ accessToken: string }>>) => {
    const raw = req.cookies?.[REFRESH_COOKIE] as string | undefined;
    if (!raw) {
      throw new HttpError(401, 'UNAUTHORIZED', 'No refresh token provided.');
    }
    const { accessToken, refreshToken } = await rotateRefreshToken(raw);
    setRefreshCookie(res, refreshToken);
    res.json({ success: true, data: { accessToken } });
  }),
);

authRouter.post(
  '/logout',
  asyncHandler(async (req: Request, res: Response<ApiResponse<{ success: true }>>) => {
    const raw = req.cookies?.[REFRESH_COOKIE] as string | undefined;
    if (raw) {
      await revokeRefreshToken(raw);
    }
    clearRefreshCookie(res);
    res.json({ success: true, data: { success: true } });
  }),
);

authRouter.get(
  '/me',
  requireAuth,
  asyncHandler(async (req: Request, res: Response<ApiResponse<{ user: AuthUser }>>) => {
    // requireAuth guarantees req.user is present.
    const found = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!found) {
      throw new HttpError(401, 'UNAUTHORIZED', 'User no longer exists.');
    }
    const user: AuthUser = {
      id: found.id,
      email: found.email,
      name: found.name,
      role: found.role,
    };
    res.json({ success: true, data: { user } });
  }),
);
