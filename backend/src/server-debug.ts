import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

// Enable CORS for all origins temporarily for debugging
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

// Debug endpoint to check environment
app.get('/api/debug', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      hasJwtSecret: !!process.env.JWT_SECRET,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      hasFrontendUrl: !!process.env.FRONTEND_URL,
      port: PORT
    }
  });
});

// Simple health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'LivPulse Backend Debug',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Simple ping
app.get('/api/ping', (req, res) => {
  res.json({ 
    message: 'pong',
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'LivPulse Backend Debug Mode',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Debug server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔑 JWT Secret configured: ${!!process.env.JWT_SECRET}`);
  console.log(`🗄️ Database URL configured: ${!!process.env.DATABASE_URL}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('👋 Debug server shutting down...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('👋 Debug server shutting down...');
  process.exit(0);
});