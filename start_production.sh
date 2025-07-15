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
