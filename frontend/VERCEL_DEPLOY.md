# Vercel Deployment Guide

## Prerequisites
1. Vercel account
2. GitHub repository

## Frontend Deployment

### Automatic Deployment
1. Connect Vercel to your GitHub repository
2. Vercel will auto-detect Vite configuration
3. Set environment variables in Vercel dashboard

### Environment Variables
Set in Vercel dashboard:
- `VITE_BACKEND_URL`: Your Render backend URL (e.g., https://livpulse-backend.onrender.com)
- `VITE_WEBSOCKET_URL`: Same as backend URL
- `VITE_APP_NAME`: LivPulse v2.0
- `VITE_APP_VERSION`: 2.0.0
- `VITE_ENABLE_REAL_TIME`: true
- `VITE_CSV_MAX_SIZE_MB`: 10

### Build Configuration
Vercel will automatically:
- Run `npm ci` to install dependencies
- Run `npm run build` to build the app
- Deploy the `dist` folder
- Configure SPA routing

### Custom Domain
1. Add custom domain in Vercel dashboard
2. Configure DNS records
3. SSL is automatically handled

### Performance
- Vercel automatically optimizes static assets
- Global CDN distribution
- Automatic HTTPS
- Edge functions support