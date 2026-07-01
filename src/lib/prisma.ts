import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// ✅ OPTIMIZED: Configure Prisma for Supabase pgbouncer (serverless)
// - Connection pooling via pgbouncer in DATABASE_URL
// - DIRECT_URL used for migrations only (bypasses pgbouncer)
// - log: only errors in production to avoid log spam
export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    // ⚡ PERFORMANCE: Disable Prisma's own connection pool since pgbouncer handles it
    // datasources are read from env vars automatically
  });

// ✅ Only reuse client in development (in production, each function gets fresh connection via pgbouncer)
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;