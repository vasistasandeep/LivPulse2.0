import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Simple console logger for startup
const log = (message: string) => console.log(`[${new Date().toISOString()}] ${message}`);

try {
  log('Starting LivPulse Backend...');
  
  // Import app after environment is loaded
  const { httpServer } = require('./app');
  
  const PORT = process.env.PORT || 5000;

  async function startServer() {
    try {
      // Start HTTP server
      httpServer.listen(PORT, () => {
        log(`🚀 LivPulse v2.0 Backend running on port ${PORT}`);
        log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
        log(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
      });
    } catch (error) {
      log(`Failed to start server: ${error}`);
      process.exit(1);
    }
  }

  startServer();
} catch (error) {
  log(`Failed to initialize application: ${error}`);
  log('Starting minimal fallback server...');
  
  // Fallback minimal server
  const express = require('express');
  const cors = require('cors');
  const app = express();
  const PORT = process.env.PORT || 5000;
  
  app.use(cors({ origin: '*' }));
  app.use(express.json());
  
  app.get('/api/health', (req: any, res: any) => {
    res.json({
      status: 'ok-fallback',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'unknown',
      version: '2.0.0-fallback',
    });
  });
  
  app.get('/api/ping', (req: any, res: any) => {
    res.json({ message: 'pong-fallback', timestamp: new Date().toISOString() });
  });
  
  app.listen(PORT, () => {
    log(`🚀 LivPulse v2.0 Backend (fallback) running on port ${PORT}`);
  });
}