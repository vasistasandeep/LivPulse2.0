# 🛠️ Environment Variables Setup - Step by Step

Follow this guide to set up all environment variables correctly for your LivPulse v2.0 deployment.

## 🎯 Setup Order

```
1. Railway (Databases) → Get connection strings
2. Generate JWT secrets → Save for Render
3. Render (Backend) → Deploy with env vars
4. Vercel (Frontend) → Deploy with backend URL
5. Update Render → Add final Vercel URL
```

---

## Step 1: 🚂 Railway Database Setup

### 1.1 Create Railway Project
1. Go to [railway.app/new](https://railway.app/new)
2. Click **"Empty Project"**
3. Name it **"livpulse-databases"**

### 1.2 Add PostgreSQL
1. In project dashboard: **"+ New"** → **"Database"** → **"PostgreSQL"**
2. Wait for provisioning (1-2 minutes)
3. Click on PostgreSQL service
4. Go to **"Connect"** tab
5. **Copy this value**:
   ```
   DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/railway
   ```

### 1.3 Add Redis
1. **"+ New"** → **"Database"** → **"Redis"**
2. Wait for provisioning (1-2 minutes)
3. Click on Redis service
4. Go to **"Connect"** tab
5. **Copy this value**:
   ```
   REDIS_URL=redis://default:[PASSWORD]@[HOST]:[PORT]
   ```

### ✅ **Save These Values!**
```bash
# Save these for Render setup:
DATABASE_URL=postgresql://postgres:xxxxx@xxxxx.railway.app:5432/railway
REDIS_URL=redis://default:xxxxx@xxxxx.railway.app:6379
```

---

## Step 2: 🔑 Generate JWT Secrets

### 2.1 Open Terminal/Command Prompt
```bash
# Generate JWT Secret (copy the output)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate JWT Refresh Secret (copy the output)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### ✅ **Save These Values!**
```bash
# Example output (yours will be different):
JWT_SECRET=a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456
JWT_REFRESH_SECRET=9876543210fedcba0987654321fedcba0987654321fedcba0987654321fedcba
```

---

## Step 3: 🎨 Render Backend Setup

### 3.1 Create Render Web Service
1. Go to [render.com](https://render.com)
2. **"New +"** → **"Web Service"**
3. Connect GitHub and select **"LivPulse2.0"**
4. Configure:
   ```
   Name: livpulse-backend
   Region: Oregon (US West)
   Branch: main
   Root Directory: backend
   Build Command: npm install && npm run build
   Start Command: npm start
   ```

### 3.2 Add Environment Variables
In Render's **"Environment"** section, add these **one by one**:

#### Required Variables:
```bash
# Database (from Railway Step 1)
DATABASE_URL
Value: postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/railway

REDIS_URL  
Value: redis://default:[PASSWORD]@[HOST]:[PORT]

# JWT (from Step 2)
JWT_SECRET
Value: your-generated-jwt-secret

JWT_REFRESH_SECRET
Value: your-generated-refresh-secret

# Server Config
NODE_ENV
Value: production

PORT
Value: 10000

# CORS (temporary - will update after Vercel)
FRONTEND_URL
Value: https://temp-placeholder.com
```

#### Optional Variables:
```bash
ENABLE_REAL_TIME
Value: true

ENABLE_FILE_UPLOADS  
Value: true

ENABLE_USER_REGISTRATION
Value: false

RATE_LIMIT_WINDOW_MS
Value: 900000

RATE_LIMIT_MAX_REQUESTS
Value: 1000
```

### 3.3 Deploy Backend
1. Click **"Create Web Service"**
2. Wait for build and deployment (5-10 minutes)
3. **Copy your service URL**: `https://livpulse-backend.onrender.com`

### ✅ **Save Backend URL!**
```bash
# Save this for Vercel setup:
BACKEND_URL=https://livpulse-backend.onrender.com
```

---

## Step 4: ▲ Vercel Frontend Setup

### 4.1 Create Vercel Project
1. Go to [vercel.com](https://vercel.com)
2. **"New Project"**
3. Import **"LivPulse2.0"** repository
4. Configure:
   ```
   Project Name: livpulse-frontend
   Framework: Vite
   Root Directory: frontend
   Build Command: npm run build
   Output Directory: dist
   ```

### 4.2 Add Environment Variables
In Vercel's **"Environment Variables"** section, add these:

```bash
# Backend URLs (from Render Step 3)
VITE_BACKEND_URL
Value: https://livpulse-backend.onrender.com

VITE_WEBSOCKET_URL
Value: https://livpulse-backend.onrender.com

# App Config
VITE_APP_NAME
Value: LivPulse v2.0

VITE_APP_VERSION
Value: 2.0.0

VITE_ENABLE_REAL_TIME
Value: true

VITE_CSV_MAX_SIZE_MB
Value: 10
```

### 4.3 Deploy Frontend
1. Click **"Deploy"**
2. Wait for build and deployment (3-5 minutes)
3. **Copy your app URL**: `https://your-app.vercel.app`

### ✅ **Save Frontend URL!**
```bash
# Save this for Render update:
FRONTEND_URL=https://your-app.vercel.app
```

---

## Step 5: 🔗 Connect Services

### 5.1 Update Render CORS
1. Go back to **Render dashboard**
2. Click on your **livpulse-backend** service
3. Go to **"Environment"** tab
4. Find **FRONTEND_URL** variable
5. **Update value** to your Vercel URL:
   ```
   FRONTEND_URL=https://your-app.vercel.app
   ```
6. Click **"Save Changes"**
7. Service will auto-redeploy (2-3 minutes)

---

## 🧪 Step 6: Test Everything

### 6.1 Test Backend Health
Open in browser:
```
https://livpulse-backend.onrender.com/api/health
```

Should return:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "services": {
    "database": "connected",
    "redis": "connected"
  }
}
```

### 6.2 Test Frontend
Open in browser:
```
https://your-app.vercel.app
```

Should load the LivPulse login page.

### 6.3 Test Full Flow
1. Try logging in (if you have test credentials)
2. Check browser console for any CORS errors
3. Verify real-time features work

---

## 📋 Final Checklist

### Railway ✅
- [ ] PostgreSQL service created
- [ ] Redis service created
- [ ] `DATABASE_URL` copied
- [ ] `REDIS_URL` copied

### JWT Secrets ✅
- [ ] `JWT_SECRET` generated (64 characters)
- [ ] `JWT_REFRESH_SECRET` generated (64 characters)
- [ ] Both secrets saved securely

### Render Backend ✅
- [ ] Web service created
- [ ] All required environment variables added
- [ ] Optional environment variables added
- [ ] Service deployed successfully
- [ ] Health check passing
- [ ] Backend URL noted

### Vercel Frontend ✅
- [ ] Project created
- [ ] All environment variables added
- [ ] Frontend deployed successfully  
- [ ] Frontend URL noted

### Integration ✅
- [ ] `FRONTEND_URL` updated in Render
- [ ] Backend redeployed with correct CORS
- [ ] End-to-end testing completed
- [ ] No CORS errors in browser console

---

## 🚨 Troubleshooting

### Issue: "CORS Error" in browser console
**Solution**: Check `FRONTEND_URL` in Render matches Vercel URL exactly
```bash
# Wrong (has trailing slash)
FRONTEND_URL=https://your-app.vercel.app/

# Correct
FRONTEND_URL=https://your-app.vercel.app
```

### Issue: "Database connection failed"
**Solution**: Verify `DATABASE_URL` format and Railway service status
```bash
# Check Railway dashboard - PostgreSQL service should be "Active"
# Verify URL format: postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/railway
```

### Issue: "JWT token invalid"
**Solution**: Ensure JWT secrets are set correctly in Render
```bash
# Secrets should be 64 characters long
# JWT_SECRET and JWT_REFRESH_SECRET should be different
```

### Issue: Frontend shows "Network Error"
**Solution**: Check `VITE_BACKEND_URL` in Vercel matches Render URL
```bash
# Should match your Render service URL exactly
VITE_BACKEND_URL=https://livpulse-backend.onrender.com
```

---

## 💡 Pro Tips

1. **Keep a backup**: Save all environment variables in a secure document
2. **Use descriptive service names**: Makes it easier to identify services later
3. **Test each step**: Don't wait until the end to test - verify each service works
4. **Monitor logs**: Check service logs if something isn't working
5. **Update systematically**: When changing URLs, update all dependent services

---

## 🎉 Success!

If all tests pass, your **LivPulse v2.0** is now fully deployed with:
- ✅ **Secure databases** on Railway
- ✅ **Scalable API** on Render
- ✅ **Fast frontend** on Vercel
- ✅ **Proper environment configuration**

**Your OTT platform management system is live!** 🚀

Need help with any step? Check the logs in each platform's dashboard or refer to the troubleshooting section above.