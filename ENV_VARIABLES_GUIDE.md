# 🔐 Environment Variables Guide - Complete Setup

This guide covers **all environment variables** needed for LivPulse v2.0 deployment across Railway, Render, and Vercel.

## 📋 Quick Reference

### Required Variables by Service:
- **Railway**: No manual env vars (auto-provided)
- **Render**: 6 required + 5 optional variables  
- **Vercel**: 5 required variables

## 🚂 Railway Environment Variables

### ✅ **Auto-Provided** (No Setup Needed)
Railway automatically provides these when you add database services:

```env
# PostgreSQL (auto-generated)
DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/railway
PGHOST=[HOST]
PGPORT=[PORT] 
PGUSER=postgres
PGPASSWORD=[PASSWORD]
PGDATABASE=railway

# Redis (auto-generated)
REDIS_URL=redis://default:[PASSWORD]@[HOST]:[PORT]
REDIS_HOST=[HOST]
REDIS_PORT=[PORT]
REDIS_PASSWORD=[PASSWORD]
```

### 📝 **How to Get These Values:**
1. Go to Railway dashboard
2. Click on PostgreSQL service → **"Connect"** tab
3. Copy the `DATABASE_URL`
4. Click on Redis service → **"Connect"** tab  
5. Copy the `REDIS_URL`

---

## 🎨 Render Environment Variables

### ✅ **Required Variables** (Must Set)

#### 1. **Database Connections** (from Railway)
```env
DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/railway
REDIS_URL=redis://default:[PASSWORD]@[HOST]:[PORT]
```

#### 2. **JWT Authentication** (Generate Strong Secrets)
```env
JWT_SECRET=your-super-secure-256-bit-jwt-secret
JWT_REFRESH_SECRET=your-super-secure-256-bit-refresh-secret
```

#### 3. **CORS Configuration** (Update after Vercel deployment)
```env
FRONTEND_URL=https://your-app.vercel.app
```

#### 4. **Server Configuration**
```env
NODE_ENV=production
PORT=10000
```

### 🔧 **Optional Variables** (Recommended)

#### Email Configuration (for reports)
```env
SMTP_URL=smtp://username:password@smtp.gmail.com:587
```

#### Feature Flags
```env
ENABLE_REAL_TIME=true
ENABLE_FILE_UPLOADS=true
ENABLE_USER_REGISTRATION=false
```

#### JWT Token Expiration
```env
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

#### Rate Limiting
```env
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000
```

### 🔑 **Generate JWT Secrets**
Use this command to generate secure secrets:
```bash
# JWT Secret (256-bit)
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"

# JWT Refresh Secret (256-bit)  
node -e "console.log('JWT_REFRESH_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
```

Example output:
```env
JWT_SECRET=a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456
JWT_REFRESH_SECRET=9876543210fedcba0987654321fedcba0987654321fedcba0987654321fedcba
```

---

## ▲ Vercel Environment Variables

### ✅ **Required Variables**

#### Backend URLs (from Render)
```env
VITE_BACKEND_URL=https://livpulse-backend.onrender.com
VITE_WEBSOCKET_URL=https://livpulse-backend.onrender.com
```

#### App Configuration
```env
VITE_APP_NAME=LivPulse v2.0
VITE_APP_VERSION=2.0.0
VITE_ENABLE_REAL_TIME=true
VITE_CSV_MAX_SIZE_MB=10
```

---

## 📝 Step-by-Step Setup Guide

### Step 1: Railway Database Setup

1. **Create Railway project** (databases only)
2. **Add PostgreSQL service**
3. **Add Redis service**
4. **Copy connection strings**:
   ```bash
   # Go to PostgreSQL service → Connect tab
   DATABASE_URL=postgresql://postgres:...
   
   # Go to Redis service → Connect tab  
   REDIS_URL=redis://default:...
   ```

### Step 2: Generate JWT Secrets

Run these commands locally:
```bash
# Generate JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate JWT_REFRESH_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Save these values - you'll need them for Render.

### Step 3: Render Backend Setup

1. **Create Render web service**
2. **Add environment variables** in Render dashboard:
   ```env
   # Database (from Railway)
   DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/railway
   REDIS_URL=redis://default:[PASSWORD]@[HOST]:[PORT]
   
   # JWT (generated above)
   JWT_SECRET=your-generated-jwt-secret
   JWT_REFRESH_SECRET=your-generated-refresh-secret
   
   # Server
   NODE_ENV=production
   PORT=10000
   
   # CORS (temporary - update after Vercel)
   FRONTEND_URL=https://temp-placeholder.com
   ```

3. **Deploy backend** and note the URL: `https://livpulse-backend.onrender.com`

### Step 4: Vercel Frontend Setup

1. **Create Vercel project**
2. **Add environment variables** in Vercel dashboard:
   ```env
   # Backend (from Render)
   VITE_BACKEND_URL=https://livpulse-backend.onrender.com
   VITE_WEBSOCKET_URL=https://livpulse-backend.onrender.com
   
   # App config
   VITE_APP_NAME=LivPulse v2.0
   VITE_APP_VERSION=2.0.0
   VITE_ENABLE_REAL_TIME=true
   VITE_CSV_MAX_SIZE_MB=10
   ```

3. **Deploy frontend** and note the URL: `https://your-app.vercel.app`

### Step 5: Update CORS in Render

1. **Go back to Render** environment variables
2. **Update FRONTEND_URL**:
   ```env
   FRONTEND_URL=https://your-app.vercel.app
   ```
