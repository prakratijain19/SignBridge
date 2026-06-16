import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import type { Role } from '@prisma/client';
import { env } from '../config/env.js';

/** Claims carried by the short-lived access token. */
export interface AccessTokenPayload {
  sub: string;
  role: Role;
}

/** Signs a short-lived access JWT for the given user. */
export function signAccessToken(payload: AccessTokenPayload): string {
  const options: jwt.SignOptions = {
    expiresIn: env.ACCESS_TOKEN_TTL as jwt.SignOptions['expiresIn'],
  };
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, options);
}

/** Verifies an access token, returning its claims. Throws if invalid/expired. */
export function verifyAccessToken(token: string): AccessTokenPayload {
  const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
  if (
    typeof decoded !== 'object' ||
    decoded === null ||
    typeof decoded.sub !== 'string' ||
    typeof (decoded as { role?: unknown }).role !== 'string'
  ) {
    throw new Error('Malformed access token payload');
  }
  return { sub: decoded.sub, role: (decoded as { role: Role }).role };
}

/** Generates a cryptographically-random opaque refresh token (sent to client). */
export function generateRefreshToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Hashes a raw refresh token for storage/comparison. Only the hash is persisted
 * so a database leak cannot be replayed as valid tokens.
 */
export function hashToken(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex');
}
