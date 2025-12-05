# Tripeaz Taxi Partners - Restart Script
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Tripeaz Taxi Partners - Restart" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Step 1: Stop all Node.js processes
Write-Host "[1/3] Stopping all Node.js processes..." -ForegroundColor Yellow
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2
Write-Host "✅ All processes stopped`n" -ForegroundColor Green

# Step 2: Start Backend Server
Write-Host "[2/3] Starting Backend Server..." -ForegroundColor Yellow
$backendPath = Join-Path $PSScriptRoot "backend"
if (Test-Path (Join-Path $backendPath "package.json")) {
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; Write-Host '🚀 Backend Server Starting...' -ForegroundColor Green; npm start"
    Write-Host "✅ Backend server starting in new window`n" -ForegroundColor Green
} else {
    Write-Host "❌ package.json not found in backend directory`n" -ForegroundColor Red
}

# Step 3: Start Frontend Server
Start-Sleep -Seconds 3
Write-Host "[3/3] Starting Frontend Server..." -ForegroundColor Yellow
if (Test-Path (Join-Path $PSScriptRoot "frontend\server.js")) {
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot'; Write-Host '🌐 Frontend Server Starting...' -ForegroundColor Green; node frontend/server.js"
    Write-Host "✅ Frontend server starting in new window`n" -ForegroundColor Green
} else {
    Write-Host "❌ frontend/server.js not found`n" -ForegroundColor Red
}

# Summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Servers Started Successfully!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan
Write-Host "📋 Server URLs:" -ForegroundColor Yellow
Write-Host "  Backend API: http://localhost:5000" -ForegroundColor White
Write-Host "  Frontend:    http://localhost:3000" -ForegroundColor White
Write-Host "`n⏳ Please wait 5-10 seconds for servers to fully start...`n" -ForegroundColor Yellow

