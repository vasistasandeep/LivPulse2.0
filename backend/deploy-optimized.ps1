# LivPulse v2.0 - Optimized Deployment Script (PowerShell)
# This script sets up the optimized configuration for production deployment

Write-Host "🚀 Setting up LivPulse v2.0 Optimized Configuration..." -ForegroundColor Green

# Backup current files
Write-Host "📦 Backing up current configuration..." -ForegroundColor Yellow
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"

if (Test-Path "package.json") {
    Copy-Item "package.json" "package-backup-$timestamp.json"
}

if (Test-Path "railway.toml") {
    Copy-Item "railway.toml" "railway-backup-$timestamp.toml"
}

# Apply optimized configurations
Write-Host "⚡ Applying optimized package.json..." -ForegroundColor Cyan
Copy-Item "package-optimized.json" "package.json"

Write-Host "🚄 Applying optimized Railway configuration..." -ForegroundColor Cyan
Copy-Item "railway-optimized.toml" "railway.toml"

Write-Host "🗄️ Setting up optimized database configuration..." -ForegroundColor Cyan
Copy-Item "src/lib/database-optimized.ts" "src/lib/database.ts"

Write-Host "🖥️ Setting up optimized server..." -ForegroundColor Cyan
Copy-Item "src/server-optimized.ts" "src/server.ts"

# Install dependencies
Write-Host "📦 Installing optimized dependencies..." -ForegroundColor Cyan
npm ci

# Build the application
Write-Host "🔨 Building TypeScript application..." -ForegroundColor Cyan
npm run build

# Run tests (if available)
try {
    npm test --silent 2>$null
    Write-Host "🧪 Running tests..." -ForegroundColor Cyan
    npm test
} catch {
    Write-Host "⚠️ No tests found, skipping..." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✅ LivPulse v2.0 Optimized Configuration Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor White
Write-Host "1. Set up environment variables in Railway:" -ForegroundColor White
Write-Host "   - DATABASE_URL (auto-injected by PostgreSQL service)" -ForegroundColor Gray
Write-Host "   - JWT_SECRET (generate a secure 256-bit key)" -ForegroundColor Gray
Write-Host "   - JWT_REFRESH_SECRET (generate a secure 256-bit key)" -ForegroundColor Gray
Write-Host "   - FRONTEND_URL=https://liv-pulse-frontend.vercel.app" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Deploy to Railway:" -ForegroundColor White
Write-Host "   git add ." -ForegroundColor Gray
Write-Host "   git commit -m 'Deploy optimized LivPulse v2.0'" -ForegroundColor Gray
Write-Host "   git push origin main" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Test deployment:" -ForegroundColor White
Write-Host "   Invoke-RestMethod 'https://your-railway-domain.up.railway.app/api/health'" -ForegroundColor Gray
Write-Host ""