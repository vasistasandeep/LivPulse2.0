import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import modules with error handling
import { logger } from './modules/common/utils/logger';
import { errorHandler } from './modules/common/middleware/error.middleware';
import { notFound } from './modules/common/middleware/notFound.middleware';

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 8000;

// Trust proxy for Railway/production
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Performance middleware
app.use(compression());

// CORS configuration
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://liv-pulse-frontend.vercel.app',
  process.env.FRONTEND_URL
].filter((origin): origin is string => Boolean(origin));

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined', { 
    stream: { write: (message) => logger.info(message.trim()) } 
  }));
}

// Health check endpoints
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'LivPulse Backend v2.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: '2.0.0',
  });
});

app.get('/api/ping', (req, res) => {
  res.json({ 
    message: 'pong', 
    timestamp: new Date().toISOString(),
    server: 'LivPulse v2.0'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'LivPulse Backend API v2.0',
    status: 'active',
    endpoints: {
      health: '/api/health',
      ping: '/api/ping',
      auth: '/api/auth/*',
      data: '/api/data/*'
    },
    timestamp: new Date().toISOString()
  });
});

// Database connection check
app.get('/api/debug/database', async (req, res) => {
  try {
    const { prisma } = await import('./lib/database');
    
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    
    res.json({
      status: 'connected',
      message: 'Database connection successful',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    logger.error('Database connection failed:', error);
    res.status(500).json({
      status: 'error',
      message: 'Database connection failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal error',
      timestamp: new Date().toISOString()
    });
  }
});

// Load routes with error handling
async function loadRoutes() {
  try {
    // Auth routes
    const authRoutes = await import('./modules/auth/auth.routes');
    app.use('/api/auth', authRoutes.default);
    logger.info('Auth routes loaded successfully');
  } catch (error) {
    logger.error('Failed to load auth routes:', error);
    
    // Fallback auth endpoints
    app.post('/api/auth/login', (req, res) => {
      res.status(503).json({ 
        error: 'Authentication service temporarily unavailable',
        message: 'Please try again later'
      });
    });
    
    app.post('/api/auth/register', (req, res) => {
      res.status(503).json({ 
        error: 'Registration service temporarily unavailable',
        message: 'Please try again later'
      });
    });
  }

  try {
    // Data input routes
    const dataInputRoutes = await import('./modules/data-input/data-input.routes');
    app.use('/api/data', dataInputRoutes.default);
    logger.info('Data input routes loaded successfully');
  } catch (error) {
    logger.error('Failed to load data input routes:', error);
  }
}

// Initialize database and load routes
async function initializeApp() {
  try {
    // Initialize database connection
    const { prisma } = await import('./lib/database');
    await prisma.$connect();
    logger.info('Database connected successfully');
    
    // Load application routes
    await loadRoutes();
    
    logger.info('Application initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize application:', error);
    
    // Continue with basic functionality even if database fails
    await loadRoutes();
    logger.warn('Application started with limited functionality');
  }
}

// Error handling middleware
app.use(errorHandler);
app.use(notFound);

// Graceful shutdown
async function gracefulShutdown(signal: string) {
  logger.info(`${signal} received, shutting down gracefully...`);
  
  httpServer.close(async () => {
    try {
      const { prisma } = await import('./lib/database');
      await prisma.$disconnect();
      logger.info('Database connection closed');
    } catch (error) {
      logger.warn('Database cleanup failed:', error);
    }
    
    logger.info('Server shutdown complete');
    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
}

// Signal handlers
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Error handlers
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start server
async function startServer() {
  try {
    await initializeApp();
    
    httpServer.listen(Number(PORT), '0.0.0.0', () => {
      logger.info(`🚀 LivPulse Backend v2.0 running on port ${PORT}`);
      logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🔗 Health check: http://localhost:${PORT}/api/health`);
      logger.info(`🎯 API Documentation: http://localhost:${PORT}/`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the application
startServer();

export { app, httpServer };