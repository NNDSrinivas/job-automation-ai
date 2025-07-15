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

# Enhanced production deployment with commercial features
enhanced_production_setup() {
    print_status "Setting up enhanced production features..."

    # Create advanced monitoring configuration
    cat > monitoring/prometheus.yml << EOF
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  # - "first_rules.yml"
  # - "second_rules.yml"

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'job-automation-backend'
    static_configs:
      - targets: ['backend:8000']
    metrics_path: '/metrics'
    scrape_interval: 5s

  - job_name: 'nginx'
    static_configs:
      - targets: ['nginx:80']

  - job_name: 'redis'
    static_configs:
      - targets: ['redis:6379']

  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres:5432']
EOF

    # Create Grafana dashboard configuration
    cat > monitoring/grafana/dashboards/job-automation.json << EOF
{
  "dashboard": {
    "id": null,
    "title": "Job Automation AI - Commercial Dashboard",
    "tags": [ "job-automation", "ai", "commercial" ],
    "timezone": "browser",
    "panels": [
      {
        "title": "Applications Per Minute",
        "type": "stat",
        "targets": [
          {
            "expr": "rate(job_applications_total[1m])",
            "legendFormat": "Applications/min"
          }
        ]
      },
      {
        "title": "Success Rate",
        "type": "stat",
        "targets": [
          {
            "expr": "job_application_success_rate",
            "legendFormat": "Success %"
          }
        ]
      },
      {
        "title": "Active Users",
        "type": "stat",
        "targets": [
          {
            "expr": "active_users_count",
            "legendFormat": "Users"
          }
        ]
      }
    ]
  }
}
EOF

    # Create production docker-compose with monitoring
    cat > docker-compose.monitoring.yml << EOF
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    container_name: prometheus
    restart: unless-stopped
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
      - '--web.enable-lifecycle'

  grafana:
    image: grafana/grafana:latest
    container_name: grafana
    restart: unless-stopped
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin123
    volumes:
      - grafana_data:/var/lib/grafana
      - ./monitoring/grafana/dashboards:/etc/grafana/provisioning/dashboards
      - ./monitoring/grafana/datasources:/etc/grafana/provisioning/datasources

  redis-exporter:
    image: oliver006/redis_exporter:latest
    container_name: redis_exporter
    restart: unless-stopped
    ports:
      - "9121:9121"
    environment:
      - REDIS_ADDR=redis:6379
    depends_on:
      - redis

  postgres-exporter:
    image: prometheuscommunity/postgres-exporter:latest
    container_name: postgres_exporter
    restart: unless-stopped
    ports:
      - "9187:9187"
    environment:
      - DATA_SOURCE_NAME=postgresql://\${DB_USER}:\${DB_PASSWORD}@postgres:5432/\${DB_NAME}?sslmode=disable
    depends_on:
      - postgres

volumes:
  prometheus_data:
  grafana_data:
EOF

    print_success "Enhanced production monitoring configured"
}

# Setup SSL certificates for production
setup_ssl() {
    print_status "Setting up SSL certificates..."

    if [[ ! -f nginx/ssl/cert.pem ]] || [[ ! -f nginx/ssl/key.pem ]]; then
        print_warning "SSL certificates not found. Generating self-signed certificates..."
        print_warning "For production, replace these with proper SSL certificates from Let's Encrypt or your CA"

        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout nginx/ssl/key.pem \
            -out nginx/ssl/cert.pem \
            -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
    fi

    print_success "SSL certificates configured"
}

