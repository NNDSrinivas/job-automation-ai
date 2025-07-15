#!/bin/bash

# Job Automation AI - Production Deployment Script
# This script sets up the complete production environment

echo "🚀 Starting Job Automation AI Production Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================${NC}"
}

# Check if running from correct directory
if [ ! -f "backend/main.py" ] || [ ! -f "frontend/package.json" ]; then
    print_error "Please run this script from the job-automation-ai root directory"
    exit 1
fi

print_header "JOB AUTOMATION AI - PRODUCTION DEPLOYMENT"

# Step 1: Environment Setup
print_status "Setting up environment variables..."
if [ ! -f ".env.production" ]; then
    cat > .env.production << EOF
# Production Environment Configuration
NODE_ENV=production
REACT_APP_API_URL=http://localhost:8000
REACT_APP_ENVIRONMENT=production

# Backend Configuration
DATABASE_URL=sqlite:///./job_automation.db
SECRET_KEY=$(openssl rand -hex 32)
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Job Portal Credentials (Set these with real values)
LINKEDIN_EMAIL=your_linkedin_email@example.com
LINKEDIN_PASSWORD=your_linkedin_password
INDEED_EMAIL=your_indeed_email@example.com
INDEED_PASSWORD=your_indeed_password

# OpenAI Configuration (Required for AI features)
OPENAI_API_KEY=your_openai_api_key_here

# Encryption Key for storing credentials securely
CREDENTIAL_ENCRYPTION_KEY=$(openssl rand -base64 32)

# Email Configuration (Optional - for notifications)
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your_email@gmail.com
SMTP_PASSWORD=your_app_password

# Production Settings
CORS_ORIGINS=["http://localhost:3000","http://localhost:8080","http://127.0.0.1:3000"]
DEBUG=false
LOG_LEVEL=INFO

# Rate Limiting
RATE_LIMIT_PER_MINUTE=60
MAX_APPLICATIONS_PER_DAY=50

# Proxy Configuration (Optional)
USE_PROXY=false
PROXY_LIST=[]
EOF
    print_status "Created .env.production file. Please update with your actual credentials!"
else
    print_warning ".env.production already exists. Skipping creation."
fi

# Step 2: Backend Setup
print_header "BACKEND SETUP"

print_status "Setting up Python virtual environment..."
if [ ! -d "backend/.venv" ]; then
    cd backend
    python3 -m venv .venv
    cd ..
fi

print_status "Activating virtual environment and installing dependencies..."
cd backend
source .venv/bin/activate
pip install -r requirements.txt
cd ..

# Step 3: Database Setup
print_status "Setting up production database..."
cd backend
source .venv/bin/activate
python -c "
from db import engine, Base
from models import *
print('Creating database tables...')
Base.metadata.create_all(bind=engine)
print('Database setup complete!')
"
cd ..

# Step 4: Frontend Build
print_header "FRONTEND BUILD"

print_status "Installing frontend dependencies..."
cd frontend
npm install

print_status "Building production frontend..."
npm run build
cd ..

# Step 5: Production Server Setup
print_header "PRODUCTION SERVER SETUP"

# Create production start script
print_status "Creating production start scripts..."

cat > start_production.sh << 'EOF'
#!/bin/bash

# Start Job Automation AI in Production Mode
echo "🚀 Starting Job Automation AI Production Server..."

# Start backend
echo "Starting backend server..."
cd backend
source .venv/bin/activate
nohup python -m uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4 > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
echo "Backend started with PID: $BACKEND_PID"
cd ..

# Start frontend server
echo "Starting frontend server..."
cd frontend
nohup npx serve -s dist -l 3000 > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo "Frontend started with PID: $FRONTEND_PID"
cd ..

# Save PIDs for later shutdown
echo $BACKEND_PID > backend.pid
echo $FRONTEND_PID > frontend.pid

echo ""
echo "🎉 Job Automation AI is now running in production mode!"
echo ""
echo "📱 Frontend URL: http://localhost:3000"
echo "🔧 Backend API: http://localhost:8000"
echo "📊 API Docs: http://localhost:8000/docs"
echo ""
echo "📝 Logs:"
echo "   Backend: logs/backend.log"
echo "   Frontend: logs/frontend.log"
echo ""
echo "⏹️  To stop the servers, run: ./stop_production.sh"
EOF

