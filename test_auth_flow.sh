#!/bin/bash

echo "Testing Job Automation AI Authentication Flow"
echo "============================================"

# Test registration
echo "1. Testing Registration..."
REGISTER_RESPONSE=$(curl -s -X POST "http://localhost:8000/register" \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test_'$(date +%s)'@example.com",
       "password": "testpass123",
       "full_name": "Test User",
       "username": "test_'$(date +%s)'"
     }')

echo "Registration Response: $REGISTER_RESPONSE"

# Extract email from registration response for login test
EMAIL=$(echo $REGISTER_RESPONSE | grep -o '"email":"[^"]*"' | cut -d'"' -f4)
echo "Extracted email: $EMAIL"

# Test login with email
echo "2. Testing Login with Email..."
LOGIN_RESPONSE=$(curl -s -X POST "http://localhost:8000/login" \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "username=$EMAIL&password=testpass123")

echo "Login Response: $LOGIN_RESPONSE"

# Extract token for auth test
TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
echo "Extracted token: ${TOKEN:0:50}..."

# Test authentication endpoint
echo "3. Testing Authentication Validation..."
AUTH_RESPONSE=$(curl -s -X GET "http://localhost:8000/api/auth/me" \
     -H "Authorization: Bearer $TOKEN")

echo "Auth Validation Response: $AUTH_RESPONSE"

echo "============================================"
echo "Test completed! Check responses above."
