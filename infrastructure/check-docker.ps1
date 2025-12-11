# Check Docker Status Script
# Run this to verify Docker is ready before starting services

Write-Host "Checking Docker status..." -ForegroundColor Cyan

# Check if Docker is installed
try {
    $dockerVersion = docker --version
    Write-Host "✓ Docker installed: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Docker is not installed or not in PATH" -ForegroundColor Red
    Write-Host "  Please install Docker Desktop from https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
    exit 1
}

# Check if Docker daemon is running
try {
    $dockerInfo = docker info 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Docker daemon is running" -ForegroundColor Green
    } else {
        Write-Host "✗ Docker daemon is not running" -ForegroundColor Red
        Write-Host "  Please start Docker Desktop and wait for it to fully initialize" -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "✗ Cannot connect to Docker daemon" -ForegroundColor Red
    Write-Host "  Please start Docker Desktop" -ForegroundColor Yellow
    exit 1
}

# Check Docker Compose
try {
    $composeVersion = docker compose version
    Write-Host "✓ Docker Compose available: $composeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Docker Compose not available" -ForegroundColor Red
    exit 1
}

# Check if ports are available
$ports = @(3001, 3002, 3306, 5432, 6379)
$portsInUse = @()

foreach ($port in $ports) {
    $connection = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($connection) {
        $portsInUse += $port
    }
}

if ($portsInUse.Count -gt 0) {
    Write-Host "⚠ Warning: The following ports are already in use: $($portsInUse -join ', ')" -ForegroundColor Yellow
    Write-Host "  You may need to stop existing services or change ports in docker-compose.local.yml" -ForegroundColor Yellow
} else {
    Write-Host "✓ All required ports are available" -ForegroundColor Green
}

Write-Host "`nDocker is ready! You can now run:" -ForegroundColor Green
Write-Host "  docker compose -f docker-compose.local.yml up -d --build" -ForegroundColor Cyan

