# 🎯 **RAILWAY MANUAL BACKEND SERVICE SETUP**

## 🖥️ **Step-by-Step Manual Creation**

### **Step 1: Go to Railway Dashboard**
1. **Visit**: https://railway.app/dashboard
2. **Select your project**: `livpulse-databases` (where your PostgreSQL & Redis are)

### **Step 2: Add New Service**
1. **Click**: `+ New Service`
2. **Select**: `GitHub Repo`
3. **Choose**: `vasistasandeep/LivPulse2.0`
4. **Branch**: `main`

### **Step 3: Configure Service Settings**
```
Service Name: livpulse-backend
Root Directory: backend
Build Command: npm install && npm run build && npx prisma generate
Start Command: npm start
Port: 3000
```

### **Step 4: Environment Variables**
Add these in the Railway dashboard:

**Auto-Provided by Railway** (don't add manually):
- `DATABASE_URL` ✅ (automatically from PostgreSQL service)
- `REDIS_URL` ✅ (automatically from Redis service)

**Add Manually**:
```env
NODE_ENV=production
PORT=3000
JWT_SECRET=your-32-char-random-string
JWT_REFRESH_SECRET=your-32-char-random-string
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
FRONTEND_URL=https://liv-pulse2-0.vercel.app
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000
ENABLE_REAL_TIME=true
```

### **Step 5: Generate JWT Secrets**
Use this to generate secure secrets:
```bash
# In terminal/PowerShell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### **Step 6: Deploy**
1. **Click**: `Deploy`
2. **Wait**: 3-5 minutes for build
3. **Check**: Build logs for success

## 🔗 **Why Manual is Better**

✅ **Visual interface** - See all settings clearly  
✅ **Easy environment variables** - Copy/paste interface  
✅ **Better debugging** - Visual build logs  
✅ **Service separation** - Won't interfere with database services  

## 📊 **Expected Build Process**

```bash
✅ Cloning repository...
✅ Setting root directory to 'backend'
✅ Installing dependencies (npm install)
✅ Building TypeScript (npm run build)
✅ Generating Prisma client (npx prisma generate)
✅ Starting server (npm start)
✅ Service live on Railway domain
```

## 🌐 **Get Your Backend URL**

After deployment:
1. **Go to service** in Railway dashboard
2. **Settings** → **Networking**
3. **Generate Domain** (if not auto-generated)
4. **Copy URL**: `https://livpulse-backend-production.up.railway.app`

## ⚙️ **Update Vercel Frontend**

Add to Vercel environment variables:
```env
VITE_API_URL=https://your-backend.up.railway.app
```

## 🎯 **Benefits of This Approach**

- ✅ **Clean separation** from database services
- ✅ **Visual configuration** 
- ✅ **Easy troubleshooting**
- ✅ **Automatic DATABASE_URL connection**
- ✅ **Fast deployment** (3-5 minutes)

Ready to create the service manually? This will be much cleaner! 🚀