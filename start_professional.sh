#!/bin/bash

# 🚀 JobAI Pro - Professional Startup Script
# This script starts both backend and frontend services in development mode

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

print_header() {
    echo -e "${PURPLE}"
    echo "🚀 =================================================="
    echo "     JobAI Pro - Professional Startup Script"
    echo "=================================================="
    echo -e "${NC}"
}

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

# Check if script is run from project root
check_directory() {
    if [[ ! -d "backend" || ! -d "frontend" ]]; then
        print_error "Please run this script from the project root directory"
        exit 1
    fi
    print_success "Running from correct directory"
}

# Check if Python virtual environment exists
check_python_env() {
    if [[ ! -d "backend/.venv" && ! -d ".venv" ]]; then
        print_warning "Python virtual environment not found, creating one..."
        cd backend
        python3 -m venv .venv
        source .venv/bin/activate
        pip install -r requirements.txt
        cd ..
        print_success "Python environment created and dependencies installed"
    else
        print_success "Python virtual environment found"
    fi
}

# Check if Node.js dependencies are installed
check_node_deps() {
    if [[ ! -d "frontend/node_modules" ]]; then
        print_warning "Node.js dependencies not found, installing..."
        cd frontend
        npm install --legacy-peer-deps
        cd ..
        print_success "Node.js dependencies installed"
    else
        print_success "Node.js dependencies found"
    fi
}

# Kill existing processes on ports 8000 and 5173
kill_existing_processes() {
    print_status "Checking for existing processes..."

    # Kill process on port 8000 (backend)
    if lsof -ti:8000 > /dev/null 2>&1; then
        print_warning "Killing existing process on port 8000..."
        kill -9 $(lsof -ti:8000) 2>/dev/null || true
    fi

    # Kill process on port 5173 (frontend)
    if lsof -ti:5173 > /dev/null 2>&1; then
        print_warning "Killing existing process on port 5173..."
        kill -9 $(lsof -ti:5173) 2>/dev/null || true
    fi

    sleep 2
    print_success "Ports cleared"
}

# Start backend service
start_backend() {
    print_status "Starting backend service..."
    cd backend

    # Activate virtual environment
    if [[ -d ".venv" ]]; then
        source .venv/bin/activate
    elif [[ -d "../.venv" ]]; then
        source ../.venv/bin/activate
    fi

    # Start uvicorn in background
    nohup uvicorn main:app --reload --host 0.0.0.0 --port 8000 > ../backend.log 2>&1 &
    BACKEND_PID=$!

    cd ..

    # Wait for backend to start
    print_status "Waiting for backend to start..."
    for i in {1..30}; do
        if curl -s http://localhost:8000/health > /dev/null 2>&1; then
            print_success "Backend started successfully on http://localhost:8000"
            return 0
        fi
        sleep 1
    done

    print_error "Backend failed to start"
    return 1
}

# Start frontend service
start_frontend() {
    print_status "Starting frontend service..."
    cd frontend

    # Start Vite in background
    nohup npm run dev > ../frontend.log 2>&1 &
    FRONTEND_PID=$!

    cd ..

    # Wait for frontend to start
    print_status "Waiting for frontend to start..."
    for i in {1..30}; do
        if curl -s http://localhost:5173 > /dev/null 2>&1; then
            print_success "Frontend started successfully on http://localhost:5173"
            return 0
        fi
        sleep 1
    done

    print_error "Frontend failed to start"
    return 1
}

# Display service information
show_service_info() {
    echo -e "${PURPLE}"
    echo "🎉 =================================================="
    echo "     JobAI Pro is now running!"
    echo "=================================================="
    echo -e "${NC}"
    echo ""
    echo -e "${GREEN}🌐 Frontend (Landing Page):${NC} http://localhost:5173"
    echo -e "${GREEN}📊 Dashboard:${NC}               http://localhost:5173/dashboard"
    echo -e "${GREEN}🤖 Automation:${NC}              http://localhost:5173/automation"
    echo -e "${GREEN}🔧 Backend API:${NC}             http://localhost:8000"
    echo -e "${GREEN}📚 API Documentation:${NC}       http://localhost:8000/docs"
    echo ""
    echo -e "${YELLOW}📝 Logs:${NC}"
    echo -e "   Backend: tail -f backend.log"
    echo -e "   Frontend: tail -f frontend.log"
    echo ""
    echo -e "${BLUE}⚡ Quick Commands:${NC}"
    echo -e "   Stop services: ./stop_services.sh"
    echo -e "   View logs: tail -f *.log"
    echo -e "   Test API: curl http://localhost:8000/health"
    echo ""
    echo -e "${PURPLE}🚀 Ready to revolutionize job hunting!${NC}"
}

# Create stop script
create_stop_script() {
    cat > stop_services.sh << 'EOF'
#!/bin/bash
echo "🛑 Stopping JobAI Pro services..."

# Kill processes on specific ports
if lsof -ti:8000 > /dev/null 2>&1; then
    echo "Stopping backend (port 8000)..."
    kill -9 $(lsof -ti:8000) 2>/dev/null || true
fi

if lsof -ti:5173 > /dev/null 2>&1; then
    echo "Stopping frontend (port 5173)..."
    kill -9 $(lsof -ti:5173) 2>/dev/null || true
fi

echo "✅ All services stopped"
EOF
    chmod +x stop_services.sh
}

# Handle script interruption
cleanup() {
    echo ""
    print_warning "Script interrupted. Cleaning up..."

    if [[ -n "$BACKEND_PID" ]]; then
        kill $BACKEND_PID 2>/dev/null || true
    fi

    if [[ -n "$FRONTEND_PID" ]]; then
        kill $FRONTEND_PID 2>/dev/null || true
    fi

    exit 130
}

# Main execution
main() {
    trap cleanup INT TERM

    print_header

    print_status "Initializing JobAI Pro startup sequence..."

    check_directory
    check_python_env
    check_node_deps
    kill_existing_processes

    if start_backend && start_frontend; then
        create_stop_script
        show_service_info

        # Keep script running
        print_status "Services are running. Press Ctrl+C to stop."
        while true; do
            sleep 10

            # Health check
            if ! curl -s http://localhost:8000/health > /dev/null 2>&1; then
                print_error "Backend health check failed"
                break
            fi

            if ! curl -s http://localhost:5173 > /dev/null 2>&1; then
                print_error "Frontend health check failed"
                break
            fi
        done
    else
        print_error "Failed to start services"
        exit 1
    fi
}

# Run main function
main "$@"
