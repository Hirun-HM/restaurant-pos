#!/bin/bash

# Restaurant POS - AWS Ubuntu Setup Script
# This script sets up and runs the Restaurant POS system on AWS Ubuntu

set -e  # Exit on any error

echo "🚀 Setting up Restaurant POS on AWS Ubuntu..."
echo "================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Check if script is run as root
if [ "$EUID" -eq 0 ]; then
    print_error "Please don't run this script as root (sudo). Run as ubuntu user."
    exit 1
fi

print_info "Current user: $(whoami)"
print_info "Current directory: $(pwd)"

# Step 1: Update system packages
print_info "Step 1: Updating system packages..."
sudo apt-get update
sudo apt-get upgrade -y
print_status "System packages updated"

# Step 2: Install Docker if not present
if ! command -v docker &> /dev/null; then
    print_info "Step 2: Installing Docker..."
    
    # Install prerequisites
    sudo apt-get install -y apt-transport-https ca-certificates curl gnupg lsb-release
    
    # Add Docker's official GPG key
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    
    # Set up the repository
    echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Install Docker
    sudo apt-get update
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    
    # Add current user to docker group
    sudo usermod -aG docker $USER
    
    # Start and enable Docker
    sudo systemctl start docker
    sudo systemctl enable docker
    
    print_status "Docker installed successfully"
else
    print_status "Docker already installed: $(docker --version)"
fi

# Step 3: Install Docker Compose if not present
if ! command -v docker-compose &> /dev/null; then
    print_info "Step 3: Installing Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    print_status "Docker Compose installed: $(docker-compose --version)"
else
    print_status "Docker Compose already installed: $(docker-compose --version)"
fi

# Step 4: Install Node.js and npm
if ! command -v node &> /dev/null; then
    print_info "Step 4: Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
    print_status "Node.js installed: $(node --version)"
    print_status "NPM installed: $(npm --version)"
else
    print_status "Node.js already installed: $(node --version)"
    print_status "NPM already installed: $(npm --version)"
fi

# Step 5: Install Nginx
if ! command -v nginx &> /dev/null; then
    print_info "Step 5: Installing Nginx..."
    sudo apt-get install -y nginx
    sudo systemctl start nginx
    sudo systemctl enable nginx
    print_status "Nginx installed and started"
else
    print_status "Nginx already installed"
fi

# Step 6: Setup project directory
print_info "Step 6: Setting up project..."

# Create project directory if not exists
sudo mkdir -p /var/www/restaurant-pos
sudo chown -R ubuntu:ubuntu /var/www/restaurant-pos

# Check if we're already in the project directory
if [ "$(basename $(pwd))" = "restaurant-pos" ]; then
    print_info "Already in restaurant-pos directory"
    PROJECT_DIR=$(pwd)
else
    # Check if project exists in current directory
    if [ -d "restaurant-pos" ]; then
        print_info "Found restaurant-pos directory"
        PROJECT_DIR=$(pwd)/restaurant-pos
    else
        print_error "restaurant-pos directory not found. Please run this script from the directory containing restaurant-pos or from inside restaurant-pos"
        print_info "Current directory contents:"
        ls -la
        exit 1
    fi
fi

print_info "Project directory: $PROJECT_DIR"
cd "$PROJECT_DIR"

# Step 7: Create environment file
print_info "Step 7: Creating environment file..."
cat > .env << EOF
# MongoDB Configuration
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=SecurePassword123!
MONGO_DATABASE=restaurant_pos

# Application Configuration
NODE_ENV=production
PORT=5000
FRONTEND_URL=http://localhost:3000

# API Configuration
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=Restaurant POS
VITE_MANAGER_PASSWORD=Manager@2024!
VITE_APP_VERSION=1.0.0
EOF

print_status "Environment file created"

# Step 8: Fix Docker permissions (if needed)
print_info "Step 8: Checking Docker permissions..."
if ! docker ps &> /dev/null; then
    print_warning "Docker permission issue detected. Fixing..."
    sudo usermod -aG docker $USER
    print_warning "Docker group added. You may need to log out and back in for changes to take effect."
    print_warning "For now, we'll use sudo for Docker commands."
    DOCKER_CMD="sudo docker"
    DOCKER_COMPOSE_CMD="sudo docker-compose"
