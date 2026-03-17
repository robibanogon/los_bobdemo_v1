#!/bin/bash

echo "Testing Backend Endpoints..."
echo "=============================="
echo ""

# Test if backend is running
echo "1. Testing if backend is running..."
curl -s http://localhost:3001/health > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Backend is running on port 5001"
else
    echo "❌ Backend is NOT running on port 5001"
    echo "   Please start backend with: cd backend && npm start"
    exit 1
fi

echo ""
echo "2. Testing login endpoint..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"rm1","password":"password123"}')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo "❌ Login failed"
    echo "Response: $LOGIN_RESPONSE"
    exit 1
else
    echo "✅ Login successful"
fi

echo ""
echo "3. Testing GET /applications endpoint..."
APPS_RESPONSE=$(curl -s http://localhost:3001/api/applications \
  -H "Authorization: Bearer $TOKEN")

if echo "$APPS_RESPONSE" | grep -q "application_number"; then
    echo "✅ GET /applications working"
    APP_COUNT=$(echo "$APPS_RESPONSE" | grep -o "application_number" | wc -l)
    echo "   Found $APP_COUNT applications"
else
    echo "❌ GET /applications failed"
    echo "Response: $APPS_RESPONSE"
fi

echo ""
echo "4. Testing GET /applications/:id endpoint..."
FIRST_APP_ID=$(echo "$APPS_RESPONSE" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -z "$FIRST_APP_ID" ]; then
    echo "⚠️  No applications found to test"
else
    APP_DETAIL=$(curl -s http://localhost:3001/api/applications/$FIRST_APP_ID \
      -H "Authorization: Bearer $TOKEN")
    
    if echo "$APP_DETAIL" | grep -q "application_number"; then
        echo "✅ GET /applications/:id working"
        APP_NUM=$(echo "$APP_DETAIL" | grep -o '"application_number":"[^"]*' | cut -d'"' -f4)
        echo "   Retrieved: $APP_NUM"
    else
        echo "❌ GET /applications/:id failed"
        echo "Response: $APP_DETAIL"
    fi
fi

echo ""
echo "5. Testing GET /applications/:id/agent-review endpoint..."
if [ ! -z "$FIRST_APP_ID" ]; then
    REVIEW_RESPONSE=$(curl -s http://localhost:3001/api/applications/$FIRST_APP_ID/agent-review \
      -H "Authorization: Bearer $TOKEN")
    
    if echo "$REVIEW_RESPONSE" | grep -q "recommended_decision"; then
        echo "✅ GET /applications/:id/agent-review working"
    elif echo "$REVIEW_RESPONSE" | grep -q "not found"; then
        echo "⚠️  Agent review not found (this is OK if review hasn't been run)"
    else
        echo "❌ GET /applications/:id/agent-review failed"
        echo "Response: $REVIEW_RESPONSE"
    fi
fi

echo ""
echo "=============================="
echo "Backend testing complete!"

# Made with Bob
