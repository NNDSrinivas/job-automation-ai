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