cat > stop_production.sh << 'EOF'
#!/bin/bash

# Stop Job Automation AI Production Server
echo "⏹️  Stopping Job Automation AI Production Server..."

if [ -f "backend.pid" ]; then
    BACKEND_PID=$(cat backend.pid)
    kill $BACKEND_PID 2>/dev/null && echo "Backend stopped (PID: $BACKEND_PID)" || echo "Backend process not found"
    rm backend.pid
fi

if [ -f "frontend.pid" ]; then
    FRONTEND_PID=$(cat frontend.pid)
    kill $FRONTEND_PID 2>/dev/null && echo "Frontend stopped (PID: $FRONTEND_PID)" || echo "Frontend process not found"
    rm frontend.pid
fi

echo "✅ All services stopped."
EOF

# Make scripts executable
chmod +x start_production.sh
chmod +x stop_production.sh

# Create logs directory
mkdir -p logs

# Step 6: Production Health Check
print_header "PRODUCTION HEALTH CHECK"

cat > health_check.sh << 'EOF'
#!/bin/bash

echo "🔍 Job Automation AI Health Check"
echo "================================"

# Check backend
echo -n "Backend (http://localhost:8000): "
if curl -s http://localhost:8000/health > /dev/null; then
    echo "✅ Running"
else
    echo "❌ Not responding"
fi

# Check frontend
echo -n "Frontend (http://localhost:3000): "
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Running"
else
    echo "❌ Not responding"
fi

# Check database
echo -n "Database: "
cd backend
source .venv/bin/activate
python -c "
try:
    from db import engine
    from sqlalchemy import text
    with engine.connect() as conn:
        conn.execute(text('SELECT 1'))
    print('✅ Connected')
except Exception as e:
    print(f'❌ Error: {e}')
" 2>/dev/null
cd ..

echo ""
echo "📊 System Status:"
echo "   CPU Usage: $(top -l 1 | grep "CPU usage" | awk '{print $3}' | sed 's/%//')"
echo "   Memory Usage: $(top -l 1 | grep "PhysMem" | awk '{print $2}')"
echo "   Disk Usage: $(df -h . | tail -1 | awk '{print $5}')"
EOF

chmod +x health_check.sh

# Step 7: Docker Setup (Optional)
print_header "DOCKER SETUP"

if command -v docker &> /dev/null; then
    print_status "Docker found. Creating production Docker setup..."

    cat > docker-compose.production.yml << 'EOF'
version: '3.8'

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=sqlite:///./job_automation.db
      - CORS_ORIGINS=["http://localhost:3000"]
    volumes:
      - ./backend/job_automation.db:/app/job_automation.db
      - ./logs:/app/logs
    restart: unless-stopped

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3000:80"
    depends_on:
      - backend
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.production.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - frontend
      - backend
    restart: unless-stopped
EOF

    cat > nginx.production.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    upstream backend {
        server backend:8000;
    }

    upstream frontend {
        server frontend:80;
    }

    server {
        listen 80;
        server_name localhost;

        # Frontend
        location / {
            proxy_pass http://frontend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }

        # Backend API
        location /api/ {
            proxy_pass http://backend/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }

        # WebSocket support
        location /ws {
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
        }
    }
}
EOF

    print_status "Docker configuration created. Run 'docker-compose -f docker-compose.production.yml up -d' to start with Docker."
else
    print_warning "Docker not found. Skipping Docker setup."
fi

# Step 8: Final Instructions
print_header "DEPLOYMENT COMPLETE"

print_status "Job Automation AI Production Environment is ready!"
echo ""
echo "📋 Next Steps:"
echo "   1. Update .env.production with your actual credentials"
echo "   2. Run: ./start_production.sh"
echo "   3. Visit: http://localhost:3000"
echo ""
echo "🔧 Management Commands:"
echo "   Start:        ./start_production.sh"
echo "   Stop:         ./stop_production.sh"
echo "   Health Check: ./health_check.sh"
echo ""
echo "🐳 Docker (Optional):"
echo "   Start: docker-compose -f docker-compose.production.yml up -d"
echo "   Stop:  docker-compose -f docker-compose.production.yml down"
echo ""
echo "📚 Documentation:"
echo "   API Docs: http://localhost:8000/docs"
echo "   Logs: ./logs/"
echo ""
print_status "Ready for production! 🚀"
