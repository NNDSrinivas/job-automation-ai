#!/bin/bash

echo "Testing Frontend Routing Issues"
echo "==============================="

# Check if servers are running
echo "1. Checking if backend is running..."
BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/docs)
if [ "$BACKEND_STATUS" = "200" ]; then
    echo "✅ Backend is running"
else
    echo "❌ Backend not running (status: $BACKEND_STATUS)"
fi

echo ""
echo "2. Checking if frontend is running..."
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5174)
if [ "$FRONTEND_STATUS" = "200" ]; then
    echo "✅ Frontend is running"
else
    echo "❌ Frontend not running (status: $FRONTEND_STATUS)"
fi

echo ""
echo "3. Testing browser clear localStorage simulation..."
echo "To clear localStorage, run this in browser console:"
echo "localStorage.clear(); window.location.reload();"

echo ""
echo "4. Testing with fresh user..."
# Create a test user
TIMESTAMP=$(date +%s)
TEST_EMAIL="test_${TIMESTAMP}@example.com"
TEST_USERNAME="test_${TIMESTAMP}"

echo "Creating test user: $TEST_EMAIL"
REGISTER_RESPONSE=$(curl -s -X POST "http://localhost:8000/register" \
     -H "Content-Type: application/json" \
     -d "{
       \"email\": \"$TEST_EMAIL\",
       \"password\": \"testpass123\",
       \"full_name\": \"Test User\",
       \"username\": \"$TEST_USERNAME\"
     }")

echo "Registration: $REGISTER_RESPONSE"

echo ""
echo "Login test with username: $TEST_USERNAME"
LOGIN_RESPONSE=$(curl -s -X POST "http://localhost:8000/login" \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "username=$TEST_USERNAME&password=testpass123")

echo "Login Response: $LOGIN_RESPONSE"

echo ""
echo "==============================="
echo "Manual Testing Steps:"
echo "1. Open http://localhost:5174 in browser"
echo "2. Open Developer Tools (F12)"
echo "3. Go to Console tab"
echo "4. Run: localStorage.clear(); window.location.reload();"
echo "5. You should see the Landing Page"
echo "6. Click 'Sign In' and try credentials:"
echo "   Username: $TEST_USERNAME"
echo "   Password: testpass123"
echo "7. Check if it redirects to /dashboard"
