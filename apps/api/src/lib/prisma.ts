import { PrismaClient } from '@prisma/client';

/**
 * A single shared PrismaClient instance. In development we cache it on the
 * global object so hot-reloading (tsx watch) does not exhaust the connection
 * pool by instantiating a new client on every reload.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
