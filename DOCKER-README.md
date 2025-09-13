# Restaurant POS - Docker Deployment Guide

This guide explains how to deploy the Restaurant POS system using Docker and Docker Compose.

## Prerequisites

- Docker (version 20.10 or higher)
- Docker Compose (version 2.0 or higher)
- Git

## Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd restaurant-pos
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Build and run with Docker Compose**
   ```bash
   # For production
   docker-compose up -d

   # For development
   docker-compose -f docker-compose.dev.yml up -d
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - MongoDB: mongodb://localhost:27017

## Environment Configuration

Copy `.env.example` to `.env` and update the following variables:

```env
# MongoDB Configuration
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=your_secure_password_here
MONGO_DATABASE=restaurant_pos

# Backend Configuration
NODE_ENV=production
PORT=5000
FRONTEND_URL=http://localhost:3000

# Security (generate secure values in production)
JWT_SECRET=your_jwt_secret_here
ENCRYPTION_KEY=your_encryption_key_here
```

## Docker Commands

### Production Deployment

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild services
docker-compose up -d --build
```

### Development Mode

```bash
# Start development environment
docker-compose -f docker-compose.dev.yml up -d

# View backend logs
docker-compose -f docker-compose.dev.yml logs -f backend-dev

# Stop development environment
docker-compose -f docker-compose.dev.yml down
```

### Individual Service Management

```bash
# Build backend only
docker build -t restaurant-pos-backend ./backend

# Build frontend only
docker build -t restaurant-pos-frontend .

# Run backend container
docker run -d -p 5000:5000 --name backend restaurant-pos-backend

# Run frontend container
docker run -d -p 3000:80 --name frontend restaurant-pos-frontend
```

## Service Architecture

### Services Overview

1. **MongoDB** (`mongodb`)
   - Database service
   - Port: 27017
   - Persistent volume for data storage

2. **Backend API** (`backend`)
   - Node.js/Express server
   - Port: 5000
   - Connects to MongoDB
   - Health check endpoint: `/api/health`

3. **Frontend** (`frontend`)
   - React application served by Nginx
   - Port: 3000 (mapped to container port 80)
   - Proxy API requests to backend
   - Health check endpoint: `/health`

### Network Configuration

All services run on a custom Docker network (`restaurant-pos-network`) for secure inter-service communication.

## Data Persistence

- **MongoDB Data**: Stored in Docker volume `mongodb_data`
- **Backend Logs**: Stored in Docker volume `backend_logs`

## Health Checks

All services include health checks:
- **Backend**: HTTP check on `/api/health`
- **Frontend**: HTTP check on `/health`
- **MongoDB**: Database ping check

## Monitoring and Logs

```bash
# View all service logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mongodb

# Monitor resource usage
docker stats
```

## Database Management

### Backup MongoDB Data

```bash
# Create backup
docker exec restaurant-pos-db mongodump --out /backup

# Copy backup from container
docker cp restaurant-pos-db:/backup ./mongodb-backup
```

### Restore MongoDB Data

```bash
# Copy backup to container
docker cp ./mongodb-backup restaurant-pos-db:/restore

# Restore data
docker exec restaurant-pos-db mongorestore /restore
```

## Scaling

### Scale Backend Services

```bash
# Scale backend to 3 instances
docker-compose up -d --scale backend=3
```

### Load Balancer Setup

For production scaling, consider adding a load balancer like Nginx or Traefik.

## Security Considerations

1. **Environment Variables**: Never commit `.env` files with production secrets
2. **Network Security**: Services communicate through internal Docker network
3. **User Permissions**: Containers run as non-root users
4. **Health Checks**: All services include health monitoring
5. **Security Headers**: Nginx includes security headers for the frontend

## Troubleshooting

### Common Issues

1. **Port Conflicts**
   ```bash
   # Check if ports are in use
   lsof -i :3000
   lsof -i :5000
   lsof -i :27017
   ```

2. **Container Health Issues**
   ```bash
   # Check container status
   docker-compose ps
   
   # Inspect unhealthy containers
   docker inspect <container-name>
   ```

3. **Database Connection Issues**
   ```bash
   # Check MongoDB logs
   docker-compose logs mongodb
   
   # Test database connection
   docker exec -it restaurant-pos-db mongosh
   ```

### Reset Everything

```bash
# Stop and remove all containers, networks, and volumes
docker-compose down -v
docker system prune -a

# Rebuild from scratch
docker-compose up -d --build
```

## Production Deployment

For production deployment:

1. Use environment-specific `.env` files
2. Set up proper SSL/TLS certificates
3. Configure reverse proxy (Nginx/Apache)
4. Set up monitoring and logging
5. Implement backup strategies
6. Use Docker Swarm or Kubernetes for orchestration

## Support

For issues and questions:
1. Check the logs: `docker-compose logs -f`
2. Verify environment configuration
3. Ensure all required ports are available
4. Check Docker and Docker Compose versions
