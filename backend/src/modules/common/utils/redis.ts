import { createClient } from 'redis';
import { logger } from './logger';

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

redisClient.on('error', (err) => {
  logger.error('Redis Client Error:', err);
});

redisClient.on('connect', () => {
  logger.info('Connected to Redis');
});

redisClient.on('ready', () => {
  logger.info('Redis client ready');
});

redisClient.on('end', () => {
  logger.info('Redis connection ended');
});

// Connect to Redis with graceful fallback
let isRedisConnected = false;
(async () => {
  try {
    // Only attempt Redis connection if REDIS_URL is provided
    if (process.env.REDIS_URL) {
      await redisClient.connect();
      isRedisConnected = true;
      logger.info('Redis connected successfully');
    } else {
      logger.warn('No REDIS_URL provided, running without Redis');
    }
  } catch (error) {
    logger.error('Failed to connect to Redis, continuing without Redis:', error);
    isRedisConnected = false;
  }
})();

// Safe Redis operations with fallback
const safeRedisClient = {
  async setex(key: string, seconds: number, value: string) {
    if (!isRedisConnected) {
      logger.warn(`Redis operation skipped (setex): ${key}`);
      return null;
    }
    try {
      return await redisClient.setEx(key, seconds, value);
    } catch (error) {
      logger.error('Redis setex error:', error);
      return null;
    }
  },

  async get(key: string) {
    if (!isRedisConnected) {
      logger.warn(`Redis operation skipped (get): ${key}`);
      return null;
    }
    try {
      return await redisClient.get(key);
    } catch (error) {
      logger.error('Redis get error:', error);
      return null;
    }
  },

  async del(key: string) {
    if (!isRedisConnected) {
      logger.warn(`Redis operation skipped (del): ${key}`);
      return 0;
    }
    try {
      return await redisClient.del(key);
    } catch (error) {
      logger.error('Redis del error:', error);
      return 0;
    }
  }
};

export { safeRedisClient as redisClient };