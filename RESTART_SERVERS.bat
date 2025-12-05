@echo off
echo.
echo ========================================
echo   Tripeaz Taxi Partners - Restart
echo ========================================
echo.

echo [1/3] Stopping all Node.js processes...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 /nobreak >nul

echo [2/3] Starting Backend Server...
start "Backend Server" cmd /k "cd /d %~dp0backend && npm start"

timeout /t 3 /nobreak >nul

echo [3/3] Starting Frontend Server...
start "Frontend Server" cmd /k "cd /d %~dp0 && node server.js"

echo.
echo ========================================
echo   Servers Started Successfully!
echo ========================================
echo.
echo Backend API: http://localhost:5000
echo Frontend:   http://localhost:3000
echo.
echo Press any key to exit...
pause >nul

