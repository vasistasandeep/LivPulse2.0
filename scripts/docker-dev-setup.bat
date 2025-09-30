@echo off
REM LivPulse v2.0 Docker Development Setup Script (Windows)
REM This script helps set up the development environment using Docker

echo 🚀 LivPulse v2.0 Docker Development Setup
echo ========================================

REM Check if Docker is installed
docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not installed. Please install Docker Desktop first.
    pause
    exit /b 1
)

REM Check if Docker Compose is installed
docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker Compose is not installed. Please install Docker Compose first.
    pause
    exit /b 1
)

REM Check if .env file exists
if not exist .env (
    echo 📝 Creating .env file from template...
    copy .env.docker.example .env
    echo ⚠️  Please edit .env file with your actual values before continuing!
    echo    Especially update passwords and JWT secrets.
    pause
)

echo 🏗️  Building Docker images...
docker-compose build

echo 🗃️  Setting up databases...
docker-compose up -d postgres redis

echo ⏳ Waiting for databases to be ready...
timeout /t 30 /nobreak

echo 🔄 Running database health check...
docker-compose exec postgres psql -U postgres -d livpulse -c "SELECT version();"

echo 🚀 Starting all services...
docker-compose up -d

echo ✅ Setup complete!
echo.
echo 🌐 Services are available at:
echo    Frontend: http://localhost:3000
echo    Backend:  http://localhost:5000
echo    Backend Health: http://localhost:5000/api/health
echo.
echo 📊 To view logs:
echo    docker-compose logs -f
echo.
echo 🛑 To stop all services:
echo    docker-compose down
echo.
echo 🗑️  To remove all data:
echo    docker-compose down -v

pause