3. **Redeploy** backend service

---

## 🔧 Environment Variable Templates

### 📄 Backend .env Template
```env
# ===== DATABASE =====
DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/railway
REDIS_URL=redis://default:[PASSWORD]@[HOST]:[PORT]

# ===== AUTHENTICATION =====
JWT_SECRET=your-256-bit-jwt-secret-here
JWT_REFRESH_SECRET=your-256-bit-refresh-secret-here
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# ===== SERVER =====
NODE_ENV=production
PORT=10000
FRONTEND_URL=https://your-app.vercel.app

# ===== FEATURES =====
ENABLE_REAL_TIME=true
ENABLE_FILE_UPLOADS=true
ENABLE_USER_REGISTRATION=false

# ===== RATE LIMITING =====
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000

# ===== EMAIL (Optional) =====
SMTP_URL=smtp://username:password@smtp.gmail.com:587
```

### 📄 Frontend .env Template
```env
# ===== BACKEND =====
VITE_BACKEND_URL=https://livpulse-backend.onrender.com
VITE_WEBSOCKET_URL=https://livpulse-backend.onrender.com

# ===== APP CONFIG =====
VITE_APP_NAME=LivPulse v2.0
VITE_APP_VERSION=2.0.0
VITE_ENABLE_REAL_TIME=true
VITE_CSV_MAX_SIZE_MB=10
```

---

## 🚨 Common Issues & Solutions

### ❌ **Problem**: CORS errors in browser
**✅ Solution**: Ensure `FRONTEND_URL` in Render exactly matches Vercel domain
```env
# Wrong
FRONTEND_URL=https://your-app.vercel.app/
FRONTEND_URL=http://your-app.vercel.app

# Correct  
FRONTEND_URL=https://your-app.vercel.app
```

### ❌ **Problem**: Database connection failed
**✅ Solution**: Verify `DATABASE_URL` format and Railway service status
```env
# Check format
postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/railway
```

### ❌ **Problem**: WebSocket connection failed
**✅ Solution**: Ensure `VITE_WEBSOCKET_URL` matches backend URL
```env
# Should be same as VITE_BACKEND_URL
VITE_WEBSOCKET_URL=https://livpulse-backend.onrender.com
```

### ❌ **Problem**: JWT authentication not working
**✅ Solution**: Check JWT secrets are properly set and match between services
```bash
# Verify secrets are different and long enough (64 characters)
echo $JWT_SECRET | wc -c  # Should output 64
```

---

## 🔐 Security Best Practices

### ✅ **Do's**
- ✅ Use strong, unique JWT secrets (256-bit)
- ✅ Use different secrets for JWT and refresh tokens
- ✅ Set appropriate token expiration times
- ✅ Use HTTPS URLs only
- ✅ Rotate secrets regularly (quarterly)
- ✅ Use Railway's auto-generated database passwords

### ❌ **Don'ts**  
- ❌ Never commit secrets to Git
- ❌ Don't use default or weak passwords
- ❌ Don't use same secret for JWT and refresh
- ❌ Don't use HTTP URLs in production
- ❌ Don't share secrets in chat/email
- ❌ Don't use short expiration times for refresh tokens

---

## 📋 Environment Variables Checklist

### Railway Setup ✅
- [ ] PostgreSQL service created
- [ ] Redis service created  
- [ ] `DATABASE_URL` copied
- [ ] `REDIS_URL` copied
- [ ] Database connections tested

### Render Backend ✅
- [ ] `DATABASE_URL` added
- [ ] `REDIS_URL` added
- [ ] `JWT_SECRET` generated and added
- [ ] `JWT_REFRESH_SECRET` generated and added
- [ ] `NODE_ENV=production` set
- [ ] `PORT=10000` set
- [ ] `FRONTEND_URL` configured (update after Vercel)
- [ ] Optional variables added as needed
- [ ] Backend deployed successfully
- [ ] Health check passing

### Vercel Frontend ✅
- [ ] `VITE_BACKEND_URL` added (from Render)
- [ ] `VITE_WEBSOCKET_URL` added (from Render)
- [ ] `VITE_APP_NAME` set
- [ ] `VITE_APP_VERSION` set
- [ ] `VITE_ENABLE_REAL_TIME=true` set
- [ ] `VITE_CSV_MAX_SIZE_MB=10` set
- [ ] Frontend deployed successfully
- [ ] Frontend connects to backend

### Final Integration ✅
- [ ] Updated `FRONTEND_URL` in Render with actual Vercel URL
- [ ] Redeployed backend after CORS update
- [ ] Tested end-to-end functionality
- [ ] All services communicating properly

---

## 🎯 Quick Test Commands

### Test Database Connection
```bash
# Test PostgreSQL
psql $DATABASE_URL -c "SELECT version();"

# Test Redis
redis-cli -u $REDIS_URL ping
```

### Test Backend Health
```bash
curl https://livpulse-backend.onrender.com/api/health
```

### Test Frontend
```bash
# Visit in browser
https://your-app.vercel.app
```

---

## 💡 Pro Tips

1. **Save your variables**: Keep a secure backup of all environment variables
2. **Use descriptive names**: Add comments to remember what each URL is for
3. **Test locally first**: Use `.env` files to test before deploying
4. **Monitor logs**: Check service logs if variables seem incorrect
5. **Update systematically**: Change all related variables when updating URLs

**Need help with any specific variable setup?** Let me know! 🚀