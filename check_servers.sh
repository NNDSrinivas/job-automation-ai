#!/bin/bash

# Job Automation AI - Server Status Check and Restart Script
# This script checks if the correct servers are running and restarts them if needed

echo "🔍 Checking Job Automation AI servers..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get the directory of this script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Check Backend (FastAPI with Uvicorn)
BACKEND_STATUS="❌"
if curl -s http://localhost:8000/docs > /dev/null 2>&1; then
    # Check if it's the right backend (FastAPI)
    if curl -s http://localhost:8000/docs | grep -q "swagger"; then
        BACKEND_STATUS="✅"
        echo -e "${GREEN}Backend (FastAPI): Running on port 8000${NC}"
    else
        echo -e "${YELLOW}Backend: Wrong server type on port 8000${NC}"
    fi
else
    echo -e "${RED}Backend (FastAPI): Not running on port 8000${NC}"
fi

# Check Frontend (Vite React)
FRONTEND_STATUS="❌"
if curl -s http://localhost:5173 > /dev/null 2>&1; then
    # Check if it's the right frontend (React with Vite)
    if curl -s http://localhost:5173 | grep -q "react-refresh"; then
        FRONTEND_STATUS="✅"
        echo -e "${GREEN}Frontend (React/Vite): Running on port 5173${NC}"
    else
        echo -e "${YELLOW}Frontend: Wrong server type on port 5173${NC}"
        # Kill any non-Vite server on port 5173
        lsof -ti:5173 | xargs kill 2>/dev/null
        FRONTEND_STATUS="❌"
    fi
else
    echo -e "${RED}Frontend (React/Vite): Not running on port 5173${NC}"
fi

echo ""
echo -e "${BLUE}📊 Server Status Summary:${NC}"
echo -e "Backend (FastAPI):  $BACKEND_STATUS"
echo -e "Frontend (React):   $FRONTEND_STATUS"

if [ "$BACKEND_STATUS" = "✅" ] && [ "$FRONTEND_STATUS" = "✅" ]; then
    echo ""
    echo -e "${GREEN}🎉 All servers are running correctly!${NC}"
    echo -e "${GREEN}🌐 Frontend: http://localhost:5173${NC}"
    echo -e "${GREEN}🔧 Backend API: http://localhost:8000${NC}"
    echo -e "${GREEN}📋 API Docs: http://localhost:8000/docs${NC}"
else
    echo ""
    echo -e "${YELLOW}⚠️  Some servers need to be started. Use './start_full_stack.sh' to start all servers.${NC}"
fi
