import type { User } from '@prisma/client';
import type { AuthUser } from '@signbridge/shared-types';
import { prisma } from '../lib/prisma.js';
import { env } from '../config/env.js';
import { hashPassword, verifyPassword } from '../lib/password.js';
import { generateRefreshToken, hashToken, signAccessToken } from '../lib/jwt.js';
import { HttpError } from '../middleware/error.js';
import type { RegisterInput, LoginInput } from '../validation/auth.schema.js';

/** What every auth flow produces: a safe user view plus fresh tokens. */
export interface AuthTokens {
  user: AuthUser;
  accessToken: string;
  /** Raw refresh token — caller sets it as the httpOnly cookie. */
  refreshToken: string;
}

/** Strips secrets, exposing only client-safe user fields. */
function toAuthUser(user: User): AuthUser {
  return { id: user.id, email: user.email, name: user.name, role: user.role };
}

function refreshExpiry(): Date {
  const ms = env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000;
  return new Date(Date.now() + ms);
}

/** Issues a new refresh token for a user and persists only its hash. */
async function issueRefreshToken(userId: string): Promise<string> {
  const raw = generateRefreshToken();
  await prisma.refreshToken.create({
    data: { tokenHash: hashToken(raw), userId, expiresAt: refreshExpiry() },
  });
  return raw;
}

export async function register(input: RegisterInput): Promise<AuthTokens> {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new HttpError(409, 'EMAIL_TAKEN', 'An account with this email already exists.');
  }

  const user = await prisma.user.create({
    data: {
      email: input.email,
      name: input.name ?? null,
      role: input.role as User['role'],
      passwordHash: await hashPassword(input.password),
    },
  });

  const accessToken = signAccessToken({ sub: user.id, role: user.role });
  const refreshToken = await issueRefreshToken(user.id);
  return { user: toAuthUser(user), accessToken, refreshToken };
}

export async function login(input: LoginInput): Promise<AuthTokens> {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  // Always run a comparison-shaped error path to avoid leaking which half failed.
  if (!user || !(await verifyPassword(input.password, user.passwordHash))) {
    throw new HttpError(401, 'INVALID_CREDENTIALS', 'Invalid email or password.');
  }

  const accessToken = signAccessToken({ sub: user.id, role: user.role });
  const refreshToken = await issueRefreshToken(user.id);
  return { user: toAuthUser(user), accessToken, refreshToken };
}

/**
 * Validates the presented refresh token, revokes it, and issues a replacement
 * (rotation). Throws 401 if the token is missing/unknown/revoked/expired.
 */
export async function rotateRefreshToken(rawToken: string): Promise<AuthTokens> {
  const tokenHash = hashToken(rawToken);
  const record = await prisma.refreshToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!record || record.revokedAt || record.expiresAt.getTime() <= Date.now()) {
    throw new HttpError(401, 'INVALID_REFRESH_TOKEN', 'Refresh token is invalid or expired.');
  }

  // Rotate: revoke the presented token and mint a new one.
  await prisma.refreshToken.update({
    where: { id: record.id },
    data: { revokedAt: new Date() },
  });

  const accessToken = signAccessToken({ sub: record.user.id, role: record.user.role });
  const refreshToken = await issueRefreshToken(record.user.id);
  return { user: toAuthUser(record.user), accessToken, refreshToken };
}

/** Best-effort revocation used on logout; silently ignores unknown tokens. */
export async function revokeRefreshToken(rawToken: string): Promise<void> {
  const tokenHash = hashToken(rawToken);
  await prisma.refreshToken.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}
