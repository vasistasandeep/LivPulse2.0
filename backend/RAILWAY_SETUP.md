# 🚂 Railway Deployment Guide - Complete Setup

## 🎯 Quick Start Checklist

- [ ] Railway account created
- [ ] GitHub repository connected
- [ ] PostgreSQL database added
- [ ] Redis cache added
- [ ] Environment variables configured
- [ ] Database migrated
- [ ] Health checks passing

## 🔧 Detailed Setup

### 1. Railway Project Creation
```bash
# Option 1: Using Railway Dashboard
1. Visit railway.app/new
2. Click "Deploy from GitHub repo"
3. Select LivPulse2.0 repository
4. Click "Deploy"

# Option 2: Using Railway CLI
npm install -g @railway/cli
railway login
railway init
railway up
```

### 2. Database Services

#### PostgreSQL Setup
```bash
# Add PostgreSQL to your Railway project
railway add postgresql

# Railway automatically provides:
DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/railway
```

#### Redis Setup  
```bash
# Add Redis to your Railway project
railway add redis

# Railway automatically provides:
REDIS_URL=redis://default:[PASSWORD]@[HOST]:[PORT]
```

### 3. Environment Configuration

Set these variables in Railway dashboard:
```env
# Required Production Variables
NODE_ENV=production
JWT_SECRET=your-super-secure-jwt-secret-256-bit
JWT_REFRESH_SECRET=your-super-secure-refresh-secret-256-bit
FRONTEND_URL=https://your-app.vercel.app

# Optional Email Configuration
SMTP_URL=smtp://username:password@smtp.gmail.com:587

# Automatic Railway Variables (no need to set)
DATABASE_URL=postgresql://... (auto-provided)
REDIS_URL=redis://... (auto-provided)
PORT=10000 (auto-set by Railway)
```

### 4. Generate Secure Secrets
```bash
# Generate strong JWT secrets
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log('JWT_REFRESH_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
```

### 5. Database Migration
```bash
# After deployment, run migrations
railway run npx prisma db push

# Optional: Seed database with initial data
railway run npx prisma db seed
```

## 📊 Monitoring

### Health Check
Railway will monitor: `https://your-service.railway.app/api/health`

Expected response:
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

### Resource Monitoring
- Database metrics: Connections, queries/sec, storage
- Redis metrics: Memory usage, operations/sec
- API metrics: Response time, error rate

## 💰 Pricing & Scaling

### Railway Plans
- **Hobby**: $5/month credit (good for development)
- **Pro**: $20/month (recommended for production)

### Resource Allocation
```toml
# railway.toml
[resources]
memory = "1GB"    # Adjust based on needs
cpu = "1"         # 1 vCPU for most applications
```

## 🚨 Troubleshooting

### Common Issues
1. **Database Connection Failed**
   ```bash
   # Check connection
   railway run node -e "console.log(process.env.DATABASE_URL)"
   ```

2. **Redis Connection Issues**
   ```bash
   # Test Redis
   railway run node -e "const redis=require('redis');const client=redis.createClient(process.env.REDIS_URL);client.ping().then(console.log)"
   ```

3. **Migration Failures**
   ```bash
   # Reset and re-run migrations
   railway run npx prisma migrate reset
   railway run npx prisma db push
   ```

## 🔐 Security Best Practices

- ✅ Use Railway's automatic SSL encryption
- ✅ Enable backups (automatic in Railway)
- ✅ Use strong passwords (auto-generated)
- ✅ Limit database access to Railway network
- ✅ Regular security updates (automatic)

## 🔄 Backup & Recovery

Railway provides automatic backups:
- **Daily snapshots** for PostgreSQL
- **Point-in-time recovery** available
- **7-day retention** on Hobby plan
- **30-day retention** on Pro plan

Manual backup:
```bash
# Export database
railway run pg_dump $DATABASE_URL > backup.sql

# Restore database
railway run psql $DATABASE_URL < backup.sql
```

## ➡️ Next Steps

After Railway is set up:
1. Copy your `DATABASE_URL` and `REDIS_URL`
2. Deploy backend API to Render
3. Deploy frontend to Vercel
4. Configure domain and SSL

---

🎉 Your LivPulse v2.0 database infrastructure is now running on Railway!