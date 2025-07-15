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
