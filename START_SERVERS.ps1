# Tripeaz Taxi Partners - Start Servers Script
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host " Tripeaz Taxi Partners - Start Servers" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Stop any existing servers
Write-Host "[0/2] Stopping existing servers..." -ForegroundColor Yellow
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

# Start Backend Server
Write-Host "[1/2] Starting Backend Server (Port 5000)..." -ForegroundColor Green
$backendPath = Join-Path $PSScriptRoot "backend"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; Write-Host '🚀 Tripeaz Taxi Partners - Backend Server' -ForegroundColor Green; Write-Host 'Starting on http://localhost:5000...' -ForegroundColor Cyan; Write-Host ''; npm start" -WindowStyle Normal

Start-Sleep -Seconds 3

# Start Frontend Server
Write-Host "[2/2] Starting Frontend Server (Port 3000)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot'; Write-Host '🌐 Tripeaz Taxi Partners - Frontend Server' -ForegroundColor Green; Write-Host 'Starting on http://localhost:3000...' -ForegroundColor Cyan; Write-Host ''; node server.js" -WindowStyle Normal

Start-Sleep -Seconds 2

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Servers Started!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host " Backend:  http://localhost:5000" -ForegroundColor White
Write-Host " Frontend: http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host " Two PowerShell windows should have opened." -ForegroundColor Yellow
Write-Host " Wait a few seconds, then open:" -ForegroundColor Yellow
Write-Host " http://localhost:3000 in your browser" -ForegroundColor Green
Write-Host ""

