@echo off
REM LivPulse v2.0 - Development Setup Script for Windows

echo 🚀 Setting up LivPulse v2.0 Development Environment
echo ==================================================

REM Check Node.js version
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ first.
    pause
    exit /b 1
)

echo ✅ Node.js is installed
node -v

REM Setup Backend
echo.
echo 📦 Setting up Backend...
cd backend

REM Install dependencies
echo Installing backend dependencies...
npm install

REM Copy environment file
if not exist .env (
    copy .env.example .env
    echo 📝 Created .env file from template
    echo ⚠️  Please edit backend\.env with your database credentials
) else (
    echo ✅ .env file already exists
)

REM Generate Prisma client
echo Generating Prisma client...
npx prisma generate

echo ✅ Backend setup complete!

REM Setup Frontend
echo.
echo 🎨 Setting up Frontend...
cd ..\frontend

REM Install dependencies
echo Installing frontend dependencies...
npm install

REM Copy environment file
if not exist .env (
    copy .env.example .env
    echo 📝 Created .env file from template
    echo ⚠️  Please edit frontend\.env with your backend URL
) else (
    echo ✅ .env file already exists
)

echo ✅ Frontend setup complete!

REM Final instructions
echo.
echo 🎉 Setup Complete!
echo ==================
echo.
echo Next steps:
echo 1. Set up your PostgreSQL database
echo 2. Set up Redis server
echo 3. Edit backend\.env with your database credentials
echo 4. Run database migrations: cd backend ^&^& npx prisma migrate dev
echo 5. Start backend: cd backend ^&^& npm run dev
echo 6. Start frontend: cd frontend ^&^& npm run dev
echo.
echo 🔗 Local URLs:
echo    Frontend: http://localhost:3000
echo    Backend:  http://localhost:5000
echo    API Docs: http://localhost:5000/api/health
echo.
echo 📚 For deployment, see:
echo    - Railway:  backend\RAILWAY_DEPLOY.md
echo    - Render:   backend\RENDER_DEPLOY.md
echo    - Vercel:   frontend\VERCEL_DEPLOY.md
echo.
pause