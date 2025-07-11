#!/bin/bash

# Production Deployment Script for Job Automation AI
# This script handles the complete deployment process

set -e  # Exit on any error

echo "🚀 Starting Job Automation AI Production Deployment"

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

# Check if Docker and Docker Compose are installed
check_dependencies() {
    print_status "Checking dependencies..."
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    print_success "Dependencies check passed"
}

# Check if .env.prod exists
check_environment() {
    print_status "Checking environment configuration..."
    
    if [[ ! -f .env.prod ]]; then
        print_warning ".env.prod not found. Creating from template..."
        cp .env.prod.example .env.prod
        print_warning "Please edit .env.prod with your actual configuration values before continuing."
        print_warning "Especially important: DB_PASSWORD, SECRET_KEY, OPENAI_API_KEY"
        read -p "Press Enter after you've configured .env.prod..."
    fi
    
    print_success "Environment configuration check passed"
}

# Create necessary directories
create_directories() {
    print_status "Creating necessary directories..."
    
    mkdir -p logs/nginx
    mkdir -p logs/backend
    mkdir -p monitoring/grafana/dashboards
    mkdir -p monitoring/grafana/datasources
    mkdir -p nginx/ssl
    mkdir -p data/postgres
    mkdir -p data/redis
    
    print_success "Directories created"
}

# Generate SSL certificates (self-signed for testing)
generate_ssl() {
    print_status "Checking SSL certificates..."
    
    if [[ ! -f nginx/ssl/cert.pem ]]; then
        print_status "Generating self-signed SSL certificates..."
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout nginx/ssl/key.pem \
            -out nginx/ssl/cert.pem \
            -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
        print_success "SSL certificates generated"
    else
        print_success "SSL certificates already exist"
    fi
}

# Build and start services
deploy_services() {
    print_status "Building and starting services..."
    
    # Load environment variables
    export $(cat .env.prod | xargs)
    
    # Build and start all services
    docker-compose -f docker-compose.prod.yml down --remove-orphans
    docker-compose -f docker-compose.prod.yml build --no-cache
    docker-compose -f docker-compose.prod.yml up -d
    
    print_success "Services deployed"
}

# Wait for services to be healthy
wait_for_services() {
    print_status "Waiting for services to be ready..."
    
    # Wait for database
    print_status "Waiting for PostgreSQL..."
    while ! docker-compose -f docker-compose.prod.yml exec -T postgres pg_isready -U ${DB_USER:-postgres} > /dev/null 2>&1; do
        sleep 2
    done
    print_success "PostgreSQL is ready"
    
    # Wait for Redis
    print_status "Waiting for Redis..."
    while ! docker-compose -f docker-compose.prod.yml exec -T redis redis-cli ping > /dev/null 2>&1; do
        sleep 2
    done
    print_success "Redis is ready"
    
    # Wait for backend
    print_status "Waiting for Backend API..."
    while ! curl -f http://localhost:8000/health > /dev/null 2>&1; do
        sleep 5
    done
    print_success "Backend API is ready"
    
    # Wait for frontend
    print_status "Waiting for Frontend..."
    while ! curl -f http://localhost:3000 > /dev/null 2>&1; do
        sleep 5
    done
    print_success "Frontend is ready"
}

# Run database migrations
run_migrations() {
    print_status "Running database migrations..."
    
    # Run Alembic migrations
    docker-compose -f docker-compose.prod.yml exec backend alembic upgrade head
    
    print_success "Database migrations completed"
}

# Health check
health_check() {
    print_status "Performing health checks..."
    
    # Check all services
    services=("postgres" "redis" "backend" "celery_worker" "frontend")
    
    for service in "${services[@]}"; do
        if docker-compose -f docker-compose.prod.yml ps $service | grep -q "Up"; then
            print_success "$service is running"
        else
            print_error "$service is not running"
            exit 1
        fi
    done
    
    # Check API endpoints
    if curl -f http://localhost:8000/health > /dev/null 2>&1; then
        print_success "Backend API health check passed"
    else
        print_error "Backend API health check failed"
        exit 1
    fi
    
    if curl -f http://localhost:3000 > /dev/null 2>&1; then
        print_success "Frontend health check passed"
    else
        print_error "Frontend health check failed"
        exit 1
    fi
}

# Display deployment information
show_deployment_info() {
    print_success "🎉 Deployment completed successfully!"
    echo ""
    echo "📋 Service URLs:"
    echo "   Frontend:     http://localhost:3000"
    echo "   Backend API:  http://localhost:8000"
    echo "   API Docs:     http://localhost:8000/docs"
    echo "   Flower:       http://localhost:5555"
    echo "   Prometheus:   http://localhost:9090"
    echo "   Grafana:      http://localhost:3001"
    echo ""
    echo "📊 Monitoring:"
    echo "   Logs:         docker-compose -f docker-compose.prod.yml logs -f"
    echo "   Status:       docker-compose -f docker-compose.prod.yml ps"
    echo ""
    echo "🔧 Management Commands:"
    echo "   Stop:         docker-compose -f docker-compose.prod.yml down"
    echo "   Restart:      docker-compose -f docker-compose.prod.yml restart"
    echo "   Update:       ./deploy.sh"
    echo ""
    echo "✅ Job Automation AI is now running in production mode!"
}

# Cleanup function
cleanup() {
    if [[ $? -ne 0 ]]; then
        print_error "Deployment failed. Cleaning up..."
        docker-compose -f docker-compose.prod.yml down --remove-orphans
    fi
}

# Set trap for cleanup
trap cleanup EXIT

# Main deployment process
main() {
    echo "🚀 Job Automation AI - Production Deployment Script"
    echo "=================================================="
    
    check_dependencies
    check_environment
    create_directories
    generate_ssl
    deploy_services
    wait_for_services
    run_migrations
    health_check
    show_deployment_info
}

# Run main function
main "$@"
