# Test All Services (PowerShell)
# Tests both Auth and Meetings services

Write-Host "🧪 Testing FaithConnect Services" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check if services are running
function Test-Service {
    param(
        [string]$Url,
        [string]$Name
    )
    
    try {
        $response = Invoke-WebRequest -Uri "$Url/health" -Method GET -TimeoutSec 2 -ErrorAction Stop
        Write-Host "✅ $Name is running" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "❌ $Name is not running" -ForegroundColor Red
        return $false
    }
}

Write-Host "1. Checking services..." -ForegroundColor Yellow
$authRunning = Test-Service "http://localhost:3001" "Auth Service"
$meetingsRunning = Test-Service "http://localhost:3002" "Meetings Service"
Write-Host ""

# Test Auth Service
Write-Host "2. Testing Auth Service..." -ForegroundColor Yellow
if ($authRunning) {
    Write-Host "   Run: cd backend/services/auth-service && node scripts/test-auth-flow.js +237693805080" -ForegroundColor Cyan
} else {
    Write-Host "   ⚠️  Start Auth Service first: cd backend/services/auth-service && npm run dev" -ForegroundColor Yellow
}
Write-Host ""

# Test Meetings Service
Write-Host "3. Testing Meetings Service..." -ForegroundColor Yellow
if ($meetingsRunning) {
    Write-Host "   Run: cd backend/services/meetings-service && node scripts/test-meetings-flow.js" -ForegroundColor Cyan
} else {
    Write-Host "   ⚠️  Start Meetings Service first: cd backend/services/meetings-service && npm run dev" -ForegroundColor Yellow
}
Write-Host ""

Write-Host "================================" -ForegroundColor Cyan
Write-Host "✅ Test scripts ready!" -ForegroundColor Green
Write-Host ""
Write-Host "To test:" -ForegroundColor Yellow
Write-Host "  1. Start Auth Service:    cd backend/services/auth-service && npm run dev"
Write-Host "  2. Start Meetings Service: cd backend/services/meetings-service && npm run dev"
Write-Host "  3. Run tests in separate terminals"

