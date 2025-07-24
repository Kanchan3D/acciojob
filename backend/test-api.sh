#!/bin/bash

# Test script for AI Playground Backend API
API_BASE="http://localhost:8001/api"

echo "🧪 Testing AI Playground Backend API"
echo "===================================="

# Test health endpoint
echo "1. Testing health endpoint..."
curl -s "$API_BASE/health" | jq '.'
echo ""

# Test user registration
echo "2. Testing user registration..."
REGISTER_RESPONSE=$(curl -s -X POST "$API_BASE/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "Password123"
  }')

echo "$REGISTER_RESPONSE" | jq '.'

# Extract tokens if registration successful
ACCESS_TOKEN=$(echo "$REGISTER_RESPONSE" | jq -r '.data.accessToken // empty')
REFRESH_TOKEN=$(echo "$REGISTER_RESPONSE" | jq -r '.data.refreshToken // empty')

if [ ! -z "$ACCESS_TOKEN" ]; then
  echo ""
  echo "3. Testing authenticated endpoint (get profile)..."
  curl -s -X GET "$API_BASE/user/profile" \
    -H "Authorization: Bearer $ACCESS_TOKEN" | jq '.'
  
  echo ""
  echo "4. Testing session creation..."
  curl -s -X POST "$API_BASE/playground/sessions" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "name": "My First Session",
      "description": "Testing session creation",
      "code": "console.log(\"Hello, World!\");",
      "language": "javascript"
    }' | jq '.'
else
  echo "❌ Registration failed, skipping authenticated tests"
fi

echo ""
echo "✅ API tests completed!"
