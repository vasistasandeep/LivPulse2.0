# LivPulse v2.0 Production Environment Variables Guide

This document provides comprehensive environment variable templates for deploying LivPulse v2.0 across different platforms.

## 🚂 Railway (Database & Redis)

### PostgreSQL Configuration
```env
# Automatically provided by Railway
DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/railway
PGHOST=[HOST]
PGPORT=[PORT]
PGUSER=postgres
PGPASSWORD=[PASSWORD]
PGDATABASE=railway
```

### Redis Configuration
```env
# Automatically provided by Railway
REDIS_URL=redis://default:[PASSWORD]@[HOST]:[PORT]
REDIS_HOST=[HOST]
REDIS_PORT=[PORT]
REDIS_PASSWORD=[PASSWORD]
```

## 🎨 Render (Backend API)

### Required Environment Variables
```env
# Database (from Railway)
DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/railway

# Redis (from Railway)
REDIS_URL=redis://default:[PASSWORD]@[HOST]:[PORT]

# JWT Secrets (generate strong secrets)
JWT_SECRET=your-production-jwt-secret-256-bit-key
JWT_REFRESH_SECRET=your-production-refresh-secret-256-bit-key

# CORS Configuration
FRONTEND_URL=https://your-app.vercel.app

# Server Configuration
PORT=10000
NODE_ENV=production

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Features
ENABLE_REAL_TIME=true
ENABLE_FILE_UPLOADS=true
ENABLE_USER_REGISTRATION=false
```

### Render Service Configuration
```yaml
# render.yaml
services:
  - type: web
    name: livpulse-api
    env: node
    buildCommand: cd backend && npm install && npm run build
    startCommand: cd backend && npm start
    healthCheckPath: /api/health
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        fromService:
          type: external
          name: railway-postgres
      - key: REDIS_URL
        fromService:
          type: external
          name: railway-redis
```

## ▲ Vercel (Frontend)

### Environment Variables
```env
# Backend API URL (from Render)
VITE_BACKEND_URL=https://livpulse-api.onrender.com

# WebSocket URL (same as backend)
VITE_WEBSOCKET_URL=https://livpulse-api.onrender.com

# App Configuration
VITE_APP_NAME=LivPulse v2.0
VITE_APP_VERSION=2.0.0

# Features
VITE_ENABLE_REAL_TIME=true
VITE_CSV_MAX_SIZE_MB=10

# Environment
VITE_NODE_ENV=production
```

### Vercel Configuration (vercel.json)
```json
{
  "version": 2,
  "builds": [
    {
      "src": "frontend/package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/frontend/$1"
    }
  ],
  "functions": {
    "frontend/dist/**": {
      "headers": {
        "Cache-Control": "public, max-age=31536000, immutable"
      }
    }
  }
}
```

## 🔐 Security Best Practices

### JWT Secrets Generation
```bash
# Generate strong JWT secrets (256-bit)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Environment Variable Security
- ✅ Use strong, unique secrets for production
- ✅ Enable SSL/TLS for all connections
- ✅ Use environment-specific database credentials
- ✅ Implement proper CORS configuration
- ✅ Enable rate limiting
- ❌ Never commit actual secrets to Git
- ❌ Don't use default passwords
- ❌ Avoid wildcard CORS in production

## 🔄 Deployment Sequence

### 1. Railway Setup
1. Create Railway project
2. Add PostgreSQL service
3. Add Redis service
4. Copy connection strings

### 2. Render Backend Deployment
1. Connect GitHub repository
2. Set root directory: `backend`
3. Set build command: `npm install && npm run build`
4. Set start command: `npm start`
5. Add environment variables
6. Deploy

### 3. Vercel Frontend Deployment
1. Connect GitHub repository
2. Set root directory: `frontend`
3. Set build command: `npm run build`
4. Set output directory: `dist`
5. Add environment variables
6. Deploy

## 📊 Health Checks

### Backend Health Check Endpoint
```typescript
// GET /api/health
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "services": {
    "database": "connected",
    "redis": "connected",
    "websocket": "active"
  }
}
```

### Monitoring URLs
- Backend Health: `https://livpulse-api.onrender.com/api/health`
- Frontend Status: `https://your-app.vercel.app`
- Database: Railway Dashboard
- Redis: Railway Dashboard

## 🚨 Troubleshooting

### Common Issues
1. **Database Connection Failed**
   - Check DATABASE_URL format
   - Verify Railway service is running
   - Check network connectivity

2. **CORS Errors**
   - Verify FRONTEND_URL matches Vercel domain
   - Check protocol (http vs https)
   - Ensure no trailing slashes

3. **WebSocket Connection Failed**
   - Verify VITE_WEBSOCKET_URL
   - Check if Render allows WebSocket connections
   - Ensure proper port configuration

4. **Build Failures**
   - Check Node.js version compatibility
   - Verify all dependencies are listed
   - Check TypeScript compilation

### Environment Validation Script
```bash
#!/bin/bash
# validate-env.sh

echo "🔍 Validating Environment Variables..."

# Check required backend variables
required_backend_vars=(
  "DATABASE_URL"
  "REDIS_URL"
  "JWT_SECRET"
  "JWT_REFRESH_SECRET"
  "FRONTEND_URL"
)

for var in "${required_backend_vars[@]}"; do
  if [ -z "${!var}" ]; then
    echo "❌ Missing required variable: $var"
    exit 1
  else
    echo "✅ $var is set"
  fi
done

echo "🎉 All environment variables validated!"
```

## 📈 Performance Optimization

### Production Settings
```env
# Backend optimizations
NODE_ENV=production
LOG_LEVEL=warn
ENABLE_REQUEST_LOGGING=false

# Database optimizations
DATABASE_CONNECTION_LIMIT=20
DATABASE_QUERY_TIMEOUT=30000

# Redis optimizations
REDIS_CONNECTION_POOL_SIZE=10
REDIS_COMMAND_TIMEOUT=5000

# Rate limiting for production
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000
```

This guide ensures secure, scalable deployment across Railway, Render, and Vercel platforms.