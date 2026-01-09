#!/bin/bash

# Hotel Management System - Docker Startup Script
# Usage: bash docker-startup.sh

set -e

echo "=========================================="
echo "🏨 Hotel Management System"
echo "Docker Quick Start"
echo "=========================================="
echo ""

# Check Docker
echo "🔍 Checking Docker installation..."
if ! command -v docker &> /dev/null; then
    echo "❌ Docker not found. Please install Docker Desktop."
    exit 1
fi
echo "✅ Docker found: $(docker --version)"
echo ""

# Check Docker Compose
echo "🔍 Checking Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose not found. Please install Docker Compose."
    exit 1
fi
echo "✅ Docker Compose found: $(docker-compose --version)"
echo ""

# Check if Docker daemon is running
echo "🔍 Checking Docker daemon..."
if ! docker ps &> /dev/null; then
    echo "❌ Docker daemon not running. Please start Docker Desktop."
    exit 1
fi
echo "✅ Docker daemon running"
echo ""

# Load environment
echo "📋 Loading environment..."
if [ ! -f ".env.local" ]; then
    echo "⚠️  .env.local not found. Using defaults..."
else
    export $(cat .env.local | xargs)
    echo "✅ Environment loaded from .env.local"
fi
echo ""

# Build images
echo "🏗️  Building Docker images..."
docker-compose build --parallel
echo "✅ Images built successfully"
echo ""

# Start services
echo "🚀 Starting services..."
docker-compose up -d
echo "✅ Services started"
echo ""

# Wait for services to be healthy
echo "⏳ Waiting for services to be healthy..."
sleep 10

# Check health status
echo "🏥 Checking health status..."
docker-compose ps

echo ""
echo "=========================================="
echo "✅ STARTUP COMPLETE!"
echo "=========================================="
echo ""
echo "📍 Access your application:"
echo "   Frontend:  http://localhost:3000"
echo "   Backend:   http://localhost:3001"
echo "   API Docs:  http://localhost:3001/api/docs"
echo ""
echo "📊 Database:"
echo "   Host:      localhost"
echo "   Port:      3306"
echo "   Database:  hotel_management"
echo "   User:      hotel_user"
echo ""
echo "📝 Useful commands:"
echo "   View logs:       docker-compose logs -f"
echo "   Stop:            docker-compose down"
echo "   Database shell:  docker-compose exec mysql mysql -u hotel_user -photel_password hotel_management"
echo ""
echo "📖 Full documentation: DOCKER_COMPLETE_SETUP.md"
echo ""
