import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

import { httpServer } from './app';
import { logger } from './modules/common/utils/logger';
// import { redisClient } from './modules/common/utils/redis';

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Test Redis connection
    // await redisClient.ping();
    // logger.info('Connected to Redis');

    // Start HTTP server
    httpServer.listen(PORT, () => {
      logger.info(`🚀 LivPulse v2.0 Backend running on port ${PORT}`);
      logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();