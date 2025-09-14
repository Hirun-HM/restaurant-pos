#!/bin/bash

# Quick fix for Docker build errors
# Run this on your AWS server in the restaurant-pos directory

echo "🔧 Fixing Docker build errors..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if we're in the right directory
if [ ! -f "docker-compose.yml" ]; then
    print_error "docker-compose.yml not found. Please run this script from the restaurant-pos directory."
    exit 1
fi

print_status "Found docker-compose.yml file"

# Stop any running containers
echo "🛑 Stopping existing containers..."
sudo docker-compose down 2>/dev/null || docker-compose down 2>/dev/null || true

# Remove any existing images to force rebuild
echo "🗑️  Removing existing images and build cache..."
sudo docker image rm restaurant-pos-frontend 2>/dev/null || docker image rm restaurant-pos-frontend 2>/dev/null || true
sudo docker image rm restaurant-pos-backend 2>/dev/null || docker image rm restaurant-pos-backend 2>/dev/null || true

# Remove all unused images, containers, and build cache
sudo docker system prune -a -f 2>/dev/null || docker system prune -a -f 2>/dev/null || true

# Clear Docker build cache
echo "🧹 Clearing Docker build cache..."
sudo docker builder prune -a -f 2>/dev/null || docker builder prune -a -f 2>/dev/null || true

# Pull the latest version of the fixed files from GitHub (optional)
echo "� Checking for latest changes..."
if git status &>/dev/null; then
    print_info "Pulling latest changes from GitHub..."
    git pull origin main 2>/dev/null || print_warning "Could not pull from GitHub (this is okay if you haven't pushed the fixes yet)"
else
    print_warning "Not a git repository or git not available"
fi

# Determine Docker command
if docker ps &> /dev/null; then
    DOCKER_CMD="docker-compose"
    print_info "Using docker-compose without sudo"
else
    DOCKER_CMD="sudo docker-compose"
    print_warning "Using sudo for Docker commands"
fi

# Rebuild and start services
echo "🔨 Rebuilding services with no cache..."

# Build each service individually for better error tracking
print_info "Building MongoDB (pulling image)..."
$DOCKER_CMD pull mongo:7.0

print_info "Building backend..."
$DOCKER_CMD build --no-cache backend

print_info "Building frontend..."
$DOCKER_CMD build --no-cache frontend

# Start services in order
print_info "Starting services..."
$DOCKER_CMD up -d mongodb

echo "⏳ Waiting for MongoDB to be ready..."
sleep 20

$DOCKER_CMD up -d backend

echo "⏳ Waiting for backend to be ready..."
sleep 15

$DOCKER_CMD up -d frontend

echo "⏳ Waiting for frontend to be ready..."
sleep 15

# Check status
echo "📊 Checking container status..."
if docker ps &> /dev/null; then
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
else
    sudo docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
fi

# Test services
echo ""
echo "🧪 Testing services..."

# Test MongoDB
if curl -s --connect-timeout 5 http://localhost:27017 > /dev/null 2>&1; then
    print_status "MongoDB is accessible on port 27017"
else
    print_warning "MongoDB may still be starting up"
fi

# Test backend
if curl -s --connect-timeout 5 http://localhost:5000 > /dev/null 2>&1; then
    print_status "Backend API is accessible on port 5000"
else
    print_warning "Backend API may still be starting up"
fi

# Test frontend
if curl -s --connect-timeout 5 http://localhost:3000 > /dev/null 2>&1; then
    print_status "Frontend is accessible on port 3000"
elif curl -s --connect-timeout 5 http://localhost:80 > /dev/null 2>&1; then
    print_status "Frontend is accessible on port 80"
else
    print_warning "Frontend may still be starting up"
fi

echo ""
echo "🎉 Rebuild complete!"
echo ""
echo "📝 Useful commands:"
echo "   View all logs: $DOCKER_CMD logs"
echo "   View specific logs: $DOCKER_CMD logs [frontend|backend|mongodb]"
echo "   Check status: $DOCKER_CMD ps"
echo "   Restart all: $DOCKER_CMD restart"
echo "   Restart specific: $DOCKER_CMD restart [frontend|backend|mongodb]"
echo ""
echo "🌐 Access your app:"
SERVER_IP=$(curl -s --connect-timeout 5 ifconfig.me 2>/dev/null || echo 'YOUR_AWS_IP')
echo "   External: http://$SERVER_IP"
echo "   Frontend: http://localhost:3000"
echo "   Backend: http://localhost:5000"
echo ""

# Final comprehensive status check
echo "🔍 Final status check..."
ALL_GOOD=true

# Check if all containers are running
RUNNING_CONTAINERS=$($DOCKER_CMD ps --format "{{.Names}}" | wc -l)
if [ "$RUNNING_CONTAINERS" -eq 3 ]; then
    print_status "All 3 containers are running"
else
    print_warning "Expected 3 containers, found $RUNNING_CONTAINERS running"
    ALL_GOOD=false
fi

# Check individual services
for service in mongodb backend frontend; do
    if $DOCKER_CMD ps | grep -q "restaurant-pos-$service"; then
        print_status "$service container is running"
    else
        print_error "$service container is not running"
        ALL_GOOD=false
    fi
done

if [ "$ALL_GOOD" = true ]; then
    print_status "✅ All services are running successfully!"
    echo ""
    echo "🎊 Your Restaurant POS system is ready!"
    echo "🌐 Visit: http://$SERVER_IP"
else
    print_warning "⚠️  Some services may have issues. Check the logs:"
    echo ""
    echo "🔍 Troubleshooting commands:"
    echo "   $DOCKER_CMD logs mongodb"
    echo "   $DOCKER_CMD logs backend"  
    echo "   $DOCKER_CMD logs frontend"
    echo ""
    echo "📊 Container details:"
    $DOCKER_CMD ps -a
fi
