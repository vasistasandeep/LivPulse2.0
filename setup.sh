#!/bin/bash

# LivPulse v2.0 - Development Setup Script

echo "🚀 Setting up LivPulse v2.0 Development Environment"
echo "=================================================="

# Check Node.js version
node_version=$(node -v 2>/dev/null || echo "not installed")
if [[ $node_version == "not installed" ]]; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

echo "✅ Node.js version: $node_version"

# Setup Backend
echo ""
echo "📦 Setting up Backend..."
cd backend

# Install dependencies
echo "Installing backend dependencies..."
npm install

# Copy environment file
if [ ! -f .env ]; then
    cp .env.example .env
    echo "📝 Created .env file from template"
    echo "⚠️  Please edit backend/.env with your database credentials"
else
    echo "✅ .env file already exists"
fi

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

echo "✅ Backend setup complete!"

# Setup Frontend
echo ""
echo "🎨 Setting up Frontend..."
cd ../frontend

# Install dependencies
echo "Installing frontend dependencies..."
npm install

# Copy environment file
if [ ! -f .env ]; then
    cp .env.example .env
    echo "📝 Created .env file from template"
    echo "⚠️  Please edit frontend/.env with your backend URL"
else
    echo "✅ .env file already exists"
fi

echo "✅ Frontend setup complete!"

# Final instructions
echo ""
echo "🎉 Setup Complete!"
echo "=================="
echo ""
echo "Next steps:"
echo "1. Set up your PostgreSQL database"
echo "2. Set up Redis server"
echo "3. Edit backend/.env with your database credentials"
echo "4. Run database migrations: cd backend && npx prisma migrate dev"
echo "5. Start backend: cd backend && npm run dev"
echo "6. Start frontend: cd frontend && npm run dev"
echo ""
echo "🔗 Local URLs:"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:5000"
echo "   API Docs: http://localhost:5000/api/health"
echo ""
echo "📚 For deployment, see:"
echo "   - Railway:  backend/RAILWAY_DEPLOY.md"
echo "   - Render:   backend/RENDER_DEPLOY.md"
echo "   - Vercel:   frontend/VERCEL_DEPLOY.md"