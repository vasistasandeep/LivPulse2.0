const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8000;

console.log('🚀 Super minimal server starting...');
console.log('='.repeat(50));
console.log('Environment Check:');
console.log('PORT:', PORT);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('Platform:', process.platform);
console.log('Node Version:', process.version);
console.log('Available Memory:', process.memoryUsage());
console.log('='.repeat(50));

// CORS
app.use(cors({
  origin: ['https://liv-pulse-frontend.vercel.app', 'http://localhost:3000'],
  credentials: true
}));

app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  console.log('💚 Health check requested');
  res.status(200).json({
    status: 'ok',
    message: 'Super minimal server is running',
    timestamp: new Date().toISOString(),
    port: PORT,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Railway health check (sometimes Railway checks root)
app.get('/health', (req, res) => {
  console.log('💚 Railway health check requested');
  res.status(200).json({ status: 'healthy' });
});

// Root
app.get('/', (req, res) => {
  console.log('Root requested');
  res.json({
    message: 'Super minimal LivPulse server',
    status: 'running'
  });
});

// Test auth endpoint
app.post('/api/auth/login', (req, res) => {
  console.log('Login requested:', req.body);
  res.json({
    message: 'Login endpoint reached',
    data: req.body,
    timestamp: new Date().toISOString()
  });
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Super minimal server running on port ${PORT}`);
  console.log(`🌐 Listening on 0.0.0.0:${PORT}`);
  console.log(`✅ Server started successfully at ${new Date().toISOString()}`);
});

// Handle server startup errors
server.on('error', (error) => {
  console.error('❌ Server startup error:', error);
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use`);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

// Error handling
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});