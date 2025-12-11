#!/bin/bash
# Test All Services
# Tests both Auth and Meetings services

echo "🧪 Testing FaithConnect Services"
echo "================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if services are running
check_service() {
    local url=$1
    local name=$2
    
    if curl -s "$url/health" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ $name is running${NC}"
        return 0
    else
        echo -e "${RED}❌ $name is not running${NC}"
        return 1
    fi
}

echo "1. Checking services..."
check_service "http://localhost:3001" "Auth Service"
check_service "http://localhost:3002" "Meetings Service"
echo ""

# Test Auth Service
echo "2. Testing Auth Service..."
if check_service "http://localhost:3001" "Auth Service" > /dev/null; then
    echo "   Run: cd backend/services/auth-service && node scripts/test-auth-flow.js +237693805080"
else
    echo -e "${YELLOW}   ⚠️  Start Auth Service first: cd backend/services/auth-service && npm run dev${NC}"
fi
echo ""

# Test Meetings Service
echo "3. Testing Meetings Service..."
if check_service "http://localhost:3002" "Meetings Service" > /dev/null; then
    echo "   Run: cd backend/services/meetings-service && node scripts/test-meetings-flow.js"
else
    echo -e "${YELLOW}   ⚠️  Start Meetings Service first: cd backend/services/meetings-service && npm run dev${NC}"
fi
echo ""

echo "================================"
echo "✅ Test scripts ready!"
echo ""
echo "To test:"
echo "  1. Start Auth Service:    cd backend/services/auth-service && npm run dev"
echo "  2. Start Meetings Service: cd backend/services/meetings-service && npm run dev"
echo "  3. Run tests in separate terminals"

