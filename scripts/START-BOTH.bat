@echo off
echo ========================================
echo Starting Both Servers
echo ========================================
echo.

echo Starting Backend Server (Port 5000)...
start "Backend Server" cmd /k "cd /d %~dp0backend && npm start"

timeout /t 3 /nobreak >nul

echo Starting Frontend Server (Port 3000)...
start "Frontend Server" cmd /k "cd /d %~dp0 && http-server -p 3000 -o"

echo.
echo ========================================
echo Both servers are starting!
echo ========================================
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:3000
echo.
echo Check the opened terminal windows for server status.
echo.
pause

