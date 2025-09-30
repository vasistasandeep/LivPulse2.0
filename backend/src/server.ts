import { app, httpServer } from './app';

const PORT = process.env.PORT || 8000;

async function startServer() {
  try {
    // Try to initialize database
    try {
      console.log('[INFO] Initializing database connection...');
      const { prisma } = await import('./lib/database');
      await prisma.$connect();
      console.log('[INFO] Database initialized successfully');
    } catch (dbError: any) {
      console.error('[ERROR] Database initialization failed:', dbError.message);
      console.log('[WARN] Server will start without database connection');
    }

    // Start HTTP server
    httpServer.listen(PORT, () => {
      console.log(`[INFO] Server running on port ${PORT}`);
      console.log(`[INFO] Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`[INFO] Health check: http://localhost:${PORT}/api/health`);
    });

    // Graceful shutdown handlers
    process.on('SIGINT', gracefulShutdown);
    process.on('SIGTERM', gracefulShutdown);

  } catch (error: any) {
    console.error('[ERROR] Failed to start server:', error.message);
    process.exit(1);
  }
}

async function gracefulShutdown(signal: string) {
  console.log(`[INFO] ${signal} received, shutting down gracefully...`);
  
  httpServer.close(async () => {
    try {
      // Try to close database connection
      const { prisma } = await import('./lib/database');
      await prisma.$disconnect();
      console.log('[INFO] Database connection closed');
    } catch (error) {
      console.log('[WARN] Database cleanup failed:', error);
    }
    
    console.log('[INFO] Server shutdown complete');
    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error('[ERROR] Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('[ERROR] Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[ERROR] Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
startServer();