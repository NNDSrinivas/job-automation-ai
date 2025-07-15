#!/bin/bash

echo "🔍 Frontend Authentication Debugging"
echo "======================================"

# Test direct login and check response
echo "1. Testing direct login to see token generation..."
LOGIN_RESPONSE=$(curl -s -X POST "http://localhost:8000/login" \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d 'username=test_1752528002&password=testpass123')

echo "Login Response: $LOGIN_RESPONSE"

# Extract token
TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
echo "Token extracted: ${TOKEN:0:50}..."

# Test token validation
echo ""
echo "2. Testing token validation..."
AUTH_RESPONSE=$(curl -s -X GET "http://localhost:8000/api/auth/me" \
     -H "Authorization: Bearer $TOKEN")

echo "Auth validation: $AUTH_RESPONSE"

echo ""
echo "3. Frontend debugging steps:"
echo "   - Open browser at http://localhost:5174"
echo "   - Look at top-right corner for Auth Debug panel"
echo "   - Clear localStorage using the button"
echo "   - Try navigating to different routes"
echo "   - Check console logs in browser dev tools"

echo ""
echo "4. Manual browser testing:"
echo "   a) Clear localStorage: localStorage.clear(); window.location.reload();"
echo "   b) Go to http://localhost:5174/ (should show Landing)"
echo "   c) Go to http://localhost:5174/login (should show Login)"
echo "   d) Login with: test_1752528002 / testpass123"
echo "   e) Should redirect to /dashboard"

echo ""
echo "5. If still issues, check browser console for these logs:"
echo "   - 🏠 AuthenticatedApp render"
echo "   - 🔍 AuthProvider init"
echo "   - 🔐 Login attempt"
echo "   - 🔄 Rendering [Page]"
