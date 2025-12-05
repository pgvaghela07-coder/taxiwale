@echo off
echo ========================================
echo  Tripeaz Taxi Partners - Start Servers
echo ========================================
echo.

echo [1/2] Starting Backend Server (Port 5000)...
start "Backend Server" cmd /k "cd backend && npm start"

timeout /t 3 /nobreak >nul

echo [2/2] Starting Frontend Server (Port 3000)...
start "Frontend Server" cmd /k "cd /d %~dp0 && node frontend/server.js"

timeout /t 2 /nobreak >nul

echo.
echo ========================================
echo  Servers Started!
echo ========================================
echo.
echo  Backend:  http://localhost:5000
echo  Frontend: http://localhost:3000
echo.
echo  Two command windows should have opened.
echo  Wait a few seconds, then open:
echo  http://localhost:3000 in your browser
echo.
echo  Press any key to exit this window...
pause >nul