# Performance optimization for production
optimize_for_production() {
    print_status "Applying production optimizations..."

    # Create optimized nginx configuration
    cat > nginx/nginx.prod.conf << EOF
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    # Logging
    log_format main '\$remote_addr - \$remote_user [\$time_local] "\$request" '
                    '\$status \$body_bytes_sent "\$http_referer" '
                    '"\$http_user_agent" "\$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;
    error_log /var/log/nginx/error.log;

    # Performance settings
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 10240;
    gzip_proxied expired no-cache no-store private must-revalidate;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Rate limiting
    limit_req_zone \$binary_remote_addr zone=api:10m rate=10r/s;

    upstream backend {
        server backend:8000;
        keepalive 32;
    }

    server {
        listen 80;
        server_name _;
        return 301 https://\$server_name\$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name _;

        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
        ssl_prefer_server_ciphers off;

        # Security headers
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header X-XSS-Protection "1; mode=block";
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

        # Frontend
        location / {
            root /usr/share/nginx/html;
            index index.html;
            try_files \$uri \$uri/ /index.html;

            # Cache static assets
            location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
                expires 1y;
                add_header Cache-Control "public, immutable";
            }
        }

        # API routes
        location /api/ {
            limit_req zone=api burst=20 nodelay;

            proxy_pass http://backend;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
            proxy_connect_timeout 300s;
            proxy_send_timeout 300s;
            proxy_read_timeout 300s;
        }

        # WebSocket support
        location /ws/ {
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade \$http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
        }
    }
}
EOF

    print_success "Production optimizations applied"
}

# Commercial grade deployment
deploy_commercial_grade() {
    print_status "Starting commercial-grade deployment..."

    enhanced_production_setup
    setup_ssl
    optimize_for_production

    # Deploy with monitoring
    print_status "Deploying application with monitoring stack..."
    docker-compose -f docker-compose.prod.yml -f docker-compose.monitoring.yml up -d

    # Wait for services to be ready
    print_status "Waiting for services to be ready..."
    sleep 30

    # Run health checks
    check_service_health

    print_success "Commercial-grade deployment completed!"
    print_success "Application: https://localhost"
    print_success "Monitoring: http://localhost:3001 (Grafana)"
    print_success "Metrics: http://localhost:9090 (Prometheus)"
}

# Health check for services
check_service_health() {
    print_status "Running health checks..."

    local services=("backend" "frontend" "postgres" "redis" "nginx")
    local failed_services=()

    for service in "\${services[@]}"; do
        if docker-compose -f docker-compose.prod.yml ps "\$service" | grep -q "Up"; then
            print_success "\$service is running"
        else
            print_error "\$service is not running"
            failed_services+=("\$service")
        fi
    done

    if [[ \${#failed_services[@]} -eq 0 ]]; then
        print_success "All services are healthy"
    else
        print_error "Failed services: \${failed_services[*]}"
        return 1
    fi
}

# Main deployment process
main() {
    echo "🚀 Job Automation AI - Commercial Production Deployment"
    echo "======================================================"

    # Parse command line arguments
    DEPLOYMENT_TYPE="standard"
    while [[ $# -gt 0 ]]; do
        case $1 in
            --commercial)
                DEPLOYMENT_TYPE="commercial"
                shift
                ;;
            --monitoring)
                DEPLOYMENT_TYPE="monitoring"
                shift
                ;;
            *)
                echo "Unknown option: $1"
                echo "Usage: $0 [--commercial|--monitoring]"
                exit 1
                ;;
        esac
    done

    check_dependencies
    check_environment
    create_directories

    if [[ "$DEPLOYMENT_TYPE" == "commercial" ]]; then
        print_status "🏢 Starting COMMERCIAL-GRADE deployment..."
        deploy_commercial_grade
    elif [[ "$DEPLOYMENT_TYPE" == "monitoring" ]]; then
        print_status "📊 Starting deployment with MONITORING..."
        enhanced_production_setup
        generate_ssl
        deploy_services
        wait_for_services
        run_migrations
        health_check
        show_deployment_info
    else
        print_status "🔧 Starting STANDARD deployment..."
        generate_ssl
        deploy_services
        wait_for_services
        run_migrations
        health_check
        show_deployment_info
    fi
}

# Run main function
main "$@"
