#!/bin/bash
# Celery Worker Startup Script

# Start Redis server (if not already running)
if ! pgrep -x "redis-server" > /dev/null; then
    echo "Starting Redis server..."
    redis-server --daemonize yes
    sleep 2
fi

# Set environment variables
export PYTHONPATH="${PYTHONPATH}:/Users/mounikakapa/job-automation-ai/backend"

# Navigate to backend directory
cd /Users/mounikakapa/job-automation-ai/backend

# Start Celery worker
echo "Starting Celery worker..."
/Users/mounikakapa/job-automation-ai/.venv/bin/celery -A celery_config worker --loglevel=info --concurrency=4

# Optional: Start Celery beat (for periodic tasks) in background
# /Users/mounikakapa/job-automation-ai/.venv/bin/celery -A celery_config beat --loglevel=info &

echo "Celery worker started!"