else
    print_status "Docker permissions OK"
    DOCKER_CMD="docker"
    DOCKER_COMPOSE_CMD="docker-compose"
fi

# Step 9: Remove version from docker-compose.yml (fix warning)
print_info "Step 9: Fixing docker-compose.yml..."
if grep -q "version:" docker-compose.yml; then
    sed -i '/^version:/d' docker-compose.yml
    print_status "Removed obsolete version from docker-compose.yml"
fi

# Step 10: Build and start services
print_info "Step 10: Building and starting services..."

# Stop any existing containers
$DOCKER_COMPOSE_CMD down 2>/dev/null || true

# Pull and build images
print_info "Pulling images..."
$DOCKER_COMPOSE_CMD pull

print_info "Building custom images..."
$DOCKER_COMPOSE_CMD build

print_info "Starting services..."
$DOCKER_COMPOSE_CMD up -d

# Step 11: Wait for services to start
print_info "Step 11: Waiting for services to start..."
sleep 30

# Check container status
print_info "Container status:"
$DOCKER_CMD ps

# Step 12: Configure Nginx reverse proxy
print_info "Step 12: Configuring Nginx..."

# Create Nginx configuration
sudo tee /etc/nginx/sites-available/restaurant-pos > /dev/null << 'EOF'
server {
    listen 80;
    server_name _;

    # Frontend (React app)
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
EOF

# Enable the site
sudo ln -sf /etc/nginx/sites-available/restaurant-pos /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx

print_status "Nginx configured and restarted"

# Step 13: Health checks
print_info "Step 13: Running health checks..."

# Wait a bit more for services to fully start
sleep 10

# Check if containers are running
print_info "Checking container health..."
RUNNING_CONTAINERS=$($DOCKER_CMD ps --format "table {{.Names}}\t{{.Status}}")
echo "$RUNNING_CONTAINERS"

# Check if ports are listening
print_info "Checking port availability..."
if netstat -tuln | grep -q ":3000 "; then
    print_status "Frontend port 3000 is listening"
else
    print_warning "Frontend port 3000 is not listening"
fi

if netstat -tuln | grep -q ":5000 "; then
    print_status "Backend port 5000 is listening"
else
    print_warning "Backend port 5000 is not listening"
fi

if netstat -tuln | grep -q ":27017 "; then
    print_status "MongoDB port 27017 is listening"
else
    print_warning "MongoDB port 27017 is not listening"
fi

# Step 14: Final status
print_info "Step 14: Final status check..."

# Get server IP
SERVER_IP=$(curl -s ifconfig.me || echo "unknown")

echo ""
echo "================================================"
print_status "Restaurant POS Setup Complete!"
echo "================================================"
echo ""
print_info "🌐 Access your application:"
echo "   External: http://$SERVER_IP"
echo "   Local: http://localhost"
echo ""
print_info "🔧 Service URLs:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:5000"
echo "   MongoDB: localhost:27017"
echo ""
print_info "📊 Useful commands:"
echo "   View logs: $DOCKER_COMPOSE_CMD logs"
echo "   Restart: $DOCKER_COMPOSE_CMD restart"
echo "   Stop: $DOCKER_COMPOSE_CMD down"
echo "   Status: $DOCKER_CMD ps"
echo ""
print_info "🔍 Troubleshooting:"
echo "   Check logs: $DOCKER_COMPOSE_CMD logs -f"
echo "   Check Nginx: sudo systemctl status nginx"
echo "   Check containers: $DOCKER_CMD ps -a"
echo ""

# Check if application is responding
if curl -s "http://localhost" > /dev/null; then
    print_status "✅ Application is responding!"
else
    print_warning "⚠️  Application may not be fully ready yet. Wait a few more minutes and try accessing http://$SERVER_IP"
fi

echo ""
print_info "🎉 Setup completed! Your Restaurant POS system should now be running."
