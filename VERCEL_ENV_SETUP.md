# Environment Variables Setup for Vercel Deployment

## Required Environment Variables

To configure the frontend deployment in Vercel, you need to set the following environment variables in the Vercel dashboard:

### 1. VITE_BACKEND_URL
- **Value**: `https://livpulse-backend-production.up.railway.app`
- **Description**: Backend API URL for Railway deployment
- **Required**: Yes (has fallback in code, but setting explicitly is recommended)

### 2. VITE_APP_TITLE (Optional)
- **Value**: `LivPulse v2.0 - OTT Platform Management`
- **Description**: Application title shown in browser
- **Required**: No (has default fallback)

## How to Set Environment Variables in Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variables:

```
Name: VITE_BACKEND_URL
Value: https://livpulse-backend-production.up.railway.app
Environments: Production, Preview, Development

Name: VITE_APP_TITLE
Value: LivPulse v2.0 - OTT Platform Management
Environments: Production, Preview, Development
```

4. Click **Save**
5. Redeploy your application for changes to take effect

## Frontend Configuration

The frontend has been configured with fallback values in `/src/config/index.ts`:

```typescript
export const config = {
  BACKEND_URL: import.meta.env.VITE_BACKEND_URL || 'https://livpulse-backend-production.up.railway.app',
  APP_TITLE: import.meta.env.VITE_APP_TITLE || 'LivPulse v2.0',
  NODE_ENV: import.meta.env.NODE_ENV || 'production',
} as const;
```

This ensures the application works even if environment variables are not set, using the Railway backend URL as the default.

## Testing

After setting environment variables:
1. Trigger a new deployment in Vercel
2. Visit your deployed frontend URL
3. Try logging in - it should now connect to the Railway backend properly
4. Check browser dev tools to confirm API calls go to `https://livpulse-backend-production.up.railway.app`

## Current Deployment Status

- **Backend**: ✅ Deployed to Railway at `https://livpulse-backend-production.up.railway.app`
- **Frontend**: ✅ Deployed to Vercel (needs environment variables)
- **Auth Endpoints**: ✅ Available at `/api/auth/login`, `/api/auth/register`
- **Health Check**: ✅ Available at `/api/health`