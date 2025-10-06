const express = require('express');
const cors = require('cors');

const app = express();

console.log('🚀 Vercel serverless backend starting...');
console.log('Environment Check:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('VERCEL:', process.env.VERCEL);
console.log('VERCEL_URL:', process.env.VERCEL_URL);

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
    message: 'Vercel serverless backend is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    vercel: !!process.env.VERCEL
  });
});

// Root health check
app.get('/health', (req, res) => {
  console.log('💚 Root health check requested');
  res.status(200).json({ status: 'healthy' });
});

// Root endpoint
app.get('/', (req, res) => {
  console.log('Root requested');
  res.json({
    message: 'LivPulse Vercel Serverless Backend',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

// Test auth endpoint
app.post('/api/auth/login', (req, res) => {
  console.log('Login requested:', req.body);
  res.json({
    message: 'Login endpoint reached on Vercel',
    data: req.body,
    timestamp: new Date().toISOString()
  });
});

// Test auth endpoint (alternative path)
app.post('/auth/login', (req, res) => {
  console.log('Login requested (alt path):', req.body);
  res.json({
    message: 'Login endpoint reached on Vercel (alt path)',
    data: req.body,
    timestamp: new Date().toISOString()
  });
});

// Export for Vercel
module.exports = app;