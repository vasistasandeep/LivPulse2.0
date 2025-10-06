const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8000;

console.log('🚀 Super minimal server starting...');
console.log('PORT:', PORT);
console.log('NODE_ENV:', process.env.NODE_ENV);

// CORS
app.use(cors({
  origin: ['https://liv-pulse-frontend.vercel.app', 'http://localhost:3000'],
  credentials: true
}));

app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  console.log('Health check requested');
  res.json({
    status: 'ok',
    message: 'Super minimal server is running',
    timestamp: new Date().toISOString(),
    port: PORT
  });
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
app.listen(PORT, () => {
  console.log(`🚀 Super minimal server running on port ${PORT}`);
});

// Error handling
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});