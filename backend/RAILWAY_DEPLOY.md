# Railway Deployment Guide

## Prerequisites
1. Railway account
2. GitHub repository

## Database Setup

### PostgreSQL Database
1. Create new Railway project
2. Add PostgreSQL service
3. Railway will auto-generate `DATABASE_URL`

### Redis Cache
1. In same Railway project, add Redis service
2. Railway will auto-generate `REDIS_URL`

## Backend Deployment
1. Connect Railway to your GitHub repository
2. Set environment variables in Railway dashboard:
   - `JWT_SECRET` (generate strong secret)
   - `JWT_REFRESH_SECRET` (generate strong secret) 
   - `FRONTEND_URL` (your Vercel domain)
   - `SMTP_URL` (email service)
   - `NODE_ENV=production`

3. Railway will automatically deploy using Dockerfile

## Database Migration
After first deployment:
```bash
railway run npx prisma migrate deploy
```

## Scaling
Railway auto-scales based on usage. For production:
- Consider upgrading to Pro plan
- Monitor database connections
- Set up monitoring/alerts