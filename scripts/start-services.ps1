# Start FaithConnect Services
# Starts auth-service and meetings-service in separate terminals

Write-Host "🚀 Starting FaithConnect Services" -ForegroundColor Cyan
Write-Host ""

# Check if services are already running
$authPort = Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue
$meetingsPort = Get-NetTCPConnection -LocalPort 3002 -ErrorAction SilentlyContinue

if ($authPort) {
    Write-Host "⚠ Auth service is already running on port 3001" -ForegroundColor Yellow
}
if ($meetingsPort) {
    Write-Host "⚠ Meetings service is already running on port 3002" -ForegroundColor Yellow
}

Write-Host "Starting services in new windows..." -ForegroundColor Gray
Write-Host ""

# Start auth service
$authPath = Join-Path $PSScriptRoot "..\backend\services\auth-service"
Start-Process pwsh -ArgumentList "-NoExit", "-Command", "cd '$authPath'; Write-Host '🔐 Auth Service' -ForegroundColor Cyan; npm run dev"

# Wait a bit
Start-Sleep -Seconds 2

# Start meetings service
$meetingsPath = Join-Path $PSScriptRoot "..\backend\services\meetings-service"
Start-Process pwsh -ArgumentList "-NoExit", "-Command", "cd '$meetingsPath'; Write-Host '📞 Meetings Service' -ForegroundColor Cyan; npm run dev"

Write-Host "✅ Services started in new windows" -ForegroundColor Green
Write-Host ""
Write-Host "Check the new windows for service logs" -ForegroundColor Gray
Write-Host "Health checks:" -ForegroundColor Gray
Write-Host "  - Auth: http://localhost:3001/health" -ForegroundColor Gray
Write-Host "  - Meetings: http://localhost:3002/health" -ForegroundColor Gray

