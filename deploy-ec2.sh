#!/bin/bash

echo "🚀 Deploying Restaurant POS to EC2..."

# Stop and remove existing containers
echo "📦 Stopping existing containers..."
docker-compose down

# Remove old images to force rebuild
echo "🔄 Removing old images..."
docker rmi restaurant-pos-frontend restaurant-pos-backend 2>/dev/null || true

# Copy production environment file
echo "📝 Setting up production environment..."
cp .env.production .env

# Build and start services
echo "🏗️ Building and starting services..."
docker-compose up -d --build

# Wait for services to be healthy
echo "⏳ Waiting for services to be healthy..."
sleep 30

# Check service status
echo "🔍 Checking service status..."
docker-compose ps

echo ""
echo "✅ Deployment complete!"
echo "🌐 Frontend: http://3.142.250.63:3000"
echo "🔧 Backend API: http://3.142.250.63:5000"
echo "🗄️ MongoDB: mongodb://3.142.250.63:27017"
echo ""
echo "📋 Useful commands:"
echo "  View logs: docker-compose logs -f"
echo "  Stop services: docker-compose down"
echo "  Restart services: docker-compose restart"
