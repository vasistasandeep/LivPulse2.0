# Render Configuration for Backend Deployment
# This file provides deployment instructions for Render

## Service Configuration
- **Service Type**: Web Service
- **Build Command**: `npm ci && npm run build`
- **Start Command**: `npm start`
- **Node Version**: 18

## Environment Variables
Set the following in Render dashboard:

### Database & Cache
- `DATABASE_URL`: PostgreSQL connection string from Railway
- `REDIS_URL`: Redis connection string from Railway

### Authentication
- `JWT_SECRET`: Strong secret key for JWT tokens
- `JWT_REFRESH_SECRET`: Strong secret key for refresh tokens
- `JWT_EXPIRES_IN`: 15m
- `JWT_REFRESH_EXPIRES_IN`: 7d

### Application URLs
- `FRONTEND_URL`: Your Vercel app URL (e.g., https://livpulse.vercel.app)
- `PORT`: 5000 (or use Render's default PORT env var)

### Email & Communication
- `SMTP_URL`: Email service URL for reports (e.g., smtp://user:pass@smtp.gmail.com:587)

### Application Settings
- `NODE_ENV`: production
- `LOG_LEVEL`: info
- `RATE_LIMIT_WINDOW_MS`: 900000
- `RATE_LIMIT_MAX_REQUESTS`: 100
- `FILE_STORAGE_URL`: postgresql

## Auto-Deploy
Enable auto-deploy from your Git repository main branch.

## Health Check
The service includes a health check endpoint at `/api/health`

## Database Migration
After deployment, run: `npx prisma migrate deploy`