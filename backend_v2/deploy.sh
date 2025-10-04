#!/bin/bash

# SMS Task Management Backend v2 - Deployment Script

set -e

echo "🚀 Deploying SMS Task Management Backend v2"
echo "=========================================="

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    echo "Please copy .env.example to .env and configure your credentials."
    exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed!"
    echo "Please install Docker to continue."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed!"
    echo "Please install Docker Compose to continue."
    exit 1
fi

echo "✅ Prerequisites check passed"

# Build and start services
echo "🔨 Building and starting services..."
docker-compose up --build -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check if services are running
if docker-compose ps | grep -q "Up"; then
    echo "✅ Services are running!"
    echo ""
    echo "📊 Service Status:"
    docker-compose ps
    echo ""
    echo "🌐 API is available at: http://localhost:8000"
    echo "📚 API Documentation: http://localhost:8000/docs"
    echo "❤️  Health Check: http://localhost:8000/health"
    echo ""
    echo "📝 To view logs: docker-compose logs -f"
    echo "🛑 To stop services: docker-compose down"
else
    echo "❌ Services failed to start!"
    echo "📝 Check logs: docker-compose logs"
    exit 1
fi

echo "🎉 Deployment completed successfully!"