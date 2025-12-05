# Server Restart Commands

## Backend Server Restart

### Option 1: Stop and Start (Recommended)
```powershell
# Stop any running backend process on port 5000
Get-Process -Name node -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "*backend*" } | Stop-Process -Force
netstat -ano | findstr :5000
# If you see a PID, kill it: taskkill /PID <PID> /F

# Navigate to backend directory
cd backend

# Start backend server
npm start
```

### Option 2: Using Nodemon (Auto-restart on file changes)
```powershell
# Stop any running backend process
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force

# Navigate to backend directory
cd backend

# Start backend with nodemon (auto-restarts on file changes)
npm run dev
```

### Option 3: Quick Restart Script
```powershell
# One-liner to stop and restart
cd backend; Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force; Start-Sleep -Seconds 2; npm start
```

## Frontend Server Restart

### Option 1: Using Live Server (VS Code Extension)
1. Right-click on `index.html` or `dashboard.html`
2. Select "Open with Live Server"
3. Or use the Live Server extension button in VS Code

### Option 2: Using Python HTTP Server
```powershell
# Navigate to project root
cd "C:\OneDrive\Desktop\New Taxi Wala Partners"

# Stop any existing Python server
Get-Process -Name python -ErrorAction SilentlyContinue | Stop-Process -Force

# Start Python HTTP server (port 8000)
python -m http.server 8000
```

### Option 3: Using Node.js http-server
```powershell
# Install http-server globally (one time only)
npm install -g http-server

# Navigate to project root
cd "C:\OneDrive\Desktop\New Taxi Wala Partners"

# Stop any existing http-server
Get-Process -Name node -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*http-server*" } | Stop-Process -Force

# Start http-server (port 8080)
http-server -p 8080 -o
```

### Option 4: Direct File Opening (No Server)
Simply open `index.html` or `dashboard.html` directly in your browser (not recommended for API calls due to CORS)

## Complete Restart (Both Servers)

### PowerShell Script
```powershell
# Stop all Node processes
Write-Host "Stopping existing servers..." -ForegroundColor Yellow
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

# Start Backend
Write-Host "Starting Backend Server..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend'; npm start"

# Wait a bit for backend to start
Start-Sleep -Seconds 3

# Start Frontend (if using http-server)
Write-Host "Starting Frontend Server..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot'; http-server -p 8080 -o"

Write-Host "Both servers started!" -ForegroundColor Cyan
```

## Quick Reference

### Backend
- **Port**: 5000
- **URL**: http://localhost:5000
- **Start**: `cd backend && npm start`
- **Dev Mode**: `cd backend && npm run dev`

### Frontend
- **Port**: 8080 (http-server) or 8000 (Python) or Live Server default
- **URL**: http://localhost:8080 (or your chosen port)
- **Files**: `index.html`, `dashboard.html`, `my-bookings.html`

## Troubleshooting

### Port Already in Use
```powershell
# Find process using port 5000
netstat -ano | findstr :5000

# Kill process by PID (replace <PID> with actual PID)
taskkill /PID <PID> /F

# For port 8080
netstat -ano | findstr :8080
taskkill /PID <PID> /F
```

### Check if Servers are Running
```powershell
# Check backend
netstat -ano | findstr :5000

# Check frontend
netstat -ano | findstr :8080
```

