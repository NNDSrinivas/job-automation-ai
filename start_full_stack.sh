#!/bin/bash

# Job Automation AI - Full Stack Startup Script
# This script starts both the full-featured backend and frontend servers

echo "🚀 Starting Job Automation AI Full Stack Application..."

# Function to cleanup on exit
cleanup() {
    echo "🛑 Shutting down servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

# Trap to cleanup on script exit
trap cleanup SIGINT SIGTERM

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Get the directory of this script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo -e "${BLUE}📂 Project directory: $SCRIPT_DIR${NC}"

# Check if backend virtual environment exists
if [ ! -d "$SCRIPT_DIR/.venv" ]; then
    echo -e "${RED}❌ Virtual environment not found. Please run 'python -m venv .venv' first.${NC}"
    exit 1
fi

# Start Backend Server
echo -e "${GREEN}🔧 Starting FastAPI Backend Server on port 8000...${NC}"
cd "$SCRIPT_DIR"
source .venv/bin/activate
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Check if backend started successfully
if curl -s http://localhost:8000/docs > /dev/null; then
    echo -e "${GREEN}✅ Backend server started successfully!${NC}"
    echo -e "${GREEN}📋 API Documentation: http://localhost:8000/docs${NC}"
else
    echo -e "${RED}❌ Backend server failed to start!${NC}"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

# Start Frontend Server
echo -e "${GREEN}🎨 Starting Vite Frontend Server on port 5173...${NC}"
cd "$SCRIPT_DIR/frontend"
npm run dev &
FRONTEND_PID=$!

# Wait a moment for frontend to start
sleep 5

# Check if frontend started successfully
if curl -s http://localhost:5173 > /dev/null; then
    echo -e "${GREEN}✅ Frontend server started successfully!${NC}"
    echo -e "${GREEN}🌐 Frontend Application: http://localhost:5173${NC}"
else
    echo -e "${RED}❌ Frontend server failed to start!${NC}"
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 Full Stack Application Started Successfully!${NC}"
echo -e "${GREEN}🌐 Frontend: http://localhost:5173${NC}"
echo -e "${GREEN}🔧 Backend API: http://localhost:8000${NC}"
echo -e "${GREEN}📋 API Docs: http://localhost:8000/docs${NC}"
echo ""
echo -e "${BLUE}Press Ctrl+C to stop all servers${NC}"

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
