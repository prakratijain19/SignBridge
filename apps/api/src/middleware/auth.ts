import type { NextFunction, Request, Response } from 'express';
import type { Role } from '@prisma/client';
import { verifyAccessToken } from '../lib/jwt.js';
import { HttpError } from './error.js';

/** The authenticated principal attached to the request by `requireAuth`. */
export interface RequestUser {
  id: string;
  role: Role;
}

// Augment Express' Request so `req.user` is typed everywhere downstream.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: RequestUser;
    }
  }
}

/**
 * Guards a route by requiring a valid `Authorization: Bearer <token>` header.
 * On success attaches `req.user`; otherwise throws 401.
 */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    throw new HttpError(401, 'UNAUTHORIZED', 'Authentication required.');
  }

  const token = header.slice('Bearer '.length).trim();
  try {
    const { sub, role } = verifyAccessToken(token);
    req.user = { id: sub, role };
    next();
  } catch {
    throw new HttpError(401, 'UNAUTHORIZED', 'Invalid or expired access token.');
  }
}
