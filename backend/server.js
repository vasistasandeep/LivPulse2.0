const express = require('express');
const app = express();
const PORT = process.env.PORT || 8000;

// Simple CORS
app.use((req, res, next) => {
  const allowedOrigins = [
    'https://liv-pulse-frontend.vercel.app',
    'http://localhost:3000',
    'http://localhost:5173'
  ];
  
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Ultra minimal server working',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

app.get('/api/ping', (req, res) => {
  res.json({ message: 'pong', timestamp: new Date().toISOString() });
});

app.get('/api/debug', (req, res) => {
  res.json({
    message: 'Debug endpoint working',
    port: PORT,
    nodeVersion: process.version,
    platform: process.platform,
    uptime: process.uptime(),
    env: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

app.get('/', (req, res) => {
  res.json({ 
    message: 'LivPulse Backend API v2.0',
    endpoints: ['/api/health', '/api/ping', '/api/debug'],
    timestamp: new Date().toISOString()
  });
});

app.post('/api/auth/login', (req, res) => {
  res.status(503).json({ error: 'Authentication temporarily disabled' });
});

app.use('*', (req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[INFO] Ultra minimal server running on port ${PORT}`);
  console.log(`[INFO] Health: http://localhost:${PORT}/api/health`);
  console.log(`[INFO] Environment: ${process.env.NODE_ENV}`);
  console.log(`[INFO] Working directory: ${process.cwd()}`);
});

process.on('SIGTERM', () => {
  console.log('[INFO] SIGTERM received, shutting down');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('[INFO] SIGINT received, shutting down');
  process.exit(0);
});