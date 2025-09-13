#!/bin/bash

# Docker Deployment Script for Restaurant POS System

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
    print_success "Docker is running"
}

# Function to check if .env file exists
check_env_file() {
    if [ ! -f .env ]; then
        print_warning ".env file not found. Creating from .env.example..."
        cp .env.example .env
        print_warning "Please edit .env file with your configuration before running the application."
        return 1
    fi
    print_success ".env file found"
    return 0
}

# Function to build and start services
start_production() {
    print_status "Starting Restaurant POS in production mode..."
    docker-compose down -v 2>/dev/null || true
    docker-compose up -d --build
    print_success "Production services started successfully"
}

# Function to start development environment
start_development() {
    print_status "Starting Restaurant POS in development mode..."
    docker-compose -f docker-compose.dev.yml down -v 2>/dev/null || true
    docker-compose -f docker-compose.dev.yml up -d --build
    print_success "Development services started successfully"
}

# Function to stop services
stop_services() {
    print_status "Stopping all services..."
    docker-compose down 2>/dev/null || true
    docker-compose -f docker-compose.dev.yml down 2>/dev/null || true
    print_success "All services stopped"
}

# Function to show logs
show_logs() {
    local service=$1
    if [ -z "$service" ]; then
        print_status "Showing logs for all services..."
        docker-compose logs -f
    else
        print_status "Showing logs for $service..."
        docker-compose logs -f "$service"
    fi
}

# Function to show service status
show_status() {
    print_status "Service status:"
    docker-compose ps
    echo ""
    print_status "Health checks:"
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
}

# Function to clean up Docker resources
cleanup() {
    print_status "Cleaning up Docker resources..."
    docker-compose down -v
    docker system prune -f
    print_success "Cleanup completed"
}

# Function to backup database
backup_database() {
    print_status "Creating database backup..."
    timestamp=$(date +"%Y%m%d_%H%M%S")
    backup_dir="./backups/mongodb_$timestamp"
    mkdir -p "$backup_dir"
    
    docker exec restaurant-pos-db mongodump --out "/tmp/backup"
    docker cp restaurant-pos-db:/tmp/backup "$backup_dir"
    
    print_success "Database backup created at $backup_dir"
}

# Function to show help
show_help() {
    echo "Restaurant POS Docker Deployment Script"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  start-prod     Start production environment"
    echo "  start-dev      Start development environment"
    echo "  stop           Stop all services"
    echo "  restart-prod   Restart production environment"
    echo "  restart-dev    Restart development environment"
    echo "  logs [service] Show logs (optional: specify service name)"
    echo "  status         Show service status"
    echo "  cleanup        Stop services and clean up Docker resources"
    echo "  backup         Backup database"
    echo "  build          Build Docker images without starting"
    echo "  help           Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 start-prod                 # Start production environment"
    echo "  $0 start-dev                  # Start development environment"
    echo "  $0 logs backend               # Show backend logs"
    echo "  $0 logs                       # Show all service logs"
    echo "  $0 status                     # Show service status"
}

# Main script logic
main() {
    local command=${1:-help}
    
    case $command in
        "start-prod")
            check_docker
            if check_env_file; then
                start_production
                echo ""
                print_success "Restaurant POS is running in production mode!"
                print_status "Frontend: http://localhost:3000"
                print_status "Backend API: http://localhost:5000"
                print_status "MongoDB: mongodb://localhost:27017"
            else
                print_error "Please configure .env file first"
                exit 1
            fi
            ;;
        "start-dev")
            check_docker
            check_env_file
            start_development
            echo ""
            print_success "Restaurant POS is running in development mode!"
            print_status "Frontend: http://localhost:5173 (Vite dev server)"
            print_status "Backend API: http://localhost:5000"
            print_status "MongoDB: mongodb://localhost:27017"
            ;;
        "stop")
            check_docker
            stop_services
            ;;
        "restart-prod")
            check_docker
            stop_services
            start_production
            ;;
        "restart-dev")
            check_docker
            stop_services
            start_development
            ;;
        "logs")
            check_docker
            show_logs "$2"
            ;;
        "status")
            check_docker
            show_status
            ;;
        "cleanup")
            check_docker
            cleanup
            ;;
        "backup")
            check_docker
            backup_database
            ;;
        "build")
            check_docker
            print_status "Building Docker images..."
            docker-compose build
            print_success "Docker images built successfully"
            ;;
        "help"|*)
            show_help
            ;;
    esac
}

# Run main function with all arguments
main "$@"
