const express = require('express');
const app = express();
const PORT = process.env.PORT || 8000;

// Simple CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'https://liv-pulse-frontend.vercel.app');
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

app.post('/api/auth/login', (req, res) => {
  res.status(503).json({ error: 'Authentication temporarily disabled' });
});

app.use('*', (req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, () => {
  console.log(`[INFO] Ultra minimal server running on port ${PORT}`);
  console.log(`[INFO] Health: http://localhost:${PORT}/api/health`);
});

process.on('SIGTERM', () => {
  console.log('[INFO] SIGTERM received, shutting down');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('[INFO] SIGINT received, shutting down');
  process.exit(0);
});