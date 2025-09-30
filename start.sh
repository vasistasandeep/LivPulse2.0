#!/bin/bash
# Railway startup script for LivPulse v2.0 backend

echo "🚀 Starting LivPulse v2.0 Backend..."

# Navigate to backend directory
cd backend

# Check if node_modules exists, if not install dependencies
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Check if build exists, if not build the project
if [ ! -d "dist" ]; then
    echo "🔨 Building project..."
    npm run build
fi

# Start the application
echo "🎯 Starting application..."
npm start