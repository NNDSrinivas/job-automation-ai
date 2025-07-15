#!/bin/bash

echo "🧪 Testing the complete authentication flow..."

# First check if the backend is running
echo "📡 Checking backend health..."
curl -s http://localhost:8000/health | jq . || echo "Backend might not be running!"

echo ""
echo "🔐 Testing login with test user..."
login_response=$(curl -s -X POST http://localhost:8000/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=test_1752528002&password=password123")

echo "Login Response: $login_response"

# Extract token
token=$(echo $login_response | jq -r '.access_token')
echo "Extracted Token: $token"

if [ "$token" != "null" ] && [ "$token" != "" ]; then
    echo "✅ Backend login successful!"

    # Test token validation
    echo ""
    echo "🔍 Testing token validation..."
    auth_response=$(curl -s -X GET http://localhost:8000/api/auth/me \
      -H "Authorization: Bearer $token")

    echo "Auth Response: $auth_response"

    echo ""
    echo "🌐 Frontend should be running on: http://localhost:5175"
    echo "🔍 Test Credentials:"
    echo "   Username: test_1752528002"
    echo "   Password: password123"
    echo ""
    echo "💡 Try logging in on the frontend now!"
else
    echo "❌ Backend login failed!"
fi
