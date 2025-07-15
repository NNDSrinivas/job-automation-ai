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
