import bcrypt from 'bcryptjs';

/**
 * Password hashing helpers. We use bcryptjs (pure JS) rather than the native
 * `bcrypt` to avoid native build failures on Windows developer machines.
 */
const COST_FACTOR = 12;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, COST_FACTOR);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
