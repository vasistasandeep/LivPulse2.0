#!/bin/bash

# LivPulse v2.0 Docker Development Setup Script
# This script helps set up the development environment using Docker

set -e

echo "🚀 LivPulse v2.0 Docker Development Setup"
echo "========================================"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.docker.example .env
    echo "⚠️  Please edit .env file with your actual values before continuing!"
    echo "   Especially update passwords and JWT secrets."
    read -p "Press Enter to continue after editing .env file..."
fi

echo "🏗️  Building Docker images..."
docker-compose build

echo "🗃️  Setting up databases..."
docker-compose up -d postgres redis

echo "⏳ Waiting for databases to be ready..."
sleep 30

echo "🔄 Running database migrations..."
docker-compose exec postgres psql -U postgres -d livpulse -c "SELECT version();"

echo "🚀 Starting all services..."
docker-compose up -d

echo "✅ Setup complete!"
echo ""
echo "🌐 Services are available at:"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:5000"
echo "   Backend Health: http://localhost:5000/api/health"
echo ""
echo "📊 To view logs:"
echo "   docker-compose logs -f"
echo ""
echo "🛑 To stop all services:"
echo "   docker-compose down"
echo ""
echo "🗑️  To remove all data:"
echo "   docker-compose down -v"