# Start Servers Script
# Frontend on localhost:3000
# Backend on localhost:5000

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Starting Tripeaz Taxi Partners Servers" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Stop any existing processes
Write-Host "Stopping existing servers..." -ForegroundColor Yellow
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

# Get project root directory
$projectRoot = Split-Path -Parent $PSScriptRoot
if (-not $projectRoot) {
    $projectRoot = Get-Location
}

# Start Backend Server (Port 5000)
Write-Host ""
Write-Host "Starting Backend Server on http://localhost:5000..." -ForegroundColor Green
$backendPath = Join-Path $projectRoot "backend"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; Write-Host 'Backend Server Starting on http://localhost:5000' -ForegroundColor Green; npm start"

# Wait for backend to initialize
Start-Sleep -Seconds 3

# Start Frontend Server (Port 3000)
Write-Host ""
Write-Host "Starting Frontend Server on http://localhost:3000..." -ForegroundColor Green

# Check if http-server is installed
$httpServerInstalled = Get-Command http-server -ErrorAction SilentlyContinue

if (-not $httpServerInstalled) {
    Write-Host "http-server not found. Installing..." -ForegroundColor Yellow
    npm install -g http-server
}

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$projectRoot'; Write-Host 'Frontend Server Starting on http://localhost:3000' -ForegroundColor Green; http-server -p 3000 -o"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Servers Started Successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Backend:  http://localhost:5000" -ForegroundColor Yellow
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press any key to exit this script (servers will continue running)..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

