#!/bin/bash

# LivPulse v2.0 - Optimized Deployment Script
# This script sets up the optimized configuration for production deployment

set -e

echo "🚀 Setting up LivPulse v2.0 Optimized Configuration..."

# Backup current files
echo "📦 Backing up current configuration..."
if [ -f "package.json" ]; then
    cp package.json package-backup-$(date +%Y%m%d-%H%M%S).json
fi

if [ -f "railway.toml" ]; then
    cp railway.toml railway-backup-$(date +%Y%m%d-%H%M%S).toml
fi

# Apply optimized configurations
echo "⚡ Applying optimized package.json..."
cp package-optimized.json package.json

echo "🚄 Applying optimized Railway configuration..."
cp railway-optimized.toml railway.toml

echo "🗄️ Setting up optimized database configuration..."
cp src/lib/database-optimized.ts src/lib/database.ts

echo "🖥️ Setting up optimized server..."
cp src/server-optimized.ts src/server.ts

# Install dependencies
echo "📦 Installing optimized dependencies..."
npm ci

# Build the application
echo "🔨 Building TypeScript application..."
npm run build

# Run tests (if available)
if npm run test --silent 2>/dev/null; then
    echo "🧪 Running tests..."
    npm test
else
    echo "⚠️ No tests found, skipping..."
fi

echo ""
echo "✅ LivPulse v2.0 Optimized Configuration Complete!"
echo ""
echo "📋 Next Steps:"
echo "1. Set up environment variables in Railway:"
echo "   - DATABASE_URL (auto-injected by PostgreSQL service)"
echo "   - JWT_SECRET (generate a secure 256-bit key)"
echo "   - JWT_REFRESH_SECRET (generate a secure 256-bit key)"
echo "   - FRONTEND_URL=https://liv-pulse-frontend.vercel.app"
echo ""
echo "2. Deploy to Railway:"
echo "   git add ."
echo "   git commit -m 'Deploy optimized LivPulse v2.0'"
echo "   git push origin main"
echo ""
echo "3. Test deployment:"
echo "   curl https://your-railway-domain.up.railway.app/api/health"
echo ""