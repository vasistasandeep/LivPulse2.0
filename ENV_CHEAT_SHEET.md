# 🚀 Environment Variables Cheat Sheet

## Quick Copy-Paste Templates

### 🚂 Railway (Auto-Provided)
```bash
# Just copy these from Railway dashboard:
DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/railway
REDIS_URL=redis://default:[PASSWORD]@[HOST]:[PORT]
```

### 🎨 Render Backend (Add to Environment Tab)
```bash
# === REQUIRED ===
DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/railway
REDIS_URL=redis://default:[PASSWORD]@[HOST]:[PORT]
JWT_SECRET=generated-256-bit-secret
JWT_REFRESH_SECRET=generated-256-bit-secret  
NODE_ENV=production
PORT=10000
FRONTEND_URL=https://your-app.vercel.app

# === OPTIONAL ===
ENABLE_REAL_TIME=true
ENABLE_FILE_UPLOADS=true
ENABLE_USER_REGISTRATION=false
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000
SMTP_URL=smtp://username:password@smtp.gmail.com:587
```

### ▲ Vercel Frontend (Add to Environment Variables)
```bash
VITE_BACKEND_URL=https://livpulse-backend.onrender.com
VITE_WEBSOCKET_URL=https://livpulse-backend.onrender.com  
VITE_APP_NAME=LivPulse v2.0
VITE_APP_VERSION=2.0.0
VITE_ENABLE_REAL_TIME=true
VITE_CSV_MAX_SIZE_MB=10
```

## 🔑 Generate JWT Secrets

Run this in terminal:
```bash
# JWT Secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# JWT Refresh Secret  
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 📋 Deployment Order

1. **Railway**: Create databases → Copy URLs
2. **Generate**: JWT secrets locally  
3. **Render**: Deploy backend → Copy service URL
4. **Vercel**: Deploy frontend → Copy app URL
5. **Update**: Render FRONTEND_URL with Vercel URL

## 🔧 Variable Sources

| Variable | Source | Example |
|----------|--------|---------|
| `DATABASE_URL` | Railway PostgreSQL → Connect | `postgresql://...` |
| `REDIS_URL` | Railway Redis → Connect | `redis://...` |
| `JWT_SECRET` | Generate locally | `a1b2c3d4...` |
| `FRONTEND_URL` | Vercel deployment | `https://app.vercel.app` |
| `VITE_BACKEND_URL` | Render deployment | `https://api.onrender.com` |

## ⚠️ Common Mistakes

❌ **Wrong CORS**: `https://app.vercel.app/` (trailing slash)  
✅ **Correct**: `https://app.vercel.app`

❌ **HTTP in prod**: `http://api.onrender.com`  
✅ **HTTPS required**: `https://api.onrender.com`

❌ **Weak JWT**: `secret123`  
✅ **Strong JWT**: `a1b2c3d4e5f6...` (64 chars)

## 🎯 Quick Test

```bash
# Test backend health
curl https://livpulse-backend.onrender.com/api/health

# Should return:
{"status":"ok","timestamp":"...","services":{...}}
```