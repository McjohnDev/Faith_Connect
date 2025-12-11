# Local Setup Script for FaithConnect
# This script helps set up the project without Docker

Write-Host "🚀 FaithConnect Local Setup" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "backend")) {
    Write-Host "❌ Error: Please run this script from the project root (D:\Faith_Connect)" -ForegroundColor Red
    exit 1
}

Write-Host "📦 Step 1: Installing dependencies..." -ForegroundColor Yellow

# Install database migration dependencies
Write-Host "  Installing database migration dependencies..." -ForegroundColor Gray
Set-Location backend/shared/database
if (Test-Path "node_modules") {
    Write-Host "  ✓ Dependencies already installed" -ForegroundColor Green
} else {
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  ❌ Failed to install dependencies" -ForegroundColor Red
        Set-Location ../../..
        exit 1
    }
    Write-Host "  ✓ Dependencies installed" -ForegroundColor Green
}
Set-Location ../../..

# Install auth service dependencies
Write-Host "  Installing auth service dependencies..." -ForegroundColor Gray
Set-Location backend/services/auth-service
if (Test-Path "node_modules") {
    Write-Host "  ✓ Dependencies already installed" -ForegroundColor Green
} else {
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  ❌ Failed to install dependencies" -ForegroundColor Red
        Set-Location ../../..
        exit 1
    }
    Write-Host "  ✓ Dependencies installed" -ForegroundColor Green
}
Set-Location ../../..

# Install meetings service dependencies
Write-Host "  Installing meetings service dependencies..." -ForegroundColor Gray
Set-Location backend/services/meetings-service
if (Test-Path "node_modules") {
    Write-Host "  ✓ Dependencies already installed" -ForegroundColor Green
} else {
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  ❌ Failed to install dependencies" -ForegroundColor Red
        Set-Location ../../..
        exit 1
    }
    Write-Host "  ✓ Dependencies installed" -ForegroundColor Green
}
Set-Location ../../..

Write-Host ""
Write-Host "✅ Dependencies installed!" -ForegroundColor Green
Write-Host ""

# Check MySQL
Write-Host "🗄️  Step 2: Checking MySQL..." -ForegroundColor Yellow
$mysqlRunning = $false
try {
    $result = mysql -u root -e "SELECT 1;" 2>&1
    if ($LASTEXITCODE -eq 0) {
        $mysqlRunning = $true
        Write-Host "  ✓ MySQL is running" -ForegroundColor Green
    }
} catch {
    $mysqlRunning = $false
}

if (-not $mysqlRunning) {
    Write-Host "  ⚠ MySQL is not running" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  To start MySQL:" -ForegroundColor Cyan
    Write-Host "    1. Open Laragon" -ForegroundColor Gray
    Write-Host "    2. Click 'Start All' or just start MySQL" -ForegroundColor Gray
    Write-Host "    3. Wait for MySQL to start (green indicator)" -ForegroundColor Gray
    Write-Host "    4. Run this script again" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  Or if you have MySQL installed elsewhere:" -ForegroundColor Cyan
    Write-Host "    - Start MySQL service: net start MySQL80 (or your service name)" -ForegroundColor Gray
    Write-Host ""
    exit 1
}

# Setup database
Write-Host ""
Write-Host "🗄️  Step 3: Setting up database..." -ForegroundColor Yellow
Set-Location backend/shared/database
npm run setup
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ❌ Database setup failed" -ForegroundColor Red
    Set-Location ../../..
    exit 1
}
Set-Location ../../..

# Run migrations
Write-Host ""
Write-Host "🔄 Step 4: Running migrations..." -ForegroundColor Yellow
Set-Location backend/shared/database
npm run migrate:mysql
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ❌ Migrations failed" -ForegroundColor Red
    Set-Location ../../..
    exit 1
}
Set-Location ../../..

Write-Host ""
Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Create .env files for auth-service and meetings-service" -ForegroundColor Gray
Write-Host "  2. Start auth service: cd backend/services/auth-service && npm run dev" -ForegroundColor Gray
Write-Host "  3. Start meetings service: cd backend/services/meetings-service && npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "See docs/SETUP-WITHOUT-DOCKER.md for detailed instructions" -ForegroundColor Gray

