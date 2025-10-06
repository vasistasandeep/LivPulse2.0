import { PrismaClient } from '@prisma/client';

// Enhanced logger for database operations
const dbLogger = {
  info: (message: string) => console.log(`[DB INFO] ${message}`),
  error: (message: string) => console.error(`[DB ERROR] ${message}`),
  warn: (message: string) => console.warn(`[DB WARN] ${message}`)
};

// Global Prisma client instance
declare global {
  var __prisma: PrismaClient | undefined;
}

// Create Prisma client with optimized configuration
function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'info', 'warn', 'error']
      : ['error', 'warn'],
    errorFormat: process.env.NODE_ENV === 'development' ? 'pretty' : 'minimal',
  });
}

// Initialize Prisma client with singleton pattern
let prisma: PrismaClient;

if (process.env.NODE_ENV === 'production') {
  prisma = createPrismaClient();
} else {
  if (!global.__prisma) {
    global.__prisma = createPrismaClient();
  }
  prisma = global.__prisma;
}

// Connection management functions
export async function connectDatabase(): Promise<void> {
  try {
    await prisma.$connect();
    dbLogger.info('Database connected successfully');
    
    // Test the connection
    await prisma.$queryRaw`SELECT 1`;
    dbLogger.info('Database connection verified');
    
  } catch (error: any) {
    dbLogger.error(`Database connection failed: ${error.message}`);
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  try {
    await prisma.$disconnect();
    dbLogger.info('Database disconnected successfully');
  } catch (error: any) {
    dbLogger.error(`Database disconnection failed: ${error.message}`);
  }
}

// Health check function
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    dbLogger.error('Database health check failed');
    return false;
  }
}

// Graceful shutdown handler
process.on('beforeExit', async () => {
  await disconnectDatabase();
});

// Export the Prisma client
export { prisma };
export default prisma;