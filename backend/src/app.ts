import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
// import { initializeWebSocket } from './modules/websocket/websocket.service';

// Module imports
import authRoutes from './modules/auth/auth.routes';
// import userRoutes from './modules/users/users.routes';
// import dashboardRoutes from './modules/dashboards/dashboards.routes';
import dataInputRoutes from './modules/data-input/data-input.routes';
// import reportingRoutes from './modules/reporting/reporting.routes';

// Common middleware
import { errorHandler } from './modules/common/middleware/error.middleware';
import { notFound } from './modules/common/middleware/notFound.middleware';
import { requestLogger } from './modules/common/middleware/logger.middleware';

// Utils
// import { redisClient } from './modules/common/utils/redis';
import { logger } from './modules/common/utils/logger';

const app = express();
const httpServer = createServer(app);

// Initialize WebSocket service
// const webSocketService = initializeWebSocket(httpServer);

// Make WebSocket service available to routes
// app.set('webSocket', webSocketService);

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
].filter(Boolean);

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api', limiter);

// General middleware
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));
}

app.use(requestLogger);
// Request body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: '2.0.0',
  });
});

// Debug endpoint to create test user (remove in production)
app.post('/api/debug/create-test-user', async (req, res) => {
  try {
    const bcrypt = require('bcryptjs');
    const { prisma } = require('./lib/database');
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: 'executive@company.com' }
    });

    if (existingUser) {
      return res.json({ message: 'Test user already exists', email: existingUser.email });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash('executive123', 10);

    // Create test user
    const user = await prisma.user.create({
      data: {
        email: 'executive@company.com',
        password: hashedPassword,
        name: 'Executive User',
        role: 'Executive',
        status: true,
      },
    });

    res.json({ message: 'Test user created successfully', email: user.email });
  } catch (error: any) {
    logger.error('Error creating test user:', error);
    res.status(500).json({ error: 'Failed to create test user', details: error.message });
  }
});

// API routes
app.use('/api/auth', authRoutes);
// app.use('/api/users', userRoutes);
// app.use('/api/dashboards', dashboardRoutes);
app.use('/api/data', dataInputRoutes);
// app.use('/api/reports', reportingRoutes);

// WebSocket connection handling is now managed by WebSocketService

// Error handling
app.use(notFound);
app.use((req, res, next) => {
  res.status(404).json({ error: 'Not Found', message: `Route ${req.method} ${req.originalUrl} not found` });
});
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  
  httpServer.close(() => {
    logger.info('HTTP server closed');
    // redisClient.quit().then(() => {
    //   logger.info('Redis connection closed');
      process.exit(0);
    // });
  });
});

export { app, httpServer };