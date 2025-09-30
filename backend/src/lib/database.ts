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
  .then(async () => {
    logger.info('Database connected successfully');
    
    // In production, check if tables exist
    if (process.env.NODE_ENV === 'production') {
      try {
        // Check if tables exist by trying a simple query
        await prisma.user.count();
        logger.info('Database schema is ready');
      } catch (error: any) {
        if (error.code === 'P2021' || error.message.includes('table') || error.message.includes('relation')) {
          logger.warn('Database schema not found - tables may need to be created');
        } else {
          logger.error('Database schema check failed:', error.message);
        }
      }
    }
  })
  .catch((error: any) => {
    logger.error('Failed to connect to database:', error);
    // Don't exit the process, let the app start without database for debugging
    logger.warn('Continuing startup without database connection for debugging...');
  });

export { prisma };
export default prisma;