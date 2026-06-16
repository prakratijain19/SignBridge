import 'dotenv/config';
import { z } from 'zod';

/**
 * Validates and normalises environment variables at startup. Failing fast here
 * means the rest of the codebase can treat config as guaranteed-present.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  DATABASE_URL: z.string().url(),
  // Auth secrets are optional here so the schema can supply development-only
  // fallbacks below; they are enforced as required in production.
  JWT_ACCESS_SECRET: z.string().min(1).optional(),
  JWT_REFRESH_SECRET: z.string().min(1).optional(),
  ACCESS_TOKEN_TTL: z.string().default('15m'),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(7),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error('Invalid environment configuration:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

const isProduction = parsed.data.NODE_ENV === 'production';

// Development-only fallback secrets keep the API bootable without a configured
// .env, but we refuse to start in production without real secrets.
const DEV_FALLBACK_ACCESS_SECRET = 'dev-only-access-secret-change-me';
const DEV_FALLBACK_REFRESH_SECRET = 'dev-only-refresh-secret-change-me';

let { JWT_ACCESS_SECRET, JWT_REFRESH_SECRET } = parsed.data;

if (!JWT_ACCESS_SECRET || !JWT_REFRESH_SECRET) {
  if (isProduction) {
    // eslint-disable-next-line no-console
    console.error(
      'Invalid environment configuration:',
      'JWT_ACCESS_SECRET and JWT_REFRESH_SECRET are required in production.',
    );
    process.exit(1);
  }
  // eslint-disable-next-line no-console
  console.warn(
    '[env] JWT secrets are not set — using insecure development fallbacks. ' +
      'Set JWT_ACCESS_SECRET and JWT_REFRESH_SECRET before deploying.',
  );
  JWT_ACCESS_SECRET ??= DEV_FALLBACK_ACCESS_SECRET;
  JWT_REFRESH_SECRET ??= DEV_FALLBACK_REFRESH_SECRET;
}

export const env = {
  ...parsed.data,
  JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET,
  corsOrigins: parsed.data.CORS_ORIGIN.split(',').map((o) => o.trim()),
  isProduction,
};
