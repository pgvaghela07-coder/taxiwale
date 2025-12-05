# Start Servers - Frontend (Port 3000) & Backend (Port 5000)

## Quick Start Commands

### Option 1: Run the PowerShell Script (Easiest)
```powershell
# Navigate to project root
cd "C:\OneDrive\Desktop\New Taxi Wala Partners"

# Run the script
.\start-servers.ps1
```

### Option 2: Manual Commands

#### Start Backend (Port 5000)
```powershell
# Navigate to backend directory
cd backend

# Start backend server
npm start
```

#### Start Frontend (Port 3000)
```powershell
# Navigate to project root
cd "C:\OneDrive\Desktop\New Taxi Wala Partners"

# Install http-server globally (one time only)
npm install -g http-server

# Start frontend server on port 3000
http-server -p 3000 -o
```

## Complete Manual Start (Step by Step)

### Terminal 1 - Backend Server
```powershell
# Stop any existing Node processes
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force

# Navigate to backend
cd "C:\OneDrive\Desktop\New Taxi Wala Partners\backend"

# Start backend
npm start
```

### Terminal 2 - Frontend Server
```powershell
# Navigate to project root
cd "C:\OneDrive\Desktop\New Taxi Wala Partners"

# Start frontend on port 3000
http-server -p 3000 -o
```

## One-Liner Commands (Separate Terminals)

### Backend (Terminal 1)
```powershell
cd "C:\OneDrive\Desktop\New Taxi Wala Partners\backend"; Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force; npm start
```

### Frontend (Terminal 2)
```powershell
cd "C:\OneDrive\Desktop\New Taxi Wala Partners"; http-server -p 3000 -o
```

## Alternative: Using Python for Frontend

If you prefer Python instead of http-server:

```powershell
# Navigate to project root
cd "C:\OneDrive\Desktop\New Taxi Wala Partners"

# Start Python server on port 3000
python -m http.server 3000
```

## Stop Servers

### Stop All Servers
```powershell
# Stop all Node.js processes
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force

# Stop Python server (if using)
Get-Process -Name python -ErrorAction SilentlyContinue | Stop-Process -Force
```

### Stop Specific Port
```powershell
# Find process on port 5000 (Backend)
netstat -ano | findstr :5000
# Note the PID and kill it: taskkill /PID <PID> /F

# Find process on port 3000 (Frontend)
netstat -ano | findstr :3000
# Note the PID and kill it: taskkill /PID <PID> /F
```

## Verify Servers are Running

### Check Backend (Port 5000)
```powershell
# Check if port 5000 is listening
netstat -ano | findstr :5000

# Or test in browser/curl
# http://localhost:5000
```

### Check Frontend (Port 3000)
```powershell
# Check if port 3000 is listening
netstat -ano | findstr :3000

# Or test in browser
# http://localhost:3000
```

## URLs After Starting

- **Backend API**: http://localhost:5000
- **Backend Health**: http://localhost:5000/api/health (if available)
- **Frontend**: http://localhost:3000
- **Frontend Dashboard**: http://localhost:3000/dashboard.html
- **Frontend My Bookings**: http://localhost:3000/my-bookings.html

## Troubleshooting

### Port Already in Use

**Port 5000 (Backend):**
```powershell
netstat -ano | findstr :5000
# Copy the PID and run:
taskkill /PID <PID> /F
```

**Port 3000 (Frontend):**
```powershell
netstat -ano | findstr :3000
# Copy the PID and run:
taskkill /PID <PID> /F
```

### http-server Not Found
```powershell
# Install http-server globally
npm install -g http-server

# Verify installation
http-server --version
```

### Backend Not Starting
```powershell
# Check if dependencies are installed
cd backend
npm install

# Check for errors
npm start
```

## Development Mode (Auto-restart)

### Backend with Nodemon
```powershell
cd backend
npm run dev
```

This will auto-restart the backend when files change.

