import { PrismaClient } from '@prisma/client';
import { logger } from '../modules/common/utils/logger';

// Global Prisma client instance with proper configuration
declare global {
  var __prisma: PrismaClient | undefined;
}

// Use a global variable to prevent multiple instances in development
// due to hot reloading
let prisma: PrismaClient;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient({
    log: ['error', 'warn'],
    errorFormat: 'minimal',
  });
} else {
  if (!global.__prisma) {
    global.__prisma = new PrismaClient({
      log: ['query', 'info', 'warn', 'error'],
      errorFormat: 'pretty',
    });
  }
  prisma = global.__prisma;
}

// Handle graceful shutdown
process.on('beforeExit', async () => {
  try {
    await prisma.$disconnect();
    logger.info('Prisma client disconnected');
  } catch (error: any) {
    logger.error('Error disconnecting Prisma client:', error);
  }
});

// Test database connection on startup
prisma.$connect()
  .then(() => {
    logger.info('Database connected successfully');
  })
  .catch((error: any) => {
    logger.error('Failed to connect to database:', error);
    process.exit(1);
  });

export { prisma };
export default prisma;