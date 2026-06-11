import { PrismaClient } from '@prisma/client';

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
//
// Learn more:
// https://pris.ly/d/help/next-js-best-practices

const globalForPrisma = global as unknown as { prisma: PrismaClient };

let prisma: PrismaClient;
if (typeof window === 'undefined') {
  // We are in a server environment
  prisma = globalForPrisma.prisma || new PrismaClient();

  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
  }
} else {
  // We are in a browser environment (should not happen in normal operation)
  prisma = new PrismaClient();
}

export { prisma };
